import os
import json
import logging
import requests
from datetime import datetime, timedelta
from flask import Flask, jsonify
from flask_cors import CORS

PROMETHEUS_URL = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')
LOKI_URL       = os.getenv('LOKI_URL',       'http://loki:3100')
ZAMMAD_URL     = os.getenv('ZAMMAD_URL',     'http://zammad-docker-compose-zammad-nginx-1:8080')
ZAMMAD_TOKEN   = os.getenv('ZAMMAD_TOKEN',   '')
RCA_URL        = os.getenv('RCA_URL',        'http://rca-service:5000')

logging.basicConfig(level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger('bridge-api')

app = Flask(__name__)
CORS(app)

# ── Prometheus helpers ────────────────────────────────────────
def prom_query(query):
    try:
        resp = requests.get(f'{PROMETHEUS_URL}/api/v1/query',
            params={'query': query}, timeout=5)
        data = resp.json()
        if data['status'] == 'success' and data['data']['result']:
            return float(data['data']['result'][0]['value'][1])
        return 0.0
    except:
        return 0.0

def prom_query_range(query, minutes=60):
    try:
        end   = datetime.utcnow()
        start = end - timedelta(minutes=minutes)
        resp  = requests.get(f'{PROMETHEUS_URL}/api/v1/query_range', params={
            'query': query,
            'start': start.isoformat() + 'Z',
            'end':   end.isoformat()   + 'Z',
            'step':  '60s'
        }, timeout=5)
        data = resp.json()
        if data['status'] == 'success' and data['data']['result']:
            return data['data']['result'][0]['values']
        return []
    except:
        return []

# ── Loki helpers ──────────────────────────────────────────────
def loki_query(query, minutes=60, limit=50):
    try:
        end   = datetime.utcnow()
        start = end - timedelta(minutes=minutes)
        resp  = requests.get(f'{LOKI_URL}/loki/api/v1/query_range', params={
            'query':     query,
            'start':     int(start.timestamp() * 1e9),
            'end':       int(end.timestamp()   * 1e9),
            'limit':     limit,
            'direction': 'backward'
        }, timeout=5)
        data = resp.json()
        logs = []
        if data.get('status') == 'success':
            for stream in data.get('data', {}).get('result', []):
                for ts, line in stream.get('values', []):
                    logs.append({'ts': int(ts), 'line': line})
        return sorted(logs, key=lambda x: x['ts'], reverse=True)[:limit]
    except:
        return []

# ── Zammad helpers ────────────────────────────────────────────
def get_zammad_tickets(limit=20):
    if not ZAMMAD_TOKEN:
        return []
    try:
        resp = requests.get(
            f'{ZAMMAD_URL}/api/v1/tickets?per_page={limit}&page=1&sort_by=created_at&order_by=desc',
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
        return []
    except:
        return []

def get_zammad_ticket(ticket_id):
    if not ZAMMAD_TOKEN:
        return None
    try:
        resp = requests.get(
            f'{ZAMMAD_URL}/api/v1/tickets/{ticket_id}',
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
        return None
    except:
        return None

# ── RCA events from Grafana annotations ───────────────────────
def get_grafana_annotations():
    try:
        resp = requests.get(
            'http://grafana:3000/api/annotations?limit=50&tags=zeroops',
            auth=('admin', 'zeroops'),
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
        return []
    except:
        return []

# ── Format annotations as Silent Ops events ───────────────────
def format_as_silent_ops(annotations):
    events = []
    for ann in annotations:
        text    = ann.get('text', '')
        tags    = ann.get('tags', [])
        time_ms = ann.get('time', 0)
        dt      = datetime.utcfromtimestamp(time_ms / 1000)
        ts      = dt.strftime('%H:%M')

        # Determine pillar and outcome from tags
        if 'autonomous' in tags:
            pillar  = 1
            outcome = 'AUTO-RESOLVED'
            icon    = 'robot'
            highlight = True
        elif 'approved' in tags:
            pillar  = 2
            outcome = 'RESOLVED'
            icon    = 'check'
            highlight = True
        elif 'hitl' in tags:
            pillar  = 2
            outcome = 'AWAITING APPROVAL'
            icon    = 'user'
            highlight = False
        elif 'escalate' in tags:
            pillar  = 3
            outcome = 'ESCALATED'
            icon    = 'alert'
            highlight = False
        else:
            pillar  = 2
            outcome = 'RESOLVED'
            icon    = 'check'
            highlight = False

        # Extract title and root cause from annotation text
        lines      = text.split('\n')
        title      = lines[0].replace('**', '').strip() if lines else 'RCA Event'
        root_cause = ''
        for line in lines:
            if 'ROOT CAUSE' in line and len(lines) > lines.index(line) + 1:
                root_cause = lines[lines.index(line) + 1].strip()
                break

        action = f'{title} — {root_cause}' if root_cause else title

        events.append({
            'ts':        ts,
            'pillar':    pillar,
            'icon':      icon,
            'agent':     'ZeroOps Engine',
            'action':    action[:120],
            'outcome':   outcome,
            'dur':       '',
            'highlight': highlight,
            'time_ms':   time_ms
        })

    return sorted(events, key=lambda x: x['time_ms'], reverse=True)[:30]

# ── Format Zammad tickets as incidents ────────────────────────
def format_as_incidents(tickets):
    STATE_MAP = {1: 'Open', 2: 'Open', 3: 'Pending', 4: 'Closed'}
    PRI_MAP   = {1: 'P1', 2: 'P2', 3: 'P3'}
    incidents = []
    for t in tickets:
        state    = STATE_MAP.get(t.get('state_id', 1), 'Open')
        priority = PRI_MAP.get(t.get('priority_id', 2), 'P2')
        created  = t.get('created_at', '')
        closed   = t.get('close_at', '')

        # Calculate MTTR
        mttr = '—'
        if created and closed:
            try:
                diff = None
                for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']:
                    try:
                        c    = datetime.strptime(created[:26].rstrip('Z') + 'Z', fmt)
                        cl   = datetime.strptime(closed[:26].rstrip('Z')  + 'Z', fmt)
                        diff = int((cl - c).total_seconds())
                        break
                    except:
                        continue
                if diff is not None:
                    if diff < 60:
                        mttr = f'{diff}s'
                    elif diff < 3600:
                        mttr = f'{diff // 60}m {diff % 60}s'
                    else:
                        mttr = f'{diff // 3600}h {(diff % 3600) // 60}m'
            except:
                mttr = '—'

        incidents.append({
            'id':       t.get('number', t.get('id', '')),
            'title':    t.get('title', 'Unknown'),
            'status':   state,
            'priority': priority,
            'created':  created,
            'closed':   closed,
            'mttr':     mttr,
            'zammad_id': t.get('id')
        })
    return incidents

# ── Routes ────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'bridge-api'})

@app.route('/events')
def events():
    annotations = get_grafana_annotations()
    silent_ops  = format_as_silent_ops(annotations)
    return jsonify(silent_ops)

@app.route('/incidents')
def incidents():
    tickets  = get_zammad_tickets(limit=20)
    incident_list = format_as_incidents(tickets)
    return jsonify(incident_list)

@app.route('/incidents/<int:zammad_id>/rca')
def incident_rca(zammad_id):
    if not ZAMMAD_TOKEN:
        return jsonify({'error': 'No Zammad token'}), 401
    try:
        resp = requests.get(
            f'{ZAMMAD_URL}/api/v1/ticket_articles/by_ticket/{zammad_id}',
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=5
        )
        if resp.status_code != 200:
            return jsonify({'error': 'Ticket not found'}), 404

        articles = resp.json()
        rca_text  = ''
        for article in articles:
            body = article.get('body', '')
            if 'ROOT CAUSE' in body or 'CONFIDENCE' in body:
                rca_text = body
                break

        if not rca_text:
            return jsonify({'error': 'No RCA found'}), 404

        lines      = rca_text.split('\n')
        root_cause = confidence = risk_score = pillar = recommendation = ''
        causal_chain = []

        for i, line in enumerate(lines):
            line = line.strip()
            if 'ROOT CAUSE' in line and i + 1 < len(lines):
                root_cause = lines[i + 1].strip()
            elif 'CONFIDENCE' in line:
                import re
                nums = re.findall(r'\d+', line)
                if nums:
                    confidence = nums[0]
                if len(nums) > 1:
                    risk_score = nums[1]
            elif 'MODE' in line:
                if 'Autonomous' in line:
                    pillar = 'Autonomous'
                elif 'AI+HiTL' in line:
                    pillar = 'AI+HiTL'
                elif 'Human' in line:
                    pillar = 'Human+AI-Assist'
            elif 'RECOMMENDATION' in line and i + 1 < len(lines):
                recommendation = lines[i + 1].strip()
            elif line and line[0].isdigit() and '. ' in line:
                causal_chain.append(line[line.index('. ') + 2:])

        return jsonify({
            'root_cause':    root_cause,
            'confidence':    int(confidence) if confidence else 85,
            'risk_score':    int(risk_score)  if risk_score  else 45,
            'pillar':        pillar or 'AI+HiTL',
            'recommendation': recommendation,
            'causal_chain':  causal_chain
        })

    except Exception as e:
        logger.error(f'RCA fetch error: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/metrics')
def metrics():
    # Live KPIs from Prometheus
    request_rate  = prom_query('sum(rate(api_requests_total[5m]))')
    error_rate    = prom_query('sum(rate(api_errors_total[5m])) or vector(0)')
    queue_depth   = prom_query('queue_depth')
    api_health    = prom_query('probe_success{instance="http://demo-api:8080/health"}')
    crm_health    = prom_query('probe_success{instance="http://odoo:8069/web/health"}')
    p95_latency   = prom_query('histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))')

    # Ticket stats from Zammad
    tickets       = get_zammad_tickets(limit=100)
    total         = len(tickets)
    closed        = [t for t in tickets if t.get('state_id') == 4]
    auto_resolved = [t for t in closed if t.get('priority_id') == 1]

    # Calculate average MTTR from closed tickets
    mttr_values = []
    for t in closed:
        created = t.get('created_at', '')
        close   = t.get('close_at',   '')
        if created and close:
            for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']:
                try:
                    c  = datetime.strptime(created[:26].rstrip('Z') + 'Z', fmt)
                    cl = datetime.strptime(close[:26].rstrip('Z')   + 'Z', fmt)
                    mttr_values.append((cl - c).total_seconds())
                    break
                except:
                    continue

    avg_mttr = int(sum(mttr_values) / len(mttr_values)) if mttr_values else 0
    auto_rate = round(len(auto_resolved) / total * 100) if total > 0 else 0

    return jsonify({
        'request_rate':  round(request_rate, 3),
        'error_rate':    round(error_rate,   4),
        'queue_depth':   int(queue_depth),
        'api_health':    int(api_health),
        'crm_health':    int(crm_health),
        'p95_latency':   round(p95_latency, 3),
        'total_tickets': total,
        'closed_tickets': len(closed),
        'auto_rate':     auto_rate,
        'avg_mttr_seconds': avg_mttr,
        'avg_mttr_display': f'{avg_mttr}s' if avg_mttr < 60 else f'{avg_mttr // 60}m {avg_mttr % 60}s'
    })

@app.route('/agents')
def agents():
    # RCA service stats
    try:
        rca_health = requests.get(f'{RCA_URL}/health', timeout=3).json()
        pending    = rca_health.get('pending_approvals', 0)
        llm        = rca_health.get('llm', 'ollama')
    except:
        pending = 0
        llm     = 'unknown'

    # Annotation counts by type
    annotations  = get_grafana_annotations()
    autonomous   = len([a for a in annotations if 'autonomous' in a.get('tags', [])])
    hitl         = len([a for a in annotations if 'hitl'       in a.get('tags', [])])
    approved     = len([a for a in annotations if 'approved'   in a.get('tags', [])])
    escalated    = len([a for a in annotations if 'escalate'   in a.get('tags', [])])
    total_rca    = autonomous + hitl + escalated

    return jsonify({
        'rca_engine': {
            'name':             'RCA Engine',
            'llm':              llm,
            'total_analyses':   total_rca,
            'autonomous':       autonomous,
            'hitl':             hitl,
            'approved':         approved,
            'escalated':        escalated,
            'pending_approvals': pending,
            'success_rate':     round((autonomous + approved) / total_rca * 100) if total_rca > 0 else 0
        },
        'alert_correlator': {
            'name':  'Alert Correlator',
            'tool':  'Prometheus + Grafana',
            'notes': 'Evaluates rules every 15-30s'
        },
        'remediation_agent': {
            'name':       'Remediation Agent',
            'actions':    autonomous + approved,
            'autonomous': autonomous,
            'hitl':       approved
        }
    })

if __name__ == '__main__':
    logger.info('Bridge API starting...')
    app.run(host='0.0.0.0', port=5002, debug=False)