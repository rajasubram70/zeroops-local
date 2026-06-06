import time, random, threading, logging
from flask import Flask, jsonify, request
from prometheus_client import Gauge, Counter, generate_latest, CONTENT_TYPE_LATEST

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s %(message)s')
logger = logging.getLogger('sap-mock')

app = Flask(__name__)

# ── Prometheus metrics ────────────────────────────────────────
WP_DIALOG_USED     = Gauge('sap_wp_dialog_used_pct',    'SAP dialog work process utilisation %')
WP_BACKGROUND_USED = Gauge('sap_wp_background_used_pct','SAP background work process utilisation %')
WP_UPDATE_USED     = Gauge('sap_wp_update_used_pct',    'SAP update work process utilisation %')
DIALOG_RESPONSE    = Gauge('sap_dialog_response_ms',    'SAP dialog step response time ms')
IDOC_QUEUE_DEPTH   = Gauge('sap_idoc_queue_depth',      'SAP iDoc inbound queue depth')
BATCH_QUEUE_DEPTH  = Gauge('sap_batch_queue_depth',     'SAP batch job queue depth')
SPOOL_USED         = Gauge('sap_spool_used_pct',        'SAP spool utilisation %')
HANA_CPU           = Gauge('sap_hana_cpu_pct',          'SAP HANA database CPU %')
HANA_MEMORY        = Gauge('sap_hana_memory_pct',       'SAP HANA memory utilisation %')
ABAP_DUMPS         = Counter('sap_abap_dumps_total',    'SAP ABAP short dumps total')

# ── Chaos state ───────────────────────────────────────────────
chaos_state = {
    'wp_saturation':    False,   # Work process saturation
    'idoc_backup':      False,   # iDoc queue backup
    'batch_failure':    False,   # Batch job failure
    'hana_slowdown':    False,   # HANA query slowdown
}

