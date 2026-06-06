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
RCA_URL        = os.getenv('RCA_URL',        'http://zeroops-service:5000')
NETBOX_URL   = os.getenv('NETBOX_URL', 'http://netbox:8080')
NETBOX_USER  = os.getenv('NETBOX_USER', 'admin')
NETBOX_PASS  = os.getenv('NETBOX_PASS', 'zeroops')
_netbox_session = None
_netbox_csrf    = None

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
        end   = datetime.now()
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
        end   = datetime.now()
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
            f'{ZAMMAD_URL}/api/v1/tickets/search?query=*&limit={limit}&sort_by=created_at&order_by=desc',
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=5
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get('value', data) if isinstance(data, dict) else data
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
        dt = datetime.fromtimestamp(time_ms / 1000)
        ts = dt.isoformat()

        # Determine pillar and outcome from tags
        if 'suppressed' in tags or 'false-positive' in tags:
            pillar  = 1
            outcome = 'SUPPRESSED'
            icon    = 'alert'
            highlight = False
        elif 'correlator' in tags or 'detected' in tags:
            pillar  = 1
            outcome = 'DETECTED'
            icon    = 'alert'
            highlight = False
        elif 'diagnosed' in tags:
            pillar  = 1
            outcome = 'DIAGNOSED'
            icon    = 'robot'
            highlight = False
        elif 'ticket' in tags and 'created' in tags:
            pillar  = 1
            outcome = 'TICKET CREATED'
            icon    = 'ticket'
            highlight = False
        elif 'autonomous' in tags:
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
        root_cause = ''
        dur = ''
        for line in lines:
            if 'ROOT CAUSE' in line and len(lines) > lines.index(line) + 1:
                root_cause = lines[lines.index(line) + 1].strip()
            if 'MTTR:' in line:
                dur = line.split('MTTR:')[-1].strip()

        # Determine agent name based on outcome and tags
        if 'suppressed' in tags or 'false-positive' in tags:
            agent_name = 'Alert Correlator'
        elif 'autonomous' in tags:
            agent_name = 'Remediation Agent'
        elif 'approved' in tags:
            agent_name = 'Remediation Agent'
        elif 'hitl' in tags:
            agent_name = 'RCA Engine'
        else:
            agent_name = 'RCA Engine'

        # Clean up action text — remove ZeroOps RCA prefix, use root cause
        alert_name = ''
        for line in lines:
            for key in ['CRMURLDown','CRMSlowResponse','ServiceURLDown','ServiceSlowResponse',
                        'HighQueueDepth','HighErrorRate','HighLatency','MemoryLeakDetected']:
                if key in line:
                    alert_name = key
                    break

        CLEAN_ACTIONS = {
            'CRMURLDown':          ('Alert Correlator', 'Odoo CRM — health probe failure detected and correlated'),
            'CRMSlowResponse':     ('RCA Engine',       'Odoo CRM — response time degradation diagnosed'),
            'ServiceURLDown':      ('Alert Correlator', 'Order API — service unreachable — probe failure correlated'),
            'ServiceSlowResponse': ('RCA Engine',       'Order API — latency degradation diagnosed'),
            'HighQueueDepth':      ('Alert Correlator', 'Order Worker — queue backlog detected — consumer down'),
            'HighErrorRate':       ('RCA Engine',       'Order API — elevated error rate diagnosed'),
            'HighLatency':         ('RCA Engine',       'Order API — P95 latency SLA breach diagnosed'),
            'MemoryLeakDetected':  ('RCA Engine',       'Order API — memory leak detected — OOM risk projected'),
            'NovelFailure':        ('RCA Engine',       'Order API — novel failure pattern — unknown signature'),
            'SAPWorkProcessSaturation': ('Alert Correlator', 'SAP S/4HANA — dialog work process pool saturated'),
            'SAPiDocQueueBackup':       ('Alert Correlator', 'SAP S/4HANA — iDoc inbound queue backing up'),
            'SAPBatchJobFailure':       ('RCA Engine',       'SAP S/4HANA — batch job aborted — payroll at risk'),
            'SAPHANASlowdown':          ('RCA Engine',       'SAP S/4HANA — HANA database response degraded'),
        }

        # Override agent name based on outcome
        if outcome == 'DETECTED':
            agent_name = 'Alert Correlator'
        elif outcome == 'DIAGNOSED':
            agent_name = 'RCA Engine'
        elif outcome == 'TICKET CREATED':
            agent_name = 'Zammad'
        elif outcome in ('AUTO-RESOLVED', 'RESOLVED'):
            agent_name = 'Remediation Agent'
        else:
            agent_name = 'RCA Engine'

        if alert_name and alert_name in CLEAN_ACTIONS:
            agent_name, base_action = CLEAN_ACTIONS[alert_name]
            if outcome == 'DETECTED':
                agent_name = 'Alert Correlator'
                action = f'{base_action}'
            elif outcome == 'DIAGNOSED':
                agent_name = 'RCA Engine'
                action = f'{base_action} — root cause identified'
            elif outcome == 'TICKET CREATED':
                agent_name = 'Zammad'
                action = f'{base_action} — incident ticket created'
            elif outcome == 'AUTO-RESOLVED':
                agent_name = 'Remediation Agent'
                action = f'{base_action} — resolved autonomously'
            elif outcome == 'RESOLVED':
                agent_name = 'Remediation Agent'
                action = f'{base_action} — resolved after engineer approval'
            elif outcome == 'AWAITING APPROVAL':
                agent_name = 'RCA Engine'
                action = f'{base_action} — awaiting engineer approval'
            elif outcome == 'SUPPRESSED':
                agent_name = 'Alert Correlator'
                action = f'{base_action} — suppressed as false positive'
            else:
                action = base_action
        else:
            action = root_cause if root_cause else title.replace('ZeroOps RCA — ', '').replace('ZeroOps HiTL — ', '')

        events.append({
            'ts':        ts,
            'pillar':    pillar,
            'icon':      icon,
            'agent':     agent_name,
            'action':    action[:120],
            'outcome':   outcome,
            'dur': dur,
            'highlight': highlight,
            'time_ms':   time_ms,
        })

    return sorted(events, key=lambda x: x.get('time_ms', 0), reverse=True)[:30]

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

        # Determine assigned based on state and priority
        if state == 'Closed' and priority == 'P1':
            assigned = 'ZeroOps Autonomous'
        elif state == 'Closed' and priority == 'P2':
            assigned = 'ZeroOps + Engineer'
        else:
            assigned = 'ZeroOps Engine'

        incidents.append({
            'id':        t.get('number', t.get('id', '')),
            'title':     t.get('title', 'Unknown'),
            'status':    state,
            'priority':  priority,
            'created':   created,
            'closed':    closed,
            'mttr':      mttr,
            'zammad_id': t.get('id'),
            'assigned':  assigned
        })

    return incidents

