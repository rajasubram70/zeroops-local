# ZeroOps — Canon Europa N.V · 15-Minute Speaker Notes

### RFP Evaluation · Oracle + OCI · XURRENT · Cost -30% · MTTR -60% · AI-led Operations

---

## 00:00 — 01:30 · OPENING HOOK

_[On the login screen. Do not navigate yet.]_

> "Let me start with a number Canon will recognise.
>
> **Six to seven business days.**
>
> That is Canon Europa's average MTTR today. Not hours — business days. And
> that number is carried by two teams who work around the clock, twenty-four
> hours a day, seven days a week, simply to stay ahead of it. The EBS team.
> The Informatica team. Both outsourced to TCS. Both operating twenty-four
> seven because the alternative is missed revenue, stuck orders, and failed
> collections across thirty-nine countries.
>
> Canon has set two targets: cost down thirty percent, MTTR down sixty percent.
> And a third — frictionless operations. AI-led. Zero ticketing.
>
> Let me show you what that looks like six months after ZeroOps go-live."

_[Sign in as AIOps Engineer — aiops.engineer@canon.eu]_

---

## 01:30 — 03:30 · COMMAND CENTRE

_[Dashboard loads. Pause 3 seconds.]_

> "Command Centre. Everything live — Canon Europa IT estate, today.
>
> MTTR: twenty hours. Down from fifty hours. Sixty percent. Your target —
> delivered in six months.
>
> Auto-fix rate: forty-two percent. Nearly half of all incidents resolved without
> a human being involved. Six months ago that number was zero.
>
> Alert noise: four thousand alerts per day from ELK and Oracle Enterprise
> Manager, down to three hundred and twenty actionable. Your engineers are
> reading three thousand six hundred and eighty fewer alerts every day.
>
> Scroll down to Silent Operations. Every line here is something ZeroOps
> resolved before a ticket was raised.
>
> Look at this morning. At 05:14 — seven Informatica jobs failed overnight.
> Twenty-four files stuck in transit. Every downstream system — Oracle EBS,
> Salesforce, Pearlchain, OAS — was about to receive no data when twelve
> thousand Canon users logged in at 08:00.
>
> ZeroOps detected the failure at 05:11. Identified the root cause. Reset
> batch statuses. Moved twenty-four transit files. Restarted all seven jobs.
> Closed the XURRENT ticket. Eighteen minutes. No engineer involved.
> No TCS FAM team woken. No ticket raised. That is zero-ticketing."

---

## 03:30 — 06:00 · WORKFLOW — INFORMATICA SCENARIO (Pillar 1)

_[Navigate to Workflows. Click Informatica scenario. Start Simulation.]_

> "This is the scenario that matters most to Canon's daily operations. Informatica
> is the integration backbone. Everything flows through it — Oracle EBS, Salesforce,
> Pearlchain, Primavera, OAS. When it fails, everything downstream fails.
>
> Today the TCS FAM team handles this manually. Identify every failed job.
> Reset batch statuses. Find unprocessed files in the transit directory. Move
> them to landing. Trigger jobs. Reschedule unscheduled ones. Coordinate with
> the TAM admin team. Four to six hours. Two to three times a month. At any
> hour of the day or night — because the team runs twenty-four seven precisely
> to catch these.
>
> Watch ZeroOps.
>
> Step 1." _[Let detect run — highlighted]_
>
> "Seven jobs failed. Twenty-four files in transit. ELK fires. ZeroOps correlates
> thirty-one alerts to a single incident. Not thirty-one XURRENT tickets.
> One incident, one action plan.
>
> Step 2." _[Let RCA run — highlighted]_
>
> "Root cause in thirty-two seconds. Upstream source system sent a null field.
> Ninety-one percent confidence. Pre-approved pattern matched — no human
> decision required.
>
> Steps 3 and 4." _[Let remediation run]_
>
> "Batch status reset. Twenty-four transit files moved to landing. Inbound
> jobs retriggered. This is exactly what the TCS FAM team does manually,
> in exactly this sequence — ZeroOps executes it in seconds.
>
> Step 5 — validation."
>
> "All seven jobs running. Downstream feeds active — Oracle EBS, Salesforce,
> Pearlchain, OAS all receiving data.
>
> Eighteen minutes. The TCS FAM team twenty-four seven on-call for this
> pattern: no longer required."

---

## 06:00 — 08:00 · WORKFLOW — ORACLE EBS SHIP CONFIRM (Pillar 2)

_[Click Oracle EBS OTC scenario. Start Simulation.]_