# ── SAP Work Process definitions ──────────────────────────────
WP_POOL = [
    {'no':0,  'type':'DIA', 'pid':12301, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':1,  'type':'DIA', 'pid':12302, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':2,  'type':'DIA', 'pid':12303, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':3,  'type':'DIA', 'pid':12304, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':4,  'type':'DIA', 'pid':12305, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':5,  'type':'DIA', 'pid':12306, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':6,  'type':'BTC', 'pid':12307, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':7,  'type':'BTC', 'pid':12308, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':8,  'type':'UPD', 'pid':12309, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
    {'no':9,  'type':'SPO', 'pid':12310, 'status':'Wait',   'reason':'', 'start':'','time':'','program':'','client':'','user':'','action':'','table':''},
]

BATCH_JOBS = [
    {'jobname':'SAP_REORG_JOBS',     'status':'Active',    'start':'06:00:00', 'runtime':'00:12:34', 'user':'BTCADMIN'},
    {'jobname':'FI_POSTING_CLOSE',   'status':'Active',    'start':'07:00:00', 'runtime':'00:08:11', 'user':'FIUSER01'},
    {'jobname':'MM_REORDER_POINT',   'status':'Scheduled', 'start':'08:00:00', 'runtime':'',         'user':'MMUSER01'},
    {'jobname':'SD_BILLING_COLLECT', 'status':'Scheduled', 'start':'08:30:00', 'runtime':'',         'user':'SDUSER01'},
    {'jobname':'HR_PAYROLL_BATCH',   'status':'Scheduled', 'start':'09:00:00', 'runtime':'',         'user':'HRUSER01'},
    {'jobname':'FI_PAYROLL_POST',    'status':'Scheduled', 'start':'10:00:00', 'runtime':'',         'user':'FIUSER01'},
]

IDOC_TYPES = [
    {'idoc_type':'ORDERS05',  'direction':'Inbound',  'status':'51', 'count':0, 'partner':'VENDOR_001'},
    {'idoc_type':'DESADV01',  'direction':'Inbound',  'status':'51', 'count':0, 'partner':'VENDOR_002'},
    {'idoc_type':'INVOIC02',  'direction':'Outbound', 'status':'03', 'count':0, 'partner':'CUSTOMER_001'},
    {'idoc_type':'MATMAS05',  'direction':'Inbound',  'status':'51', 'count':0, 'partner':'MDG_HUB'},
]

# ── Background metric simulation ──────────────────────────────
def simulate_metrics():
    while True:
        if chaos_state['wp_saturation']:
            dialog_pct = random.uniform(85, 98)
            background_pct = random.uniform(20, 40)
            response_ms = random.uniform(8000, 25000)
            logger.warning(f'WP saturation — dialog {dialog_pct:.1f}% — response {response_ms:.0f}ms')
        elif chaos_state['hana_slowdown']:
            dialog_pct = random.uniform(40, 60)
            background_pct = random.uniform(20, 35)
            response_ms = random.uniform(5000, 15000)
        else:
            dialog_pct = random.uniform(15, 35)
            background_pct = random.uniform(10, 25)
            response_ms = random.uniform(200, 800)

        if chaos_state['idoc_backup']:
            idoc_depth = random.randint(450, 850)
            for idoc in IDOC_TYPES:
                idoc['count'] = random.randint(80, 200)
                idoc['status'] = '51'
            logger.warning(f'iDoc queue backup — depth {idoc_depth}')
        else:
            idoc_depth = random.randint(0, 15)
            for idoc in IDOC_TYPES:
                idoc['count'] = random.randint(0, 5)
                idoc['status'] = '53'

        if chaos_state['batch_failure']:
            batch_depth = random.randint(8, 15)
            for job in BATCH_JOBS:
                if job['jobname'] in ['FI_PAYROLL_POST', 'HR_PAYROLL_BATCH']:
                    job['status'] = 'Aborted'
            logger.warning(f'Batch job failure — {batch_depth} jobs queued')
        else:
            batch_depth = random.randint(0, 3)
            for job in BATCH_JOBS:
                if job['status'] == 'Aborted':
                    job['status'] = 'Scheduled'

        hana_cpu = random.uniform(60, 85) if chaos_state['hana_slowdown'] else random.uniform(10, 30)
        hana_mem = random.uniform(70, 90) if chaos_state['hana_slowdown'] else random.uniform(40, 60)

        WP_DIALOG_USED.set(dialog_pct)
        WP_BACKGROUND_USED.set(background_pct)
        WP_UPDATE_USED.set(random.uniform(5, 15))
        DIALOG_RESPONSE.set(response_ms)
        IDOC_QUEUE_DEPTH.set(idoc_depth)
        BATCH_QUEUE_DEPTH.set(batch_depth)
        SPOOL_USED.set(random.uniform(20, 40))
        HANA_CPU.set(hana_cpu)
        HANA_MEMORY.set(hana_mem)

        time.sleep(5)

# ── Routes ────────────────────────────────────────────────────
@app.route('/health')
def health():
    status = 'degraded' if any(chaos_state.values()) else 'healthy'
    return jsonify({'status': status, 'system': 'SAP S/4HANA PCE', 'sid': 'PRD', 'host': 'sap-mock'})

@app.route('/sm50')
def sm50():
    wps = []
    dialog_used = int(WP_DIALOG_USED._value.get())
    for i, wp in enumerate(WP_POOL):
        wp_copy = wp.copy()
        if wp['type'] == 'DIA' and chaos_state['wp_saturation']:
            if i < 5:
                wp_copy['status'] = 'Run'
                wp_copy['program'] = random.choice(['SAPLMEGUI','SAPMV45A','RFFOUS_C','SAPMSSY1'])
                wp_copy['user'] = random.choice(['FIUSER01','SDUSER01','MMUSER01','HRUSER01'])
                wp_copy['client'] = '100'
                wp_copy['time'] = f'{random.randint(60,999)}s'
                wp_copy['action'] = 'Sequential Read'
                wp_copy['table'] = random.choice(['BKPF','VBAK','EKKO','MARA'])
        wps.append(wp_copy)
    return jsonify({
        'system': 'PRD', 'host': 'sap-mock',
        'dialog_wps': 6, 'dialog_used': sum(1 for w in wps if w['type']=='DIA' and w['status']=='Run'),
        'background_wps': 2, 'utilisation_pct': round(dialog_used, 1),
        'work_processes': wps
    })

@app.route('/sm37')
def sm37():
    return jsonify({
        'system': 'PRD', 'total_jobs': len(BATCH_JOBS),
        'aborted': sum(1 for j in BATCH_JOBS if j['status']=='Aborted'),
        'active':  sum(1 for j in BATCH_JOBS if j['status']=='Active'),
        'scheduled': sum(1 for j in BATCH_JOBS if j['status']=='Scheduled'),
        'jobs': BATCH_JOBS
    })

@app.route('/idoc/queue')
def idoc_queue():
    total = sum(i['count'] for i in IDOC_TYPES)
    return jsonify({
        'system': 'PRD', 'total_pending': total,
        'status': 'backed_up' if total > 100 else 'normal',
        'idoc_types': IDOC_TYPES
    })

@app.route('/sm37/reschedule', methods=['POST'])
def reschedule():
    data = request.get_json() or {}
    job  = data.get('job', 'ALL')
    chaos_state['wp_saturation'] = False
    chaos_state['batch_failure']  = False
    for j in BATCH_JOBS:
        if j['status'] == 'Aborted':
            j['status'] = 'Scheduled'
    logger.info(f'SM37 reschedule executed — job: {job}')
    return jsonify({'status': 'rescheduled', 'job': job, 'message': 'Batch jobs rescheduled to background WP class'})

@app.route('/chaos', methods=['POST'])
def set_chaos():
    data = request.get_json() or {}
    for key in chaos_state:
        if key in data:
            chaos_state[key] = bool(data[key])
            logger.warning(f'SAP CHAOS: {key} = {chaos_state[key]}')
    return jsonify({'chaos_state': chaos_state})

@app.route('/chaos', methods=['GET'])
def get_chaos():
    return jsonify({'chaos_state': chaos_state})

@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

if __name__ == '__main__':
    threading.Thread(target=simulate_metrics, daemon=True).start()
    logger.info('SAP Mock API starting — SID: PRD')
    app.run(host='0.0.0.0', port=8082, debug=False)
