import os
import json
import uuid
import logging
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from openai import OpenAI

# -- Configuration ---------------------------------------------
PROMETHEUS_URL = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')
LOKI_URL       = os.getenv('LOKI_URL',       'http://loki:3100')
GRAFANA_URL    = os.getenv('GRAFANA_URL',    'http://grafana:3000')
GRAFANA_USER   = os.getenv('GRAFANA_USER',   'admin')
GRAFANA_PASS   = os.getenv('GRAFANA_PASS',   'zeroops')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
DASHBOARD_UID  = os.getenv('DASHBOARD_UID',  '')
SLACK_WEBHOOK  = os.getenv('SLACK_WEBHOOK',  '')
OLLAMA_URL     = os.getenv('OLLAMA_URL',     'http://host.docker.internal:11434/v1')
OLLAMA_MODEL   = os.getenv('OLLAMA_MODEL',   'gpt-oss:20b')
USE_OLLAMA     = os.getenv('USE_OLLAMA',     'true').lower() == 'true'
RCA_BASE_URL   = os.getenv('RCA_BASE_URL',   'http://localhost:5001')

ZAMMAD_URL     = os.getenv('ZAMMAD_URL',   'http://zammad-nginx:8080')
ZAMMAD_TOKEN   = os.getenv('ZAMMAD_TOKEN', '')

