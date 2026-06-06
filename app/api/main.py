import os
import time
import random
import logging
import threading

import redis
import psycopg2
from flask import Flask, jsonify, request
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# OpenTelemetry — Traces
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

# OpenTelemetry — Metrics
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter

# OpenTelemetry — Logs
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter

# OpenTelemetry — Resources and Instrumentation
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.flask import FlaskInstrumentor


# ── Configuration ─────────────────────────────────────────────
OTEL_ENDPOINT = os.getenv('OTEL_ENDPOINT', 'http://otel-collector:4318')
REDIS_HOST    = os.getenv('REDIS_HOST', 'redis')
POSTGRES_DSN  = os.getenv('POSTGRES_DSN', 'postgresql://appuser:apppass@postgres:5432/enterprise_db')
SERVICE_NAME  = 'enterprise-api'

# ── Resource ──────────────────────────────────────────────────
resource = Resource.create({'service.name': SERVICE_NAME, 'service.version': '1.0.0'})

# ── Traces ────────────────────────────────────────────────────
tracer_provider = TracerProvider(resource=resource)
tracer_provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(endpoint=f'{OTEL_ENDPOINT}/v1/traces'))
)
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer(SERVICE_NAME)

# ── Metrics ───────────────────────────────────────────────────
metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(endpoint=f'{OTEL_ENDPOINT}/v1/metrics'),
    export_interval_millis=10000
)
meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
metrics.set_meter_provider(meter_provider)

# ── Logs ──────────────────────────────────────────────────────
log_provider = LoggerProvider(resource=resource)
log_provider.add_log_record_processor(
    BatchLogRecordProcessor(
        OTLPLogExporter(endpoint=f'{OTEL_ENDPOINT}/v1/logs')
    )
)
otel_handler = LoggingHandler(level=logging.INFO, logger_provider=log_provider)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)
logging.getLogger().addHandler(otel_handler)
logger = logging.getLogger(SERVICE_NAME)

# ── Flask ─────────────────────────────────────────────────────
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
from flask_cors import CORS
CORS(app)


