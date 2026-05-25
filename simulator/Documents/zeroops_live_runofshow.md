# ZeroOps Live Demo — Run of Show
## Pre-Demo Checklist · Screen Layout · Trigger Commands · Timings

---

## SCREEN LAYOUT (4 screens or windows)

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   ZeroOps Simulator │    PowerShell        │
│   localhost:5173    │    (trigger window)  │
│                     │                     │
├─────────────────────┼─────────────────────┤
│                     │                     │
│   Slack             │    Zammad            │
│   #zeroops-alerts   │    localhost:8090    │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

---

## PRE-DEMO CHECKS (10 minutes before)

### 1. Stack health
```powershell
docker compose ps
Invoke-RestMethod -Uri "http://localhost:5002/metrics" | Select-Object api_health, crm_health, queue_depth
```
**Expected:** all containers Up · api_health=1 · crm_health=1 · queue_depth=0

### 2. RCA service clean state
```powershell
docker compose restart rca-service
Start-Sleep -Seconds 15
docker compose logs rca-service --tail=5
```
**Expected:** service started, no stale active_alerts

### 3. Simulator running
```powershell
# In zeroops-local/simulator directory
npm run dev
```
Navigate to `http://localhost:5173` — confirm Service Map shows CRM Platform and Enterprise Order API both GREEN

### 4. Grafana alert state
Open `http://localhost:3000` → Alerting → Alert rules
- CRMURLDown: **Normal** (not firing)
- CRMSlowResponse: **Normal** (not firing)
- HighQueueDepth: **Normal** (not firing)

### 5. Zammad — clear old tickets (optional)
Open `http://localhost:8090` — note current ticket count for reference

### 6. Slack — channel open
Open Slack → #zeroops-alerts channel — confirm no pending HiTL messages

### 7. Browser tabs pre-positioned
- Tab 1: Simulator — **Command Centre**
- Tab 2: Zammad — **Open Tickets**
- Tab 3: Grafana — **Alert rules** (background only)

---

## DEMO SEQUENCE

---

### 00:00 — 01:00 · OPENING — Command Centre

**Navigate to:** Command Centre (already loaded)

**Say:**
> "Everything you're looking at is live. Real containers running on this machine. Real metrics from Prometheus. Real tickets in Zammad. Let me show you what happens when something breaks."

**Point to:**
- MTTR tile — live from Bridge API
- Auto-fix rate tile — live from Bridge API
- Silent Ops log — Grafana annotations

---

### 01:00 — 01:30 · SERVICE MAP — Baseline

**Navigate to:** Service Map

**Say:**
> "This is the estate at rest. All green. CRM Platform, Enterprise Order API — both healthy. I want you to watch this screen."

**Click:** CRM Platform domain → Odoo CRM app → Health Check infra item
> "Health check passing. Response normal. Everything good."

**Click back to** domain level — leave Service Map visible

---

### 01:30 — 02:00 · TRIGGER — Scenario 1 (Sentinel)

**Switch to PowerShell window**

```powershell
docker compose stop odoo
```

**Say:**
> "Odoo is down. Watch the Service Map."

**Switch back to Simulator immediately**

---

### 02:00 — 02:30 · SERVICE MAP TURNS RED

**Watch:** CRM Platform flips RED within 5 seconds

**Say:**
> "Five seconds. Blackbox Exporter detected the health check failure. ZeroOps knows."

**Click:** CRM Platform → Odoo CRM → Health Check
> "Health check: failing. Container down. ZeroOps has already started working."

---

### 02:30 — 03:30 · SILENT OPS — Agent fires

**Navigate to:** Command Centre → scroll to Silent Ops Centre

**Watch:** New log entries appear as agents fire

**Say:**
> "Look at the Silent Operations Centre. Alert Correlator fired. RCA Engine diagnosed — container stopped, risk score 18, below the autonomous threshold. Remediation Agent is executing the restart. No one was called. No one approved this."

**Point to each entry as it appears**

---

### 03:30 — 04:00 · SERVICE MAP TURNS GREEN

**Navigate to:** Service Map

**Watch:** CRM Platform flips GREEN

**Say:**
> "Green. Odoo is back. MTTR: under 60 seconds. Your baseline for a CRM outage is 45 minutes — assuming the right engineer picks up the phone."

---

### 04:00 — 04:30 · ZAMMAD TICKET

**Switch to Zammad tab**

**Say:**
> "And here's the evidence. Zammad ticket — created and closed automatically. Root cause logged. MTTR recorded. Full audit trail. No human wrote this."

---

### 04:30 — 05:30 · WORKFLOW — Sentinel scenario walkthrough

**Navigate to:** Simulator → Workflows → Select CRM URL Down scenario

**Say:**
> "Let me walk you through what just happened step by step."

**Click:** Start Simulation

**Walk through each step as it plays:**
- Alert Correlation: "186 alerts → 1 incident"
- RCA Engine: "Ollama running locally — real AI diagnosis — 93% confidence"
- Container Restart: "docker compose start odoo — executed autonomously"
- Validation: "Bridge API confirms health. Green."
- Close: "Ticket closed. MTTR logged."

> "Risk score 18. Below the threshold of 25. No human needed. That is Pillar 1 — Sentinel."

---

### 05:30 — 06:00 · RESET — Confirm all green

**Navigate to:** Service Map — confirm GREEN
**Check:** PowerShell

