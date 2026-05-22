# ZeroOps Service Map — Canon Europa · Talking Points

### Layer 1: Value Chains | Layer 2: Applications | Layer 3: Infra + Blast Radius

---

## OPENING (before clicking)

> "Four value chains. Eight applications. All on Oracle Cloud Infrastructure
> — with Salesforce cloud-native. The RAG status is live. Two chains are red
> or amber. ZeroOps is already working on both."

---

## LAYER 1 — VALUE CHAINS

**INTEGRATION & MIDDLEWARE [RED — 94.1%]**

> "The most critical chain. Red because Informatica is down — seven jobs failed,
> twenty-four transit files stuck. When this chain fails, every other chain is
> downstream of it. ZeroOps auto-recovery is already executing."

**ORACLE CORE ERP [AMBER — 96.2%]**

> "Amber because two of three applications are red. Oracle Finance has two
> hundred and eighty-four AR invoices stuck in the Direct Debit run. Oracle
> EBS has thirty-eight ship confirmations blocked — revenue recognition cannot
> proceed. This is the daily incident that costs three to four engineer hours,
> every day."

**CRM & DIGITAL [GREEN — 99.1%]**

> "Salesforce healthy — seventeen thousand users, all fine. Pearlchain amber
> because its pricing cache is two hours stale from the Informatica feed delay.
> One red node upstream, amber ripple downstream."

**ANALYTICS & REPORTING [GREEN — 98.6%]**

> "OAS is green — but only because ZeroOps resolved the Informatica→OAS feed
> delay at 06:47 this morning before the first business user opened a dashboard."

---

## LAYER 2 — APPLICATIONS

**[Click INTEGRATION & MIDDLEWARE]**

> "Two applications. Informatica — the integration backbone. Primavera — twelve
> invoice deliveries failing from header/line mismatches. Both being worked by
> ZeroOps right now."

**[Click ORACLE CORE ERP]**

> "Three applications. BizOps SCM amber — concurrent request queue backing up.
> Oracle Finance red — Direct Debit process failed. Oracle EBS red — thirty-eight
> ship confirmations blocked. This is the revenue impact chain."

---

## LAYER 3 — INFRASTRUCTURE DIAGNOSTICS

**[Click Informatica]**

> "Three infra components. Failed Jobs: seven. Job Scheduler: three disabled —
> the scheduler auto-disables on failure, which is why this historically required
> a TCS FAM admin to manually re-enable it at any hour. Transit Files: twenty-four
> stuck. ZeroOps is executing the recovery right now."

**[Click Oracle EBS]**

> "WSH Concurrent: thirty-eight stuck. Inventory Interface: pending.
> MTL_TRANSACTIONS_INTERFACE — one hundred and fifty-six records not clearing.
> ZeroOps traces this in thirty seconds. A support engineer reviewing concurrent
> logs and escalating to a DBA: three to four hours."

**[Click Oracle Finance]**

> "Two hundred and eighty-four invoices not picked in the DD run. Bank mandate
> expired for thirty-one customers. ZeroOps auto-reverses AR receipts, fixes the
> mandate in Oracle AR, notifies Accenture for same-period rerun. One week becomes
> four hours."

**[Click Primavera]**

> "Twelve invoices failed delivery — Informatica rounding error causing header and
> line totals to differ. ZeroOps auto-corrects nine within tolerance. Three go to
> NSO SPOC. Forty-five minutes versus one to two business days."

---

## BLAST RADIUS

**[Click ⚠ Blast Radius on Informatica — the demo moment]**

> "Six downstream systems. This is the cascade if Informatica stays down.
>
> Oracle EBS OTC — ship confirm jobs lose their data feed. Revenue blocked.
> Oracle Finance — AR and GL feeds interrupted. Reporting goes stale.
> Salesforce — opportunity and order sync stops. Seventeen thousand CRM users.
> Pearlchain — pricing data stale. Sales quotes unreliable.
> OAS Analytics — all Oracle data reports show yesterday's data.
> Primavera — invoice delivery pipeline stops.
>
> One application. Six downstream systems. Twelve thousand Oracle users,
> seventeen thousand Salesforce users — all impacted within hours.
>
> ZeroOps maps this cascade in real time. And resolves the root node
> before the cascade reaches your users."

**[Click ⚠ Blast Radius on Oracle EBS]**

> "Three downstream systems. Oracle Finance — revenue recognition blocked.
> BizOps SCM — supply chain order status out of sync. OAS — revenue
> dashboards show incomplete data.
>
> This is the daily incident. Every day. ZeroOps resolves it before
> Finance opens their monitoring reports."

---

## CLOSE

> "This is not a monitoring dashboard. A monitoring dashboard shows you
> what is broken. This shows you what is about to break, why it will break,
> what breaks next if it does — and what ZeroOps is already doing about it.
>
> The Informatica node is red right now. ZeroOps is recovering it. By
> the time twelve thousand Canon users log in, it will be green.
> No TCS FAM engineer woken. No ticket raised. No user affected."

---

_Service Map talking points — Canon Europa N.V_
