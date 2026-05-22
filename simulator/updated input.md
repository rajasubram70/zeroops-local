1 Customer & Industry Context
Who is the customer and what do they care about?

Customer name \*
Full legal name or trading name Canon Europa N.V

Industry vertical \*
e.g. Healthcare, Manufacturing, Financial Services, Retail
Printing, Medical, Imaging and Industrial

Number of employees
Global headcount
13300

Countries of operation
Number and key geographies 39, Strategic Headquarters – London (UK) and Amstelveen (Netherlands), Central and Eastern Europe, Middle East and Africa, Western Europe, Nordics and Emerging Markets

IT headcount
Approximate number of IT operations staff
~300

Current IT mandate — what is the IT Head trying to achieve this year?
Select all that apply
☐ Cost reduction ☐ MTTR improvement ☐ Alert noise reduction
☐ On-call burden reduction ☐ Compliance / audit ☐ Engineer retention
☐ Ticket deflection ☐ Service reliability ☐ Cloud migration support
☐ Security posture ☐ Capacity management ☐ Other

What does success look like in 12 months?
Cost Reduction and frictionless operations including zero ticketing experience

Any known recent incidents or pain points the IT Head is aware of?

NA

2 Technology Stack
The tools they actually run today — not the roadmap

2.1 IT Service Management (ITSM)
The system of record for incidents, service requests, and change management.
ITSM platform in use
☐ ServiceNow ☐ BMC Remedy / Helix ☐ Jira Service Management
☐ Freshservice ☐ Cherwell / Ivanti ☐ Micro Focus SMAX
☐ CA Service Desk ☐ ManageEngine SD+ ☐ Home-grown / custom
☐ Other ☐ ☐

ITSM platform name and version \*
Exact product name and version if known
XURRENT. It is a SaaS version

Maturity of the ITSM implementation
Basic out-of-box / moderately customised / heavily customised
Moderately Customized

2.2 Monitoring & Observability
Every tool that fires alerts into the operations team. List all — not just the primary one.
Monitoring tools in use
☐ Dynatrace ☐ Datadog ☐ AppDynamics
☐ New Relic ☐ Nagios / Nagios XI ☐ Prometheus / Grafana
☐ SolarWinds ☐ ManageEngine OpManager ☐ BMC TrueSight
☐ Zabbix ☐ Azure Monitor ☐ AWS CloudWatch
☐ Splunk ITSI ☐ IBM Instana ☐ Other

Primary monitoring tool \*
The one the IT team watches most ELK and Oracle Enterprise Manager (OEM)

Approximate daily alert volume
How many alerts fire per day across all tools ~2000 ELK Alerts and ~2000 Oracle Alerts (50% needs to be reimagined)

Estimated % that are noise / duplicates
What fraction of alerts require no action?
~10-15%

2.3 Security Tooling
Security tools in use
☐ CrowdStrike Falcon ☐ SentinelOne ☐ Microsoft Defender
☐ Qualys ☐ Tenable ☐ Palo Alto Cortex
☐ Splunk SIEM ☐ IBM QRadar ☐ Microsoft Sentinel
☐ Zscaler ☐ Okta / Entra ID ☐ CyberArk PAM
☐ Other ☐ ☐

2.4 Infrastructure & Cloud
Hosting environment
☐ Predominantly on-premises ☐ Hybrid (on-prem + cloud) ☐ Multi-cloud
☐ Predominantly AWS ☐ Predominantly Azure ☐ Predominantly GCP
☐ Private DC / colocation ☐ Other ☐

Primary cloud provider \*
AWS / Azure / GCP / None Multi Cloud – Azure and Oracle Cloud Infrastructure

On-premises DC locations
City or country names This has been largely removed. Very minimal at Amstelveen (Netherlands) and Venlo (Netherlands)

2.5 Application Landscape
List the 5–8 most operationally critical applications. These become the service domains in the demo.
For each application provide: name · technology · hosting · approximate user count · impact if it goes down.
Application name Technology Hosting Users Impact if down
BizOps Oracle SCM OCI ~12000 Major
Finance Oracle Finance OCI ~12000 Major
CRM & Marketing SFDC Cloud ~17000 Major
Pearlchain - CPQ & CM Java OCI ~1900 Major
OAS Oracle Analytics OCI ~2100 High