# ── Routes ────────────────────────────────────────────────────

@app.route('/health')
# NetBox session for CMDB queries


def get_netbox_session():
    global _netbox_session, _netbox_csrf
    try:
        s = requests.Session()
        login_page = s.get(f'{NETBOX_URL}/login/', timeout=5)
        import re
        csrf = re.search(r'csrfmiddlewaretoken.*?value="([^"]+)"', login_page.text)
        if not csrf:
            return None
        _netbox_csrf = csrf.group(1)
        s.post(f'{NETBOX_URL}/login/', data={
            'username': NETBOX_USER,
            'password': NETBOX_PASS,
            'csrfmiddlewaretoken': _netbox_csrf
        }, headers={'Referer': f'{NETBOX_URL}/login/'}, timeout=5)
        _netbox_session = s
        return s
    except Exception as e:
        logger.error(f'NetBox login failed: {e}')
        return None

@app.route('/cmdb')
def cmdb():
    try:
        s = get_netbox_session()
        if not s:
            return jsonify({'error': 'NetBox unavailable', 'vms': []})
        resp = s.get(
            f'{NETBOX_URL}/api/virtualization/virtual-machines/?limit=50',
            timeout=5
        )
        if resp.status_code != 200:
            return jsonify({'error': f'NetBox error {resp.status_code}', 'vms': []})
        data = resp.json()
        vms = []
        for vm in data.get('results', []):
            cf = vm.get('custom_fields', {})
            vms.append({
                'id':                vm.get('id'),
                'name':              vm.get('name'),
                'status':            vm.get('status', {}).get('value', 'active'),
                'cluster':           vm.get('cluster', {}).get('name', ''),
                'site':              vm.get('site', {}).get('name', '') if vm.get('site') else '',
                'comments':          vm.get('comments', ''),
                'zeroops_monitored': cf.get('zeroops_monitored', False),
                'health_endpoint':   cf.get('health_endpoint', ''),
                'monitoring_url':    cf.get('monitoring_url', ''),
            })
        return jsonify({'count': len(vms), 'vms': vms})
    except Exception as e:
        logger.error(f'CMDB error: {e}')
        return jsonify({'error': str(e), 'vms': []})
        
def health():
    return jsonify({'status': 'ok', 'service': 'bridge-api'})

@app.route('/events')
def events():
    annotations = get_grafana_annotations()
    silent_ops  = format_as_silent_ops(annotations)
    return jsonify(silent_ops)

@app.route('/incidents')
def incidents():
    tickets  = get_zammad_tickets(limit=200)
    tickets = [t for t in tickets if 'KB AUTO-CREATED' not in t.get('title', '')]
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
            'causal_chain':  causal_chain,
            
        })

    except Exception as e:
        logger.error(f'RCA fetch error: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/incidents/<int:zammad_id>/similar')