> "Scenario Two. Guardian — one human gate. This one matters most to Finance.
>
> Oracle EBS ship confirmation failures happen every single day. Thirty-eight
> orders stuck. Revenue recognition blocked. Three to four hours manual. At
> month-end, when Finance is closing the books under time pressure with two to
> three people engaged per incident — this is where human error risk is highest.
>
> Step 2." _[Let RCA run — highlighted]_
>
> "Root cause: MTL_TRANSACTIONS_INTERFACE records not clearing. One hundred
> and fifty-six pending transactions blocking thirty-eight ship confirmations.
> ZeroOps has this in thirty seconds.
>
> Step 3." _[Auto-reprocess]_
>
> "Thirty-two of thirty-eight orders cleared automatically via WSHFSTRX.
> Revenue recognition unblocked for thirty-two orders while the simulation
> is still running.
>
> Step 4 — the human gate." _[HiTL appears]_
>
> "Six orders need a database-level fix. Revenue risk — so ZeroOps routes to
> Finance Lead and DBA for one-click approval. The fix summary is already
> prepared. They are approving, not diagnosing.
>
> All thirty-eight orders closed. Revenue recognition confirmed. Twenty-eight
> minutes versus three to four hours. Before Finance opens their morning report."

---

## 08:00 — 09:30 · SERVICE MAP

_[Navigate to Service Map.]_

> "Four domains. Eight applications. All on Oracle Cloud Infrastructure — with
> Salesforce cloud-native. This is the Canon Europa operational estate.
>
> Integration and Middleware is red. Informatica down. When that node fails,
> every other domain is downstream of it.
>
> Oracle Core ERP is amber — Oracle Finance with two hundred and eighty-four
> AR invoices stuck in the Direct Debit run. Oracle EBS with thirty-eight ship
> confirmations blocked right now.
>
> CRM and Digital is green. Analytics is green — but only because ZeroOps
> already resolved the Informatica→OAS feed delay before 08:00."

_[Click Integration & Middleware → click Informatica → click Blast Radius]_

> "Six downstream systems. This is the cascade if Informatica stays down.
> Oracle EBS loses its data feed — revenue blocked. Oracle Finance AR feeds
> interrupted. Salesforce sync stops — seventeen thousand CRM users. Pearlchain
> pricing goes stale — sales quotes unreliable. OAS reports show yesterday's
> data. Primavera invoice pipeline stops.
>
> One application. Six downstream systems. Twelve thousand Oracle users,
> seventeen thousand Salesforce users — all impacted.
>
> ZeroOps maps this in real time and resolves the root node before the cascade
> reaches your users."

---

## 09:30 — 11:00 · SERVICE REQUESTS

_[Navigate to Service Requests.]_

> "Six hundred and fifty tickets per month at Canon today. This page is the
> zero-ticketing story made concrete.
>
> Knowledge issues: two hundred and fifty tickets a month. Two-day elapsed
> time today. ZeroOps pattern-matches against the KB — forty-five percent
> resolved autonomously, same day. The rest routed with full diagnostic
> context — no blank ticket, no back-and-forth.
>
> Change requests: two hundred tickets a month, three to six days today.
> ZeroOps validates against configuration baseline. Standard changes
> auto-processed. One approval click for the rest — same day instead of
> three to six days.
>
> Monitoring and action: one hundred tickets a month. Two to five days today.
> ZeroOps auto-remediates sixty-five percent. This is the alert-to-ticket
> pipeline that ZeroOps breaks entirely.
>
> Bug fixes: one hundred tickets, ten to fifteen days. ZeroOps cannot eliminate
> the development cycle — but it accelerates it. Auto-diagnoses, prepares the
> bug report, runs pre-checks. Five to seven days instead of ten to fifteen.
>
> The zero-ticketing target is not zero incidents. It is zero tickets that
> require an engineer to manually diagnose something ZeroOps can handle."

---

## 11:00 — 12:00 · MONTHLY REPORT

_[Navigate to Reports → Generate.]_

> "Board-ready. Auto-generated.
>
> MTTR twenty hours from fifty. Sixty percent — your target, delivered.
> Auto-fix forty-two percent, tracking toward sixty. CSAT four-point-zero
> from two-point-eight.
>
> Scroll to ROI. LLM operating cost: thirty-eight pounds. Net ROI:
> forty-eight thousand, three hundred and twenty-two pounds. One thousand,
> two hundred and seventy-two times return on the AI spend.
>
> Every number is auditable. Engineer time eliminated at ninety pounds per
> hour, plus noise suppression value. Not projected savings — actual
> engineer effort that no longer happens.
>
> The thirty percent cost reduction: engineer toil drops from seventy to
> twenty-eight percent. That is forty-two percent of three hundred IT
> engineers redirected from firefighting to strategic work. The TCS FAM
> team twenty-four seven rota for Informatica — no longer required at that
> intensity. That is where the cost reduction comes from."

---

## 12:00 — 13:30 · TRANSFER READINESS

_[Navigate to Transfer Readiness.]_