```powershell
Invoke-RestMethod -Uri "http://localhost:5002/metrics" | Select-Object api_health, crm_health, queue_depth
```
**Expected:** api_health=1 · crm_health=1 · queue_depth=0

---

### 06:00 — 06:30 · TRIGGER — Scenario 2 (Guardian / Queue)

**Switch to PowerShell**

```powershell
docker compose stop demo-worker
```

**Say:**
> "Now the order processing worker is down. Watch the queue build up."

---

### 06:30 — 07:30 · QUEUE SCENARIO — Autonomous

**Navigate to:** Service Map → Enterprise Order API

**Watch:** Order Queue infra item shows depth rising

**Say:**
> "Queue depth climbing. Risk score 12 — fully autonomous. ZeroOps restarts the worker. All queued orders processed. No data lost — Redis is persistent."

**Watch:** Queue depth drops to 0

---

### 07:30 — 08:30 · TRIGGER — Scenario 3 (HiTL)

**Switch to PowerShell**

```powershell
# Enable chaos — high error rate
Invoke-RestMethod -Uri "http://localhost:8080/chaos" -Method POST -ContentType "application/json" -Body '{"high_error": true}'
```

**Say:**
> "Now something different. High error rate on the API. Risk score 45 — above the autonomous threshold. ZeroOps cannot act alone."

**Wait:** 30-60 seconds for alert to fire

---

### 08:30 — 09:00 · SLACK HiTL

**Switch to Slack**

**Watch:** HiTL message arrives with full diagnostic context

**Say:**
> "One Slack message. Root cause. Risk score. Blast radius. Remediation plan. One click."

**Click:** Approve

---

### 09:00 — 09:30 · RESOLUTION

**Switch to Simulator → Incidents tab**

**Say:**
> "Approved. ZeroOps executes. Error rate drops to zero. Ticket closed. 11 seconds of human time."

**Restore chaos:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/chaos" -Method POST -ContentType "application/json" -Body '{"high_error": false}'
```

---

### 09:30 — 10:00 · REPORTS

**Navigate to:** Reports → Generate Monthly Value Report → scroll to ROI

**Say:**
> "Everything you just saw — logged, measured, valued. MTTR live from the stack. Agent performance from real run data. ROI calculated. This is the board-ready view."

---

### 10:00 · CLOSE

**Navigate to:** Command Centre — full view

**Say:**
> "Three scenarios. Two fully autonomous. One human decision — 11 seconds. This is what ZeroOps looks like running. Not a prototype. Not a slide. A working system."

---

## RECOVERY COMMANDS

### If Odoo doesn't come back automatically:
```powershell
docker compose start odoo
docker compose restart rca-service
```

### If Slack webhook fails (404):
```powershell
# Check webhook is set
docker exec rca-service env | findstr SLACK
# Restart with correct webhook
docker compose up -d --force-recreate rca-service
```

### If CRMSlowResponse fires instead of CRMURLDown:
- Reject the Slack HiTL message
- Wait 30 seconds for CRMURLDown to fire autonomously
- If still not firing: `docker compose restart rca-service` then retry

### If stale active_alerts blocking remediation:
```powershell
docker compose restart rca-service
Start-Sleep -Seconds 10
docker compose stop odoo
```

### Restore everything to clean state:
```powershell
docker compose start odoo
docker compose start demo-worker
Invoke-RestMethod -Uri "http://localhost:8080/chaos" -Method POST -ContentType "application/json" -Body '{"high_error": false, "slow_db": false}'
docker compose restart rca-service
```

---

## TIMINGS SUMMARY

| Step | Action | Duration |
|------|--------|----------|
| 00:00 | Command Centre opening | 1 min |
| 01:00 | Service Map baseline | 30s |
| 01:30 | docker stop odoo | instant |
| 01:35 | CRM turns RED | 5s auto |
| 02:30 | Silent Ops entries appear | 30s |
| 03:30 | CRM turns GREEN | auto |
| 04:00 | Zammad ticket shown | 30s |
| 04:30 | Workflow walkthrough | 1 min |
| 05:30 | Queue depth scenario | 1 min |
| 06:30 | HiTL chaos scenario | 1 min |
| 08:30 | Slack approve | 11s |
| 09:30 | Reports | 30s |
| 10:00 | Close | done |

**Total: 10 minutes**

---

## ANTICIPATED QUESTIONS

**Q: Is this running on your laptop?**
> "Yes. 17 Docker containers. Prometheus, Loki, Grafana, Zammad, Ollama — all local. In production this runs on your infrastructure or cloud. We're showing the capability, not the scale."

**Q: What AI model is this?**
> "Ollama running gpt-oss:20b locally. No data leaves this machine. In production we support any LLM — Anthropic Claude, Azure OpenAI, or your own self-hosted model."

**Q: What happens when it gets it wrong?**
> "Every action is logged, reversible and auditable. The Guardian scenario exists precisely for this — risk above 25 requires human approval. You set the thresholds."

**Q: How long to implement?**
> "The monitoring layer — Prometheus, Blackbox, Grafana — is weeks. The RCA service and agent logic is where the value builds over time as it learns your estate's patterns."

**Q: How does it learn our environment?**
> "Day one: we ingest your alert history and ticket history. Pattern matching starts immediately. The more incidents it sees, the higher the confidence scores get."

---

*ZeroOps Live Demo · Run of Show v1.0*