# ── Prometheus metrics ────────────────────────────────────────
REQUEST_COUNT   = Counter('api_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('api_request_duration_seconds', 'Request latency', ['endpoint'])
QUEUE_DEPTH     = Gauge('queue_depth', 'Redis queue depth')
ORDER_COUNT     = Counter('orders_processed_total', 'Orders processed', ['status'])
ERROR_RATE      = Counter('api_errors_total', 'Total errors', ['type'])

# ── Chaos state ───────────────────────────────────────────────
chaos_state = {
    'slow_db':       False,
    'queue_buildup': False,
    'high_error':    False,
    'memory_leak':   False,
    'novel_failure': False,
}

def _leak_memory():
    """Gradually allocate memory to simulate a leak — 5MB every 10 seconds"""
    import time
    logger.warning('Memory leak simulation started — allocating 5MB every 10s')
    while chaos_state.get('memory_leak'):
        chunk = bytearray(5 * 1024 * 1024)  # 5MB
        _memory_leak_chunks.append(chunk)
        total_mb = len(_memory_leak_chunks) * 5
        logger.warning(f'Memory leak — total allocated: {total_mb}MB — {len(_memory_leak_chunks)} chunks')
        time.sleep(10)
    logger.info('Memory leak thread stopped')

# Memory leak storage — holds allocated chunks
_memory_leak_chunks = []

# ── Database ──────────────────────────────────────────────────
def get_db():
    return psycopg2.connect(POSTGRES_DSN)

def init_db():
    retries = 10
    while retries > 0:
        try:
            conn = get_db()
            cur  = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS orders (
                    id SERIAL PRIMARY KEY,
                    order_ref VARCHAR(50),
                    status VARCHAR(20),
                    amount DECIMAL(10,2),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            conn.commit()
            cur.close()
            conn.close()
            logger.info('Database initialised successfully')
            return
        except Exception as e:
            logger.warning(f'DB not ready, retrying... {e}')
            time.sleep(3)
            retries -= 1

# ── Redis ─────────────────────────────────────────────────────
def get_redis():
    return redis.Redis(host=REDIS_HOST, port=6379, decode_responses=True)

# ── Routes ────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': SERVICE_NAME})

@app.route('/metrics')
def prometheus_metrics():
    try:
        r = get_redis()
        QUEUE_DEPTH.set(r.llen('order_queue'))
    except:
        pass
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.route('/orders', methods=['POST'])
def create_order():
    start = time.time()
    with tracer.start_as_current_span('create_order') as span:
        try:
            if chaos_state['high_error'] and random.random() < 0.6:
                ERROR_RATE.labels(type='api_error').inc()
                logger.error('Order creation failed — high error chaos active')
                REQUEST_COUNT.labels(method='POST', endpoint='/orders', status='500').inc()
                return jsonify({'error': 'Service temporarily unavailable'}), 500

            data      = request.get_json() or {}
            order_ref = data.get('order_ref', f'ORD-{int(time.time())}')
            amount    = data.get('amount', round(random.uniform(10, 5000), 2))

            span.set_attribute('order.ref',    order_ref)
            span.set_attribute('order.amount', amount)

            delay = random.uniform(0.05, 0.15)
            delay = random.uniform(0.05, 0.15)
            if chaos_state['novel_failure']:
                if random.random() < 0.3:
                    ERROR_RATE.labels(type='novel_error').inc()
                    logger.error(f'NOVEL FAILURE — unexpected service mesh timeout — order {order_ref}')
                    REQUEST_COUNT.labels(method='POST', endpoint='/orders', status='503').inc()
                    return jsonify({'error': 'Unexpected upstream timeout — circuit breaker open'}), 503
                delay += random.uniform(1.5, 3.5)
                logger.warning(f'NOVEL FAILURE — degraded mode — latency {delay:.1f}s')
            
            if chaos_state['slow_db']:
                delay = random.uniform(2.0, 8.0)
                logger.warning(f'Slow DB detected — latency {delay:.1f}s — order {order_ref}')
            elif chaos_state['memory_leak'] and _memory_leak_chunks:
                leak_mb = len(_memory_leak_chunks) * 5
                if leak_mb > 50:
                    extra = min((leak_mb - 50) / 50, 4.0)
                    delay += extra
                    logger.warning(f'GC pressure — {leak_mb}MB leaked — adding {extra:.1f}s latency')

            time.sleep(delay)

            conn = get_db()
            cur  = conn.cursor()
            cur.execute(
                'INSERT INTO orders (order_ref, status, amount) VALUES (%s, %s, %s) RETURNING id',
                (order_ref, 'pending', amount)
            )
            order_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()

            r = get_redis()
            if not chaos_state['queue_buildup']:
                r.rpush('order_queue', order_id)

            ORDER_COUNT.labels(status='created').inc()
            REQUEST_COUNT.labels(method='POST', endpoint='/orders', status='201').inc()
            logger.info(f'Order created — ref={order_ref} id={order_id} amount={amount}')
            return jsonify({'id': order_id, 'order_ref': order_ref, 'status': 'pending'}), 201

        except Exception as e:
            ERROR_RATE.labels(type='db_error').inc()
            logger.error(f'Order creation error — {str(e)}')
            REQUEST_COUNT.labels(method='POST', endpoint='/orders', status='500').inc()
            return jsonify({'error': str(e)}), 500
        finally:
            REQUEST_LATENCY.labels(endpoint='/orders').observe(time.time() - start)

@app.route('/orders', methods=['GET'])
def list_orders():
    with tracer.start_as_current_span('list_orders'):
        try:
            conn = get_db()
            cur  = conn.cursor()
            cur.execute('SELECT id, order_ref, status, amount, created_at FROM orders ORDER BY created_at DESC LIMIT 20')
            rows = cur.fetchall()
            cur.close()
            conn.close()
            REQUEST_COUNT.labels(method='GET', endpoint='/orders', status='200').inc()
            return jsonify([{'id':r[0],'order_ref':r[1],'status':r[2],'amount':float(r[3]),'created_at':str(r[4])} for r in rows])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/queue/depth')
def queue_depth():
    try:
        r     = get_redis()
        depth = r.llen('order_queue')
        QUEUE_DEPTH.set(depth)
        return jsonify({'queue': 'order_queue', 'depth': depth})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chaos', methods=['POST'])
def set_chaos():
    data = request.get_json() or {}
    for key in chaos_state:
        if key in data:
            chaos_state[key] = bool(data[key])
            logger.warning(f'CHAOS ACTIVATED: {key} = {chaos_state[key]}')
    # Novel failure activates queue buildup automatically
    # Novel failure — stop worker consuming to build queue
    if 'novel_failure' in data:
        if bool(data['novel_failure']):
            logger.warning('NOVEL FAILURE — stopping demo-worker to build queue backlog')
            try:
                import docker
                client = docker.DockerClient(base_url='tcp://host.docker.internal:2375')
                client.containers.get('demo-worker').stop()
            except Exception as e:
                logger.warning(f'Could not stop worker: {e}')
        else:
            logger.warning('NOVEL FAILURE cleared — restarting demo-worker')
            try:
                import docker
                client = docker.DockerClient(base_url='tcp://host.docker.internal:2375')
                client.containers.get('demo-worker').start()
            except Exception as e:
                logger.warning(f'Could not start worker: {e}')
    # Start or stop memory leak thread
    if 'memory_leak' in data:
        if chaos_state['memory_leak']:
            threading.Thread(target=_leak_memory, daemon=True).start()
        else:
            _memory_leak_chunks.clear()
            logger.warning('Memory leak cleared — chunks released')
    return jsonify({'chaos_state': chaos_state})

@app.route('/chaos', methods=['GET'])
def get_chaos():
    return jsonify({'chaos_state': chaos_state})

@app.route('/restart', methods=['POST'])
def restart():
    import threading
    def delayed_exit():
        import time
        time.sleep(2)
        import os
        os._exit(0)
    threading.Thread(target=delayed_exit, daemon=True).start()
    logger.warning('Restart requested — shutting down for Docker restart')
    return jsonify({'status': 'restarting'})

@app.route('/crash', methods=['POST'])
def crash():
    import threading
    def delayed_crash():
        import time
        time.sleep(10)  # Stay down long enough for probe to detect
        import os
        os._exit(1)
    threading.Thread(target=delayed_crash, daemon=True).start()
    logger.warning('Crash simulation — exiting in 10s — Docker will restart')
    return jsonify({'status': 'crashing'})
    
# ── Load generator ────────────────────────────────────────────
def load_generator():
    time.sleep(15)
    logger.info('Load generator started — generating continuous order traffic')
    import urllib.request, json as _json
    while True:
        try:
            payload = _json.dumps({
                'order_ref': f'ORD-{int(time.time())}-{random.randint(100,999)}',
                'amount':    round(random.uniform(50, 10000), 2)
            }).encode()
            req = urllib.request.Request(
                'http://demo-api:8080/orders',
                data=payload,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            urllib.request.urlopen(req, timeout=10)
        except:
            pass
        time.sleep(random.uniform(1, 4))

# ── Main ──────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    threading.Thread(target=load_generator, daemon=True).start()
    app.run(host='0.0.0.0', port=8080, debug=False)