> "This is the page no other AIOps platform has. Not because the technology
> is different — because the narrative is different.
>
> You are looking at Canon Europa six months after ZeroOps go-live —
> December 2026. This is what the Canon GCC team in Hyderabad inherits
> at handover.
>
> Overall readiness: sixty-four percent. On track for full GCC handover
> by June 2027.
>
> Six categories. Runbooks at seventy-eight percent — nineteen validated
> runbooks built automatically by ZeroOps from live incident resolution.
> Not authored by a consultant in a workshop. Written by the system that
> actually resolved the incidents.
>
> Knowledge Base at seventy percent — fourteen articles. The Informatica
> recovery runbook, the Oracle EBS ship confirm playbook, the DD mandate
> correction guide — all built from Canon's own incident history.
>
> Automation at sixty-two percent — Informatica at ninety-one percent
> auto-recovery, Oracle EBS ship confirm at seventy-five percent. The TCS
> FAM team's manual workload: largely automated before the GCC team arrives.
>
> Click KT Progress." _[Switch tab]_
>
> "Seven months of actual data, six months of forecast. The bars grow because
> ZeroOps is building the knowledge base every single month — every incident
> resolved adds a pattern, raises a confidence score, creates institutional
> memory.
>
> Click Dual-Entity View." _[Switch tab]_
>
> "TCS manages seventy percent today. GCC incoming for thirty percent. Two
> domains — CRM and Analytics — already marked ready for handover. The complex
> Oracle and Informatica domains remain with TCS while the GCC team completes
> parallel run testing.
>
> The critical point: the GCC team does not inherit a set of manual runbooks.
> They inherit a ZeroOps platform that has been learning Canon's estate for
> six months — resolving incidents autonomously while they were being trained.
> The knowledge is in the system, not in the heads of the TCS engineers
> who are leaving."

---

## 13:30 — 15:00 · AGENTS & KB + CLOSE

_[Navigate to Agents & KB → Integrations tab.]_

> "Every system in Canon's estate. ELK Stack, Oracle Enterprise Manager,
> XURRENT — the SaaS ITSM. Oracle EBS, Oracle Finance, Oracle SCM,
> Informatica IICS, Primavera, Salesforce, Pearlchain, OAS, OCI.
>
> And the Oracle Ops Agent — a specialist agent for Oracle EBS concurrent
> processing, AR, and OTC. It knows WSHFSTRX, MTL_TRANSACTIONS_INTERFACE,
> WSH. Oracle-specific operational expertise encoded and automated.
>
> Nothing is ripped and replaced. The TCS teams continue. XURRENT continues.
> ZeroOps adds intelligence — and progressively transfers that intelligence
> to the GCC team."

_[Return to Command Centre]_

> "Three numbers.
>
> **Fifty hours** — Canon Europa MTTR today. Six to seven business days.
> Two teams working twenty-four seven to manage it.
>
> **Twenty hours** — where it is after six months. Sixty percent reduction.
> Your target delivered.
>
> **Zero** — previous AIOps failures at Canon. You are coming to this fresh,
> with a clear RFP mandate and no organisational scar tissue to overcome.
> That is an advantage.
>
> The RFP criteria are cost reduction and MTTR improvement. You have seen
> both — live, on Canon systems, with Canon incident patterns.
>
> And the Transfer Readiness page answers the question that every RFP
> evaluation eventually asks: what happens to the knowledge when the
> engagement ends? At Canon, the answer is: ZeroOps has been building that
> knowledge for six months before the GCC team arrives. They own it from
> day one.
>
> Thank you."

---

## ANTICIPATED QUESTIONS

**Q: How does ZeroOps work with the TCS FAM team?**
_"ZeroOps automates what FAM does manually — the job restarts, batch resets, transit file moves. FAM engineers focus on the complex ten percent that requires human judgment. The twenty-four seven rota burden for routine Informatica recovery: eliminated."_

**Q: XURRENT is our ITSM — how does integration work?**
_"XURRENT SaaS has a REST API — standard bidirectional integration. ZeroOps auto-creates incidents, updates status at each remediation step, and auto-closes on resolution. The XURRENT ticket is the full audit trail. Your ITSM processes are unchanged."_

**Q: How does Accenture fit — they run the DD process?**
_"ZeroOps auto-notifies Accenture the moment the mandate fix is applied — with full context for the rerun. Accenture engineers spend their time executing, not waiting for Canon IT to diagnose and confirm. The one-week delay compresses to same-period resolution."_

**Q: What about the GCC transfer — can we trust the knowledge?**
_"Every KB article is generated from a real resolved incident with a confidence score. If ZeroOps resolved the Informatica failure at ninety-one percent confidence eighteen times, the KB article reflects eighteen data points — not one consultant's memory. GCC inherits evidence-based institutional knowledge."_

**Q: Implementation timeline for Oracle?**
_"ELK and OEM connections are standard REST — days. XURRENT SaaS bidirectional sync is out of the box. Oracle EBS concurrent manager API is well-documented. First auto-resolutions — Informatica job restarts, ship confirm reprocessing — within two weeks of go-live. The TCS FAM team sees the difference in month one."_

---

_Speaker notes — Canon Europa N.V · ZeroOps RFP Evaluation · 15 minutes_
