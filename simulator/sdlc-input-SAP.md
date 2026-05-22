# Purchase Order Approval Workflow Enhancement

**Type:** Service Request — New Capability  
**Priority:** Medium  
**Raised by:** Finance Operations  
**Target:** Q3 2026

---

## Background

The current purchase order approval process in SAP S/4HANA requires approvers to log directly into the SAP Fiori launchpad to action pending approvals. Approvers working remotely or on mobile devices report significant friction — login time, session timeouts, and navigation complexity result in approvals being delayed by an average of 18 hours beyond the requested response window.

Finance Operations has identified that 340 purchase orders per month are delayed beyond their approval deadline, causing downstream procurement delays, supplier relationship issues, and in some cases emergency purchasing outside the standard process at higher cost.

---

## Objective

Deliver a lightweight, mobile-friendly SAP Fiori approval application that allows authorised approvers to review and action purchase order approval requests from any device, with full SAP workflow integration, without compromising financial controls or audit requirements.

---

## Scope

### In Scope

- New SAP Fiori Elements application for PO approval (single-purpose, mobile-optimised)
- Integration with SAP MM purchasing workflow (WS20000075)
- Push notification to approver on new PO submission requiring action
- Approve, reject and forward-to-delegate actions
- PO summary view: vendor, line items, total value, cost centre, requestor, justification notes
- Delegation rule configuration (approver sets delegate during absence)
- Full SAP workflow audit trail preserved
- Role-based access — purchasing approver role only

### Out of Scope

- PO creation or amendment
- Changes to approval threshold configuration (managed by Finance separately)
- Integration with non-SAP procurement systems
- Supplier portal or external-facing capabilities

---

## Functional Requirements

### FR-01 — Approval Inbox

The application shall display all purchase orders pending the logged-in user's approval, sorted by submission date (oldest first).  
Each item shall display: PO number, vendor name, total value, currency, cost centre, requestor name, and submission date.  
Items overdue beyond the approval SLA shall be highlighted visually.

### FR-02 — PO Detail View

On selecting a PO, the approver shall see a full summary including: all line items (material/service, quantity, unit price, total), vendor details, payment terms, delivery date, cost centre breakdown, and the requestor's justification text.  
Prior approval history for the same PO shall be visible (for multi-level workflows).

### FR-03 — Approve Action

The approver shall be able to approve a PO with an optional comment.  
Approval shall trigger immediate progression of the SAP workflow to the next step or final release.  
Confirmation shall be displayed and the item removed from the inbox within 5 seconds.

### FR-04 — Reject Action

The approver shall be able to reject a PO with a mandatory rejection reason (free text, minimum 20 characters).  
Rejection shall return the PO to the requestor in SAP workflow with the rejection reason attached.  
The requestor shall receive an email notification of the rejection.

### FR-05 — Forward to Delegate

The approver shall be able to forward a specific PO approval to a nominated colleague.  
The delegate must hold the purchasing approver role.  
Forwarding shall be logged in the SAP workflow audit trail with the forwarder's user ID and timestamp.

### FR-06 — Absence Delegation

The approver shall be able to configure a standing delegate for a defined date range (absence period).  
During the delegation period, all incoming approval requests shall be routed to the delegate automatically.  
The original approver shall still have read access to pending items during their absence.

### FR-07 — Notifications

The application shall send a push notification (via SAP BTP) and an email to the approver when a new PO is submitted for their approval.  
Notification shall include: PO number, vendor, value, and a deep link directly to the PO detail view.  
Approvers who have not actioned a request within 24 hours shall receive a reminder notification.

### FR-08 — Audit Trail

All actions taken within the application (approve, reject, forward, delegate) shall be recorded in the SAP workflow audit trail with full user ID, timestamp, action type, and any associated comment.  
No action shall be possible outside the standard SAP authorisation check.

---

## Non-Functional Requirements

### NFR-01 — Performance

The approval inbox shall load within 3 seconds on a standard 4G mobile connection.  
Approve and reject actions shall complete (workflow updated) within 5 seconds.

### NFR-02 — Availability

The application shall maintain 99.5% availability during business hours (07:00–20:00 local time).

### NFR-03 — Security

Access is restricted to users holding the standard purchasing approver role in SAP.  
All API calls between the Fiori frontend and SAP backend shall use OAuth 2.0 via SAP BTP.  
No PO data shall be cached on the device beyond the active session.

### NFR-04 — Compatibility

The application shall function on iOS 16+ and Android 12+ via the SAP Fiori mobile app.  
Desktop browsers (Chrome, Edge) shall also be supported via the standard Fiori launchpad.

### NFR-05 — Accessibility

The application shall meet WCAG 2.1 AA accessibility standards.

---

## Acceptance Criteria

1. All purchase orders pending approval are visible in the inbox within 30 seconds of workflow trigger
2. Approve action completes SAP workflow step and removes item from inbox within 5 seconds
3. Reject action returns PO to requestor with reason attached and triggers email notification
4. Forward to delegate logs correctly in SAP workflow audit trail
5. Absence delegation routes all incoming approvals to the configured delegate during the set period
6. Push notifications delivered within 60 seconds of PO submission for approval
7. Application loads in under 3 seconds on a 4G connection (tested on iPhone 14 and Samsung S23)
8. All actions pass SAP authorisation check — no bypass possible
9. No P1 or P2 defects at go-live
10. UAT sign-off obtained from Finance Operations team lead

---

## Dependencies

| Dependency                                                | Status                  |
| --------------------------------------------------------- | ----------------------- |
| SAP BTP subaccount configured for Fiori mobile deployment | Available               |
| SAP MM purchasing workflow active and accessible via API  | Available               |
| OAuth 2.0 trust configuration between Fiori and S/4HANA   | To be confirmed         |
| Push notification service (SAP Mobile Services)           | Licence to be confirmed |
| Finance Operations UAT participants (minimum 5 approvers) | To be arranged          |

---

## Assumptions

- Existing SAP purchasing approver role can be extended without a new authorisation concept
- SAP BTP Mobile Services licence covers push notification delivery
- UAT will be conducted in the quality system using representative PO data
- Delegation configuration is self-service by the approver — no IT involvement required

---

## Estimated Effort

| Component                               | Estimate    |
| --------------------------------------- | ----------- |
| Fiori Elements app (OData service + UI) | 8 days      |
| SAP BTP integration and OAuth setup     | 3 days      |
| Push notification configuration         | 2 days      |
| Delegation logic (workflow enhancement) | 3 days      |
| Testing and UAT support                 | 4 days      |
| **Total**                               | **20 days** |