2.6 Automation & Orchestration
What they use for runbooks and automation today — this is the 'OneEngine equivalent' in the demo.
Automation tools in use
☐ Ansible / Ansible Tower ☐ Terraform ☐ Chef
☐ Puppet ☐ ServiceNow Orchestration ☐ BMC TrueSight Automation
☐ Microsoft Azure Automation ☐ AWS Systems Manager ☐ Custom scripts (Bash/Python)
☐ Jenkins pipelines ☐ No automation today ☐ Other

Custom Scripts and Native Automation, ELK for Dashboarding

3 Incident Landscape
The most important section — real incidents become the demo scenarios

Why this section matters most
The most memorable demos are built around incidents the customer has actually experienced. When the IT Head sees their own failure mode playing out in the simulator — fixed in 11 minutes — the conversation changes immediately.
You do not need exact ticket numbers. A description of the pattern is enough. Provide 3–5 incident types. The first two become the Sentinel and Guardian scenarios.

Incident scenario 1
What fails and what is the visible symptom? \*

Data processing for some of the integrations fail. This is visible either:

1. As part of monitoring by the middleware team whether any job has created Data Issues.
2. User logs ticket of missing processing.
   Which application or system? \*

Informatica

Typical resolution steps today

There is no straight forward solution available so far for this issue. As a work around FAM takes the following actions.

1. FAM identifies all failed jobs and ensures that they are up and running after Start Integration process. If any of them gets unscheduled due to failure, FAM reschedules them manually.
2. For outbound jobs – FAM manually resets the batch status
3. For Inbound jobs – FAM finds the unprocessed files from the transit and moves them to the landing directory and triggers the jobs
4. For generic and other integrations – FAM needs to Trigger the jobs manually
   All the above-mentioned processes are manual where the involvement of the TAM (Admin) team is required. This adds dependency and takes more time to execute.
   Current MTTR \*

4-6 hours in each case
Frequency \*

2-3 times in a month

Business impact if unresolved

Although the FAM team makes every effort to process all files before the start of business hours, delays may occasionally happen due to high transaction volumes and often due to human mistake. Such delays can potentially lead to business escalations as they can result in:
• Delays in downstream systems and reporting
• Higher risk of data inconsistencies and processing errors
Increased operational overhead and manual intervention

Incident scenario 2
What fails and what is the visible symptom? \*

Ship confirmation records get stuck and are not completed successfully
• Ship confirmation does not complete for certain deliveries
• Orders remain in “Shipped” or “Awaiting Closure” status
• Order closure is delayed, preventing timely revenue booking
Which application or system? \*

Oracle E-Business Suite (EBS) – Order to Cash (OTC)
• Modules:
o Shipping Execution (WSH)
o Order Management (OM)
• Technology: Oracle EBS (Forms / Concurrent Processing), Oracle Database
Typical resolution steps today

• Operations team identifies stuck shipments through daily monitoring reports
• Support Engineer reviews ship confirmation errors in EBS and concurrent request logs
• Validates delivery details, inventory interface, and pending transactions
• Manually reprocesses or resets the ship confirmation
• In some cases, applies data fixes at the database level (with DBA support)
• Re-runs the ship confirm and order close processes
• Confirms that revenue recognition can proceed
Current MTTR \*

3-4 hours
Frequency \*

Daily
Business impact if unresolved

• Who notices:
o Finance and revenue accounting teams
o Supply chain operations team
o Sales operations management team
• What stops:
o Orders cannot be closed on time
o Revenue booking is delayed
o Manual follow-ups and escalations increase
o Risk of missing period-end revenue targets and reporting deadlines
Financial Impact
• Delayed revenue recognition -Creates risk of missing month end or quarter end revenue targets.
• Cash flow impact - Invoicing and collections are delayed by 1–3 business days or more, directly impacting Days Sales Outstanding

Manual effort increases:
• 2–3 operations and finance resources engaged per incident
• ~3–4 person hours per day spent on monitoring, troubleshooting, and reprocessing
End of period workload spike:
• Significant increase in manual interventions during month end / quarter end close
• Higher probability of human error due to time pressure

Incident scenario 3
What fails and what is the visible symptom? \*

Delivery of invoices delivered via Informatica at Primavera fails. This is noticed through the exception report.
Which application or system? \*

Primavera
Typical resolution steps today

Invoice header amount and sum of line amounts are not matching leading to failure of delivery. NSO SPOCs manually update the invoice header/lines data in Primavera system and pushes for successful delivery to end customer.
Current MTTR \*

1-2 business days
Frequency \*

Monthly (10-15 Invoices)
Business impact if unresolved

Extra workload for NSO to clear these invoices manually

