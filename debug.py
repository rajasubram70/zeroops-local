import requests
resp = requests.get('http://prometheus:9090/api/v1/query', params={'query': 'sum(probe_http_duration_seconds{instance="http://odoo:8069/web/health",job="blackbox"})'}, timeout=5)
print(resp.json())