logging.basicConfig(level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger('rca-service')

app = Flask(__name__)

# -- Pending HiTL approvals ------------------------------------
pending = {}
# Track currently firing alerts to suppress redundant ones
active_alerts = set()

# Load configuration from JSON files
import json as _json
from pathlib import Path

def _load(fname):
    p = Path(__file__).parent / 'config' / fname
    with open(p, 'r', encoding='utf-8-sig') as f:
        return _json.load(f)

ALERT_TITLES        = _load('alert_titles.json')
AUTONOMOUS_OVERRIDES = _load('autonomous_overrides.json')
HITL_OVERRIDES       = _load('hitl_overrides.json')
SUPPRESS_RULES       = _load('suppress_rules.json')
REMEDIATIONS         = _load('remediations.json')
IGNORED_ALERTS       = _load('ignored_alerts.json')

# -- Prometheus query ------------------------------------------
def query_prometheus(promql, minutes=30):
    try:
        end   = datetime.now()
        start = end - timedelta(minutes=minutes)
        resp  = requests.get(f'{PROMETHEUS_URL}/api/v1/query_range', params={
            'query': promql,
            'start': start.isoformat() + 'Z',
            'end':   end.isoformat()   + 'Z',
            'step':  '30s'
        }, timeout=10)
        data = resp.json()
        if data['status'] == 'success' and data['data']['result']:
            results = []
            for series in data['data']['result']:
                values = series['values']
                latest = float(values[-1][1]) if values else 0
                results.append({'labels': series['metric'], 'latest': round(latest, 4)})
            return results
        return []
    except Exception as e:
        logger.error(f'Prometheus query failed: {e}')
        return []

# -- Loki query ------------------------------------------------
def query_loki(query, minutes=15, limit=20):
    try:
        end   = datetime.now()
        start = end - timedelta(minutes=minutes)
        resp  = requests.get(f'{LOKI_URL}/loki/api/v1/query_range', params={
            'query': query, 'limit': limit, 'direction': 'backward',
            'start': int(start.timestamp() * 1e9),
            'end':   int(end.timestamp()   * 1e9),
        }, timeout=10)
        data = resp.json()
        logs = []
        if data.get('status') == 'success':
            for stream in data.get('data', {}).get('result', []):
                for ts, line in stream.get('values', []):
                    logs.append(line)
        return logs[:limit]
    except Exception as e:
        logger.error(f'Loki query failed: {e}')
        return []

# -- Grafana annotation ----------------------------------------
def post_grafana_annotation(title, text, tags=None):
    try:
        payload = {
            'text': f'**{title}**\n\n{text}',
            'tags': tags or ['zeroops', 'rca', 'ai'],
            'time': int(datetime.now().timestamp() * 1000)
        }
        if DASHBOARD_UID:
            payload['dashboardUID'] = DASHBOARD_UID
        requests.post(f'{GRAFANA_URL}/api/annotations',
            json=payload, auth=(GRAFANA_USER, GRAFANA_PASS), timeout=10)
        logger.info('Grafana annotation posted successfully')
    except Exception as e:
        logger.error(f'Failed to post Grafana annotation: {e}')

# -- Slack message ---------------------------------------------
def post_slack_hitl(alert_name, rca, token):
    if not SLACK_WEBHOOK:
        logger.warning('No Slack webhook configured')
        return

    confidence = rca.get('confidence', 0)
    filled     = int(confidence / 10)
    bar        = '¦' * filled + '¦' * (10 - filled)
    chain      = rca.get('causal_chain', [])
    chain_text = '\n'.join([f'{i+1}. {s}' for i, s in enumerate(chain)])

    remediation = REMEDIATIONS.get(alert_name, {})
    action_desc = remediation.get('desc', 'Manual investigation required')

    approve_url = f'{RCA_BASE_URL}/approve/{token}'
    reject_url  = f'{RCA_BASE_URL}/reject/{token}'

    blocks = [
        {
            'type': 'header',
            'text': {'type': 'plain_text', 'text': f'?? ZeroOps HiTL — {alert_name}'}
        },
        {
            'type': 'section',
            'text': {'type': 'mrkdwn', 'text':
                f'*?? Root Cause*\n{rca.get("root_cause", "Unknown")}\n\n'
                f'*?? Confidence* [{bar}] {confidence}%\n'
                f'*? Risk Score* {rca.get("risk_score", "N/A")}/100\n'
                f'*?? Mode* {rca.get("pillar", "AI+HiTL")}'
            }
        },
        {
            'type': 'section',
            'text': {'type': 'mrkdwn', 'text':
                f'*? Causal Chain*\n{chain_text}\n\n'
                f'*?? Impact*\n{rca.get("impact", "Unknown")}'
            }
        },
        {
            'type': 'section',
            'text': {'type': 'mrkdwn', 'text':
                f'*⚡ Proposed Remediation*\n{action_desc}'
            }
        },
    ]

    # Add novel runbook steps if present
    novel_runbook = rca.get('novel_runbook', [])
    if novel_runbook:
        runbook_text = '*📋 Novel Runbook — Generated by Ollama from first principles*\n'
        runbook_text += '_No historical match found — AI-generated remediation plan_\n\n'
        for step in novel_runbook:
            runbook_text += f'*Step {step["step"]}:* {step["action"]}\n'
            runbook_text += f'_↳ {step["rationale"]}_\n\n'
        blocks.append({
            'type': 'section',
            'text': {'type': 'mrkdwn', 'text': runbook_text}
        })
        blocks.append({'type': 'divider'})

    blocks += [
        {'type': 'divider'},
        {
            'type': 'actions',
            'elements': [
                {
                    'type': 'button',
                    'text': {'type': 'plain_text', 'text': '? Approve & Execute'},
                    'url':   approve_url,
                    'style': 'primary'
                },
                {
                    'type': 'button',
                    'text': {'type': 'plain_text', 'text': '? Reject'},
                    'url':   reject_url,
                    'style': 'danger'
                }
            ]
        },
        {
            'type': 'context',
            'elements': [{'type': 'mrkdwn',
                'text': f'?? ZeroOps RCA Engine · Token: `{token[:8]}...` · {datetime.now().strftime("%H:%M:%S UTC")}'
            }]
        }
    ]

    try:
        resp = requests.post(SLACK_WEBHOOK, json={'blocks': blocks}, timeout=10)
        if resp.status_code == 200:
            logger.info(f'Slack HiTL message sent — token: {token[:8]}')
        else:
            logger.error(f'Slack failed: {resp.status_code} {resp.text}')
    except Exception as e:
        logger.error(f'Slack error: {e}')

# -- Zammad ticket management ----------------------------------
def create_zammad_ticket(alert_name, rca, priority_id=2):
    if not ZAMMAD_TOKEN:
        logger.warning('No Zammad token configured')
        return None
    try:
        risk  = rca.get('risk_score', 50)
        # Map risk score to Zammad priority
        # 1=low, 2=normal, 3=high
        if risk < 25:
            priority_id = 1
        elif risk < 75:
            priority_id = 2
        else:
            priority_id = 3

        body = f"""ZeroOps AI-Powered Root Cause Analysis
???????????????????????????

?? ROOT CAUSE
{rca.get('root_cause', 'Unknown')}

?? CONFIDENCE: {rca.get('confidence', 0)}%
?  RISK SCORE: {rca.get('risk_score', 'N/A')}/100
?? MODE: {rca.get('pillar', 'Unknown')}

? CAUSAL CHAIN
{chr(10).join([f"{i+1}. {s}" for i, s in enumerate(rca.get('causal_chain', []))])}

?? IMPACT
{rca.get('impact', 'Unknown')}

? RECOMMENDATION
{rca.get('recommendation', 'None')}

???????????????????????????
Generated by ZeroOps RCA Engine · {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}"""

        payload = {
            'title':       f'{ALERT_TITLES.get(alert_name, alert_name)} — Auto-detected by ZeroOps',
            'group':       'Users',
            'priority_id': priority_id,
            'customer':    'admin@enterprise.com',
            'article': {
                'subject': f'{ALERT_TITLES.get(alert_name, alert_name)}',
                'body':    body,
                'type':    'note',
                'internal': False
            }
        }

        resp = requests.post(
            f'{ZAMMAD_URL}/api/v1/tickets',
            json=payload,
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=10
        )

        if resp.status_code in [200, 201]:
            ticket = resp.json()
            ticket_id = ticket.get('id')
            ticket_number = ticket.get('number')
            logger.info(f'Zammad ticket created — #{ticket_number} (id:{ticket_id})')
            return ticket_id
        else:
            logger.error(f'Zammad ticket creation failed: {resp.status_code} {resp.text}')
            return None
    except Exception as e:
        logger.error(f'Zammad error: {e}')
        return None


def close_zammad_ticket(ticket_id, resolution, mttr_seconds=None):
    if not ZAMMAD_TOKEN or not ticket_id:
        return
    try:
        mttr_str = f'{int(mttr_seconds)}s' if mttr_seconds else 'N/A'

        # Add resolution note
        requests.post(
            f'{ZAMMAD_URL}/api/v1/ticket_articles',
            json={
                'ticket_id': ticket_id,
                'subject':   'Resolution — ZeroOps Automated',
                'body':      f'? RESOLVED\n\n{resolution}\n\nMTTR: {mttr_str}\n\n?? Closed automatically by ZeroOps RCA Engine',
                'type':      'note',
                'internal':  False
            },
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=10
        )

        # Close the ticket — state_id 4 = closed
        resp = requests.put(
            f'{ZAMMAD_URL}/api/v1/tickets/{ticket_id}',
            json={'state_id': 4},
            headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
            timeout=10
        )

        if resp.status_code == 200:
            logger.info(f'Zammad ticket #{ticket_id} closed — MTTR: {mttr_str}')
        else:
            logger.error(f'Zammad close failed: {resp.status_code}')
    except Exception as e:
        logger.error(f'Zammad close error: {e}')

# -- Execute remediation ---------------------------------------
def execute_remediation(alert_name):
    remediation = REMEDIATIONS.get(alert_name)
    if not remediation:
        return f'No remediation defined for {alert_name}'

    action = remediation['action']
    params = remediation.get('params', {})

    if action == 'disable_chaos':
        try:
            resp = requests.post(
                'http://demo-api:8080/chaos',
                json=params, timeout=10
            )
            if resp.status_code == 200:
                result = f'Remediation executed — chaos disabled: {params}'
                logger.info(result)
                return result
        except Exception as e:
            return f'Remediation failed: {e}'
    elif action == 'call_endpoint':
        url    = remediation.get('url', '')
        method = remediation.get('method', 'POST')
        body   = remediation.get('body', {})
        try:
            resp = requests.request(method, url, json=body, timeout=5)
            result = f'Endpoint called — {url} — HTTP {resp.status_code}'
            logger.info(result)
            return result
        except requests.exceptions.ConnectionError:
            result = f'Service restarting — connection closed as expected'
            logger.info(result)
            return result
        except Exception as e:
            return f'Endpoint call failed: {e}'
    elif action == 'restart_service':
        target = remediation.get('target', '')
        try:
            import docker
            client = docker.DockerClient(
                base_url='tcp://host.docker.internal:2375'
            )
            container = client.containers.get(target)
            action_type = remediation.get('restart_type', 'start')
            if action_type == 'restart' or container.status == 'running':
                container.restart()
                result = f'Container {target} restarted successfully'
            else:
                container.start()
                result = f'Container {target} started successfully'
            return result
        except Exception as e:
            logger.error(f'Container start failed: {e}')
            return f'Container start failed: {e}'

    return f'Unknown action: {action}'

# -- Build context ---------------------------------------------
def build_context(alert_name, alert_labels):
    logger.info(f'Building context for alert: {alert_name}')
    return {
        'request_rate':   query_prometheus('rate(api_requests_total[2m])'),
        'error_rate':     query_prometheus('rate(api_errors_total[2m])'),
        'queue_depth':    query_prometheus('queue_depth'),
        'latency_p95':    query_prometheus('histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))'),
        'db_connections': query_prometheus('pg_stat_activity_count'),
        'error_logs':     query_loki('{service_name="enterprise-api"} |= "ERROR" != "WSGI"', minutes=15),
        'warning_logs':   query_loki('{service_name="enterprise-api"} |= "WARNING" != "WSGI"', minutes=15),
        'recent_logs':    query_loki('{service_name="enterprise-api"} != "werkzeug"', minutes=5, limit=10),
    }

def generate_novel_runbook(alert_name, context):
    """When no KEDB match — Ollama generates runbook from first principles"""
    logger.info(f'Novel pattern detected for {alert_name} — generating runbook from first principles')
    
    prompt = f"""You are an expert SRE diagnosing a novel failure pattern never seen before.

ALERT: {alert_name}
TELEMETRY EVIDENCE:
- Error rate: {context.get('error_rate', 'unknown')}
- Queue depth: {context.get('queue_depth', 'unknown')} 
- Request rate: {context.get('request_rate', 'unknown')}
- P95 latency: {context.get('p95_latency', 'unknown')}
- API health: {'UP' if context.get('api_health') else 'DOWN'}

This pattern does not match any known incident in our knowledge base.
Generate a step-by-step remediation runbook from first principles.

Respond ONLY with valid JSON:
{{
  "root_cause": "your diagnosis",
  "confidence": 45,
  "runbook": [
    {{"step": 1, "action": "first step", "rationale": "why"}},
    {{"step": 2, "action": "second step", "rationale": "why"}},
    {{"step": 3, "action": "third step", "rationale": "why"}}
  ],
  "kb_article_title": "title for new KB article",
  "kb_article_summary": "summary of this failure pattern and resolution"
}}"""

    try:
        resp = requests.post(
            f'{OLLAMA_URL}/chat/completions',
            json={
                'model': OLLAMA_MODEL,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.3,
                'stream': False
            },
            timeout=60
        )
        raw = resp.json()['choices'][0]['message']['content']
        import re, json
        clean = re.sub(r'```json|```', '', raw).strip()
        return json.loads(clean)
    except Exception as e:
        logger.error(f'Novel runbook generation failed: {e}')
        return {
            'root_cause': 'Unknown pattern — manual investigation required',
            'confidence': 30,
            'runbook': [
                {'step': 1, 'action': 'Check application logs for error patterns', 'rationale': 'Identify root cause'},
                {'step': 2, 'action': 'Restart affected services', 'rationale': 'Clear transient state'},
                {'step': 3, 'action': 'Monitor recovery metrics', 'rationale': 'Confirm resolution'}
            ],
            'kb_article_title': f'Novel failure — {alert_name}',
            'kb_article_summary': 'Novel failure pattern — runbook generated from first principles'
        }

# -- Call LLM --------------------------------------------------
def call_llm_rca(alert_name, alert_labels, context):
    if USE_OLLAMA:
        client = OpenAI(base_url=OLLAMA_URL, api_key='ollama')
        model  = OLLAMA_MODEL
    else:
        if not OPENAI_API_KEY:
            return {'root_cause': 'No LLM configured', 'confidence': 0,
                    'impact': 'Unknown', 'recommendation': 'Configure LLM',
                    'pillar': 'Human+AI-Assist', 'risk_score': 100}
        client = OpenAI(api_key=OPENAI_API_KEY)
        model  = 'gpt-4o'

    prompt = f"""You are an expert Site Reliability Engineer analysing a production alert.

ALERT: {alert_name}
LABELS: {json.dumps(alert_labels, indent=2)}
TIMESTAMP: {datetime.now().isoformat()}

METRICS:
- Request Rate: {json.dumps(context.get('request_rate', []))}
- Error Rate: {json.dumps(context.get('error_rate', []))}
- Queue Depth: {json.dumps(context.get('queue_depth', []))}
- P95 Latency: {json.dumps(context.get('latency_p95', []))}

RECENT ERROR LOGS:
{chr(10).join(context.get('error_logs', ['None'])[:8])}

RECENT WARNINGS:
{chr(10).join(context.get('warning_logs', ['None'])[:5])}

KNOWN SAFE AUTONOMOUS PATTERNS (risk_score < 25):
- HTTP probe failure / URL down ? container restart is safe and reversible
- Queue consumer stopped ? worker restart is safe, no data risk
- Build artefact disk full ? cleanup is safe and reversible

KNOWN HiTL PATTERNS (risk_score 25-74):
- High API error rate ? root cause varies, human confirmation needed
- Database slow queries ? DBA awareness required before action
- Memory pressure ? scaling decision needs approval

KNOWN ESCALATION PATTERNS (risk_score > 74):
- Data corruption suspected ? never act autonomously
- Security breach indicators ? immediate human escalation
- Multi-system cascade failure ? blast radius too large

Be concise. Keep root_cause under 30 words. Keep impact under 20 words. Keep recommendation under 20 words. Each causal_chain item under 15 words.

Respond ONLY with a JSON object:
{{
  "root_cause": "Clear one or two sentence root cause",
  "confidence": 85,
  "impact": "Business impact description",
  "causal_chain": ["Step 1", "Step 2", "Step 3"],
  "recommendation": "Specific action to take",
  "pillar": "Autonomous or AI+HiTL or Human+AI-Assist",
  "risk_score": 45
}}

Pillar rules — be precise:
- Autonomous: confidence > 85 AND risk_score < 25 — clear pattern, safe reversible action
- AI+HiTL: confidence 70-90 OR risk_score 25-74 — needs human approval
- Human+AI-Assist: confidence < 70 OR risk_score > 74 — novel or high-risk situation"""

    try:
        import re
        response = client.chat.completions.create(
            model=model,
            messages=[{'role': 'user', 'content': prompt}],
            max_tokens=1500,
            temperature=0.2
        )
        raw = response.choices[0].message.content
        if not raw:
            raise ValueError('Empty response')
        raw = raw.strip()
        logger.info(f'Raw LLM response: {raw[:200]}')
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            raw = match.group(0)
        return json.loads(raw.strip())
    except Exception as e:
        logger.error(f'LLM call failed: {e}')
        return {'root_cause': f'LLM failed: {str(e)}', 'confidence': 0,
                'impact': 'Unknown', 'recommendation': 'Check logs',
                'pillar': 'Human+AI-Assist', 'risk_score': 100}

# -- Format annotation -----------------------------------------
def format_annotation(rca):
    pillar_emoji = {'Autonomous': '??', 'AI+HiTL': '??',
                    'Human+AI-Assist': '??'}.get(rca.get('pillar', ''), '?')
    confidence   = rca.get('confidence', 0)
    bar          = '¦' * int(confidence/10) + '¦' * (10 - int(confidence/10))
    chain        = rca.get('causal_chain', [])
    chain_text   = '\n'.join([f'  {i+1}. {s}' for i, s in enumerate(chain)]) if chain else '  Not determined'

    return f"""???????????????????????????
?? ZEROOPS RCA ENGINE
???????????????????????????

?? ROOT CAUSE
{rca.get('root_cause', 'Unknown')}

?? CONFIDENCE  [{bar}] {confidence}%
?  RISK SCORE  {rca.get('risk_score', 'N/A')}/100
{pillar_emoji} MODE        {rca.get('pillar', 'Unknown')}

? CAUSAL CHAIN
{chain_text}

?? IMPACT
{rca.get('impact', 'Unknown')}

? RECOMMENDATION
{rca.get('recommendation', 'None')}
???????????????????????????""".strip()

# -- Process alert ---------------------------------------------
def process_alert(alert_name, alert_labels):
    start_time = datetime.now()

    # Apply overrides early for known patterns
    # This ensures correct routing even if LLM fails
    early_override = AUTONOMOUS_OVERRIDES.get(alert_name) or HITL_OVERRIDES.get(alert_name)

    context = build_context(alert_name, alert_labels)
    post_grafana_annotation(
        f'ZeroOps — {alert_name} [DETECTED]',
        f'ALERT CORRELATOR\n\nAlert received and correlated\nAlert: {alert_name}',
        tags=['zeroops', 'correlator', 'detected']
    )

    # Check if this is a novel pattern requiring runbook generation
    if alert_name == 'NovelFailure':
        logger.info('NovelFailure detected — generating runbook from first principles via Ollama')
        novel = generate_novel_runbook(alert_name, context)
        rca = {
            'root_cause':     novel.get('root_cause', 'Unknown pattern'),
            'confidence':     novel.get('confidence', 45),
            'risk_score':     55,
            'pillar':         'AI+HiTL',
            'impact':         'Combined failure pattern — queue backlog and elevated error rate',
            'recommendation': ' | '.join([s['action'] for s in novel.get('runbook', [])]),
            'causal_chain':   [s['action'] for s in novel.get('runbook', [])],
            'novel_runbook':  novel.get('runbook', []),
            'kb_title':       novel.get('kb_article_title', ''),
            'kb_summary':     novel.get('kb_article_summary', ''),
        }
        logger.info(f'Novel runbook generated — {len(novel.get("runbook",[]))} steps')
    elif alert_name in AUTONOMOUS_OVERRIDES:
        # Known autonomous pattern — skip LLM, use canned RCA
        override = AUTONOMOUS_OVERRIDES[alert_name]
        rca = {
            'root_cause':     ALERT_TITLES.get(alert_name, alert_name),
            'confidence':     95,
            'risk_score':     override['risk_score'],
            'pillar':         override['pillar'],
            'impact':         'Service degradation detected',
            'recommendation': REMEDIATIONS.get(alert_name, {}).get('desc', 'Auto-remediation'),
            'causal_chain':   [override.get('reason', 'Known pattern — autonomous resolution')],
        }
        logger.info(f'Fast-path RCA: {alert_name} — skipping LLM')
    else:
        rca = call_llm_rca(alert_name, alert_labels, context)

    # Always apply override — known patterns take precedence over LLM
    if alert_name in AUTONOMOUS_OVERRIDES:
        override = AUTONOMOUS_OVERRIDES[alert_name]
        rca['risk_score'] = override['risk_score']
        rca['pillar']     = override['pillar']
        logger.info(f'Autonomous override: {alert_name} — risk {override["risk_score"]}')
    elif alert_name in HITL_OVERRIDES:
        override = HITL_OVERRIDES[alert_name]
        rca['risk_score'] = override['risk_score']
        rca['pillar']     = override['pillar']
        logger.info(f'HiTL override: {alert_name} — risk {override["risk_score"]}')

    logger.info(f'Final RCA: pillar={rca["pillar"]} risk={rca["risk_score"]}')
    logger.info(f'RCA result: {json.dumps(rca, indent=2)}')
    post_grafana_annotation(
        f'ZeroOps — {alert_name} [DIAGNOSED]',
        f'RCA ENGINE\n\nROOT CAUSE\n{rca.get("root_cause","Unknown")}\n\nCONFIDENCE {rca.get("confidence",0)}% RISK {rca.get("risk_score","N/A")}/100\nMODE {rca.get("pillar","AI+HiTL")}',
        tags=['zeroops', 'rca', 'diagnosed']
    )

    pillar     = rca.get('pillar', 'AI+HiTL')
    risk_score = rca.get('risk_score', 50)
    annotation = format_annotation(rca)

    # Create Zammad ticket
    ticket_id = create_zammad_ticket(alert_name, rca)
    if ticket_id:
        post_grafana_annotation(
            f'ZeroOps — {alert_name} [TICKET CREATED]',
            f'ZAMMAD TICKET CREATED\n\nTicket #{ticket_id} created\nAlert: {alert_name}\nPriority: {"P1" if rca.get("risk_score",50) < 25 else "P2"}\nAssigned to ZeroOps Engine',
            tags=['zeroops', 'ticket', 'created']
        )

    if pillar == 'Autonomous' and risk_score < 25:
        # -- Pillar 1 — Autonomous -----------------------------
        logger.info(f'AUTONOMOUS — risk {risk_score} < 25 — executing remediation')
        result   = execute_remediation(alert_name)
        mttr     = (datetime.now() - start_time).total_seconds()
        annotation += f'\n\n?? AUTONOMOUS EXECUTION\n{result}\nMTTR: {int(mttr)}s'
        post_grafana_annotation(
            f'ZeroOps RCA — {alert_name} [AUTO]', annotation,
            tags=['zeroops', 'rca', 'autonomous'])
        close_zammad_ticket(ticket_id, result, mttr)

        # Auto-cancel any pending HiTL for related alerts
        related = {'CRMURLDown': 'CRMSlowResponse', 'ServiceURLDown': 'ServiceSlowResponse'}
        superseded = related.get(alert_name)
        if superseded:
            for token, entry in list(pending.items()):
                if entry['alert_name'] == superseded and entry['status'] == 'pending':
                    entry['status'] = 'superseded'
                    close_zammad_ticket(entry.get('ticket_id'),
                        f'Superseded by {alert_name} autonomous fix', mttr)
                    logger.info(f'Auto-cancelled {superseded} HiTL — superseded by {alert_name}')
                    if SLACK_WEBHOOK:
                        requests.post(SLACK_WEBHOOK, json={'text':
                            f'Auto-cancelled *{superseded}* — superseded by autonomous {alert_name} fix'
                        }, timeout=10)

    elif pillar == 'Human+AI-Assist' or risk_score > 74:
        # -- Pillar 3 — Escalate -------------------------------
        logger.info(f'ESCALATE — risk {risk_score} > 74 — human required')
        post_grafana_annotation(
            f'ZeroOps RCA — {alert_name} [ESCALATE]', annotation,
            tags=['zeroops', 'rca', 'escalate'])
        if SLACK_WEBHOOK:
            token = str(uuid.uuid4())
            pending[token] = {
                'alert_name': alert_name, 'rca': rca,
                'status': 'escalated', 'ticket_id': ticket_id,
                'start_time': start_time.isoformat()
            }
            post_slack_hitl(alert_name, rca, token)

    else:
        # -- Pillar 2 — AI+HiTL -------------------------------
        token = str(uuid.uuid4())
        pending[token] = {
            'alert_name': alert_name, 'rca': rca,
            'status': 'pending', 'ticket_id': ticket_id,
            'start_time': start_time.isoformat()
        }
        logger.info(f'HITL — risk {risk_score} — Slack approval — token: {token[:8]}')
        post_grafana_annotation(
            f'ZeroOps RCA — {alert_name} [AWAITING APPROVAL]', annotation,
            tags=['zeroops', 'rca', 'hitl'])
        post_slack_hitl(alert_name, rca, token)

    return rca

# -- Routes ----------------------------------------------------
@app.route('/webhook', methods=['POST'])
def webhook():
    data   = request.get_json() or {}
    logger.info(f'Alert received: {json.dumps(data, indent=2)[:500]}')
    alerts = data.get('alerts', [data])
    results = []
    for alert in alerts:
        alert_name   = alert.get('labels', {}).get('alertname', 'Unknown')
        alert_labels = alert.get('labels', {})
        alert_status = alert.get('status', 'firing')
        if alert_status != 'firing':
            active_alerts.discard(alert_name)
            continue
        if alert_name in IGNORED_ALERTS:
            logger.info(f'Ignoring housekeeping alert: {alert_name}')
            continue
        suppressor = SUPPRESS_RULES.get(alert_name)
        if suppressor and suppressor in active_alerts:
            logger.info(f'Suppressing {alert_name} — {suppressor} already firing')
            # Post suppression annotation so it appears in Silent Ops
            suppression_text = f"""False Positive Suppressed — {ALERT_TITLES.get(alert_name, alert_name)}

SUPPRESSION REASON
{alert_name} fired simultaneously with {suppressor}.
Root cause is the same event — duplicate alert suppressed.
Only one incident raised. Noise eliminated.

SIGNAL INTELLIGENCE
Suppressor active: {suppressor}
Suppressed alert:  {alert_name}
Action: No ticket raised — parent incident handles resolution"""
            post_grafana_annotation(
                f'ZeroOps Suppression - {alert_name} [FALSE POSITIVE]',
                suppression_text,
                tags=['zeroops', 'suppressed', 'false-positive']
            )
            continue

        # Track this alert as active
        active_alerts.add(alert_name)
        rca = process_alert(alert_name, alert_labels)
        results.append({'alert': alert_name, 'rca': rca})
    return jsonify({'status': 'processed', 'results': results})

@app.route('/analyse', methods=['POST'])
def analyse():
    data         = request.get_json() or {}
    alert_name   = data.get('alert_name', 'Manual Analysis')
    alert_labels = data.get('labels', {})
    rca          = process_alert(alert_name, alert_labels)
    return jsonify({'rca': rca})

@app.route('/approve/<token>')
@app.route('/approve/<token>')
def approve(token):
    if token not in pending:
        return '<h2>? Token not found or already processed</h2>', 404

    entry      = pending[token]
    alert_name = entry['alert_name']
    ticket_id  = entry.get('ticket_id')
    start_time = datetime.fromisoformat(entry['start_time']) if entry.get('start_time') else datetime.now()

    logger.info(f'APPROVED — token: {token[:8]} — alert: {alert_name}')
    result = execute_remediation(alert_name)
    mttr   = (datetime.now() - start_time).total_seconds()
    entry['status'] = 'approved'

    post_grafana_annotation(
        f'ZeroOps HiTL — {alert_name} APPROVED',
        f'? Human approved remediation\n\n{result}\n\nMTTR: {int(mttr)}s\n\n?? ZeroOps executed automatically',
        tags=['zeroops', 'hitl', 'approved']
    )

    close_zammad_ticket(ticket_id, result, mttr)

    # Auto-create KB article for novel failure patterns
    if alert_name == 'NovelFailure' and entry.get('rca', {}).get('novel_runbook'):
        rca_data = entry.get('rca', {})
        kb_title = rca_data.get('kb_title', f'Novel Failure Pattern — {alert_name}')
        kb_summary = rca_data.get('kb_summary', '')
        runbook_steps = rca_data.get('novel_runbook', [])
        runbook_text = '\n'.join([f"{s['step']}. {s['action']} — {s['rationale']}" for s in runbook_steps])
        kb_body = f"""AUTO-GENERATED KB ARTICLE
Generated by ZeroOps after novel failure resolution

PATTERN SUMMARY
{kb_summary}

ROOT CAUSE
{rca_data.get('root_cause', 'Unknown')}

RUNBOOK — Generated by Ollama gpt-oss:20b
{runbook_text}

RESOLUTION
{result}
MTTR: {int(mttr)}s

NOTE: This article was auto-generated. Review and validate before next occurrence.
Next occurrence of this pattern will be handled autonomously."""

        try:
            kb_resp = requests.post(
                f'{ZAMMAD_URL}/api/v1/tickets',
                headers={'Authorization': f'Token token={ZAMMAD_TOKEN}'},
                json={
                    'title': f'KB AUTO-CREATED — {kb_title}',
                    'group': 'Users',
                    'priority_id': 3,
                    'customer': 'admin@enterprise.com',
                    'article': {
                        'subject': kb_title,
                        'body': kb_body,
                        'type': 'note',
                        'internal': True
                    }
                },
                timeout=10
            )
            logger.info(f'KB article auto-created — {kb_title}')
        except Exception as e:
            logger.error(f'KB article creation failed: {e}')

    if SLACK_WEBHOOK:
        kb_note = ' · KB article auto-created' if alert_name == 'NovelFailure' else ''
        requests.post(SLACK_WEBHOOK, json={'text':
            f'✅ *{alert_name}* approved and remediated\nMTTR: {int(mttr)}s\n`{result}`{kb_note}'
        }, timeout=10)

    return f'''
    <html><body style="font-family:monospace;padding:40px;background:#0F172A;color:#fff">
    <h2 style="color:#16A34A">? Approved — {alert_name}</h2>
    <p>{result}</p>
    <p style="color:#16A34A">MTTR: {int(mttr)} seconds</p>
    <p style="color:#64748B">Zammad ticket closed · Grafana annotated · Slack notified</p>
    </body></html>
    '''

@app.route('/reject/<token>')
def reject(token):
    if token not in pending:
        return '<h2>? Token not found or already processed</h2>', 404
    entry      = pending[token]
    alert_name = entry['alert_name']
    logger.info(f'REJECTED — token: {token[:8]} — alert: {alert_name}')
    entry['status'] = 'rejected'
    close_zammad_ticket(entry.get('ticket_id'), 'Remediation rejected by engineer — manual investigation required',
                       (datetime.now() - datetime.fromisoformat(entry['start_time'])).total_seconds() if entry.get('start_time') else None)
    post_grafana_annotation(
        f'ZeroOps HiTL — {alert_name} REJECTED',
        f'? Human rejected remediation — manual investigation required',
        tags=['zeroops', 'hitl', 'rejected']
    )
    if SLACK_WEBHOOK:
        requests.post(SLACK_WEBHOOK, json={'text':
            f'? *{alert_name}* remediation rejected — manual action required'
        }, timeout=10)
    return f'''
    <html><body style="font-family:monospace;padding:40px;background:#0F172A;color:#fff">
    <h2 style="color:#DC2626">? Rejected — {alert_name}</h2>
    <p>Manual investigation required</p>
    <p style="color:#64748B">Grafana annotation posted · Slack notified</p>
    </body></html>
    '''

@app.route('/pending')
def list_pending():
    return jsonify(pending)

@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'service': 'rca-service',
                    'llm': 'ollama' if USE_OLLAMA else 'openai',
                    'pending_approvals': len(pending)})

if __name__ == '__main__':
    logger.info('ZeroOps RCA Service starting...')
    app.run(host='0.0.0.0', port=5000, debug=False)