Incident scenario 4
What fails and what is the visible symptom? \*

Direct Debit (DD) Authorization delays because of errors. While executing DD authorization, invoices are not being picked, due to a bank mandate issue.
Which application or system? \*

Oracle E-Business Suite (EBS)

Typical resolution steps today

AR will reverse the impacted receipts and share the list of Invoices with Canon IT and Collectors (to inform customers)
Canon IT will resolve the mandate issue in the backend and confirmation shared to Accenture Team.
Accenture Team can run DD only after a week as these runs are scheduled for ES NSO for the affected customers, which involves additional effort and delay in collections. All the failed invoices will be tracked separately until the issues are fully resolved.

Additional effort for AR. Longer turnaround and Customer dissatisfaction
Current MTTR \*

1 week

Frequency \*

Weekly
Business impact if unresolved

Delay in collection. Noticed by the collection manager.

Incident scenario 5
What fails and what is the visible symptom? \*
e.g. Oracle EBS login page unresponsive · users cannot access order management

Which application or system? \*
Application name and technology

Typical resolution steps today
Brief description — what does the engineer do?

Current MTTR \*
Rough time from detection to resolution

Frequency \*
Weekly / monthly / quarterly

Business impact if unresolved
Who notices? What stops?

4 Service Request Catalogue
High-volume requests that are candidates for autonomous fulfilment

List 5–10 common service requests. Focus on requests that are: high volume, currently slow to fulfil, or involve simple approvals that could be automated.

Request type Fulfilment time today Monthly volume Approval steps?
Knowledge Issue ~2 Elapsed Days 250 Tickets None
Bug in current code ~10-15 Elapsed Days 100 Tickets Goes through SDLC cycle
Monitoring and Taking action to resolve ~2-5 Elapsed Days 100 Tickets None
Request for changes (Data, Configuration changes etc) 3-6 Elapsed Days ~200 Tickets User Validation

5 Pain Points & Desired Outcomes
What the IT Head complains about and what good looks like

Top 3 pain points — rank by priority
Select the three that matter most to this customer
☐ Alert fatigue — too much noise, not enough signal ☐ MTTR — incidents take too long to resolve ☐ On-call burden — engineers woken for preventable issues
☐ Ticket queue — service requests backing up ☐ Compliance / audit risk from manual processes ☐ Engineer retention — people leaving due to toil
☐ Cost — operational spend too high for outcomes delivered ☐ Visibility — no single pane of glass across the estate ☐ Capacity planning — always reacting, never proactive
☐ Security posture — alert volume overwhelming SOC team ☐ Change risk — too many failed or rolled-back changes ☐ Other

What does a successful outcome look like in 12 months?

Cost down by 30%
MTTR down by 60%

Baseline metrics today (if known)

Average MTTR – 6-7 business days

6 Demo Audience & Positioning
Who is in the room and what do we need to be careful about?

Primary audience for the demo
Select all who will be in the room
☐ CIO / IT Director ☐ IT Operations Head ☐ NOC Manager
☐ Platform / Infrastructure Lead ☐ Enterprise Architect ☐ CISO / Security Lead
☐ Finance / Procurement ☐ Technical Architect ☐ Service Desk Manager
☐ DevOps / Engineering Lead ☐ Other ☐

Is there an incumbent AIOps or observability vendor?
Name the vendor if applicable — helps us position appropriately
No

Is this an active procurement or exploratory? \*
Active evaluation / exploratory / proof of concept / other
RFP based procurement

Any previous failed automation or AIOps projects?

No.

Any teams or individuals likely to feel threatened by autonomous operations?

No.

Additional input:
XURRENT is a SaaS platform. Company Name: XURRENT.
AZURE vs OCI SPLIT — The workbook says Multi-Cloud: Azure + OCI. We have assumed all Oracle apps (EBS, Finance, Pearlchain, OAS, Informatica, Primavera) are on OCI. Is this correct? Specifically — is there anything on Azure we should show? Azure Monitor is a likely monitoring source if so. Yes, these are hosted in OCI. Canon has very limited presence in Azure from application perspective.

- Any specific pain point Canon has raised verbally that did not make it into the workbook. MTTR is higher, it needs to go down. Operations should be AI led.
- Current on-call rota burden — how many engineers are woken per week for Informatica or EBS issues. We have EBS and Informatica team working 24\*7 to avoid issues.

- Whether the FAM team (mentioned in the Informatica scenario) is internal Canon or outsourced. It is outsourced to TCS.