def similar_incidents(zammad_id):
    try:
        source = get_zammad_ticket(zammad_id)
        if not source:
            return jsonify([])
        source_title = source.get('title', '')
        alert_keywords = {
            'CRMURLDown':         ['CRMURLDown', 'Odoo CRM', 'Health probe'],
            'CRMSlowResponse':    ['CRMSlowResponse', 'CRM', 'Response time'],
            'ServiceURLDown':     ['ServiceURLDown', 'Order API', 'Service unreachable'],
            'HighErrorRate':      ['HighErrorRate', 'Elevated error'],
            'HighQueueDepth':     ['HighQueueDepth', 'Queue backlog'],
            'MemoryLeakDetected': ['MemoryLeakDetected', 'Memory leak'],
            'HighLatency':        ['HighLatency', 'P95 latency'],
        }
        matched_type = None
        for alert_type, keywords in alert_keywords.items():
            if any(k in source_title for k in keywords):
                matched_type = alert_type
                break
        if not matched_type:
            return jsonify([])
        all_tickets = get_zammad_tickets(limit=100)
        similar = []
        for t in all_tickets:
            if t.get('id') == zammad_id:
                continue
            title = t.get('title', '')
            keywords = alert_keywords.get(matched_type, [])
            if any(k in title for k in keywords) and t.get('state_id') == 4:
                created = t.get('created_at', '')
                closed  = t.get('close_at', '')
                mttr = '—'
                if created and closed:
                    try:
                        for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']:
                            try:
                                c  = datetime.strptime(created[:26].rstrip('Z') + 'Z', fmt)
                                cl = datetime.strptime(closed[:26].rstrip('Z')   + 'Z', fmt)
                                diff = int((cl - c).total_seconds())
                                mttr = f'{diff}s' if diff < 60 else f'{diff//60}m {diff%60}s'
                                break
                            except:
                                continue
                    except:
                        pass
                similar.append({
                    'id':      t.get('number', t.get('id')),
                    'title':   title,
                    'created': created,
                    'mttr':    mttr,
                    'zammad_id': t.get('id')
                })
            if len(similar) >= 5:
                break
        return jsonify(similar)
    except Exception as e:
        logger.error(f'Similar incidents error: {e}')
        return jsonify([])

@app.route('/metrics')
def metrics():
    # Live KPIs from Prometheus
    # Live KPIs from Prometheus
    request_rate  = prom_query('sum(rate(api_requests_total[5m]))')
    error_rate    = prom_query('sum(rate(api_errors_total[5m])) or vector(0)')
    queue_depth   = prom_query('queue_depth')
    api_health    = prom_query('probe_success{instance="http://demo-api:8080/health"}')
    crm_health    = prom_query('probe_success{instance="http://odoo:8069/web/health"}')
    api_memory_mb = round((prom_query('process_resident_memory_bytes{job="demo-api"}') or 0) / 1024 / 1024)
    p95_latency   = prom_query('histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))')
    odoo_processing = prom_query('sum(probe_http_duration_seconds{instance="http://odoo:8069/web/health",job="blackbox"})')
    db_response_ms  = round(odoo_processing * 1000) if (crm_health and odoo_processing > 0) else 120
    
    
    # PostgreSQL metrics via postgres-exporter
    crm_pool_used  = int(prom_query('pg_stat_activity_count{datname="odoo_crm"}') or 0)

    # Ticket stats from Zammad
    tickets       = get_zammad_tickets(limit=100)
    total         = len(tickets)
    closed        = [t for t in tickets if t.get('state_id') == 4]
    auto_resolved = [t for t in closed if t.get('priority_id') == 1]

    # Calculate average MTTR from closed tickets
    mttr_values = []
    cutoff = datetime.now() - timedelta(days=7)
    for t in closed:
        created = t.get('created_at', '')
        close   = t.get('close_at',   '')
        if created and close:
            for fmt in ['%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%SZ']:
                try:
                    c  = datetime.strptime(created[:26].rstrip('Z') + 'Z', fmt)
                    cl = datetime.strptime(close[:26].rstrip('Z')   + 'Z', fmt)
                    diff = (cl - c).total_seconds()
                    # Only include tickets with realistic MTTR (under 30 minutes)
                    if 5 < diff < 1800 and c > cutoff:
                        mttr_values.append(diff)
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
        'avg_mttr_display': f'{avg_mttr}s' if avg_mttr < 60 else f'{avg_mttr // 60}m {avg_mttr % 60}s',
        'db_response_ms':  db_response_ms,
        'db_pool_used':    int(prom_query('pg_stat_database_numbackends{datname="postgres"}') or 0),
        'api_memory_mb':             api_memory_mb,
        'sap_wp_dialog_used_pct':    round(prom_query('sap_wp_dialog_used_pct') or 0, 1),
        'sap_dialog_response_ms':    round(prom_query('sap_dialog_response_ms') or 0, 0),
        'sap_idoc_queue_depth':      round(prom_query('sap_idoc_queue_depth') or 0, 0),
        'sap_batch_queue_depth':     round(prom_query('sap_batch_queue_depth') or 0, 0),
        'sap_hana_cpu_pct':          round(prom_query('sap_hana_cpu_pct') or 0, 1),
        'sap_hana_memory_pct':       round(prom_query('sap_hana_memory_pct') or 0, 1),
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


