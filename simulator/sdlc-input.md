# Requirements — New HL7 Interface for ABC (Site 8)

## Request Reference

- **Service Request**: SR-AG-00156
- **Requested by**: Klaus Weber
- **Priority**: High
- **Target go-live**: 4 weeks from approval

## Background

ABC is the eighth site onboarding to the AGFA PACS platform. The client operates a Siemens Healthineers RIS system and requires bidirectional HL7 messaging to be established with the AGFA HL7 Gateway before imaging services can go live.

## Connectivity Requirements

- **Site name**: ABC
- **AE title**: STA8_PACS
- **IP address**: 192.168.52.14
- **Port**: 2576
- **Protocol**: HL7 v2.6 over MLLP
- **Security**: TLS 1.3 required · client certificate from AGFA PKI
- **Sending system**: Siemens Syngo RIS v8.2

## Message Types Required

- **ADT**: A01 (Patient Admit), A03 (Discharge), A08 (Patient Update), A40 (Merge)
- **ORM**: O01 (New Imaging Order), O03 (Order Cancelled)
- **ORU**: R01 (Imaging Result), R03 (Display Results)
- **MDM**: T02 (Document Addendum — radiology reports)

## Routing Rules

- ADT → PACS worklist engine (priority routing for A01 and A03)
- ORM → DICOM order manager + worklist engine
- ORU → Results archive + referring physician notification service
- MDM → Document management system (new — not configured for Sites 1–7)

## Volume Estimates

- Peak ADT volume: 180 messages per hour (07:00–09:00 window)
- Daily ORM volume: approximately 340 imaging orders per day
- Expected modalities: CT, MRI, X-Ray, Ultrasound

## Acceptance Criteria

1. All ADT message types (A01, A03, A08, A40) routed correctly within 2 seconds
2. ORM messages trigger DICOM worklist entry within 30 seconds of receipt
3. ORU messages delivered to archive with zero loss
4. MDM document routing operational — new integration path required
5. HL7 message success rate above 99.9% under peak load
6. Zero impact on existing Sites 1–7 during cutover
7. TLS handshake verified from ABC's RIS system before go-live
8. Rollback possible within 10 minutes of any failure

## Special Considerations

- **MDM messages**: This is a new message type not handled by the current gateway configuration — interface design must include a new routing rule and archive connector
- **A40 Merge**: Patient merge events must update existing DICOM studies in the archive — requires coordination with VNA team
- **Siemens RIS quirk**: Syngo v8.2 sends non-standard OBX segments in ORU messages — field mapping validation required before go-live

## Out of Scope

- Siemens RIS configuration (handled by ABC's IT team)
- DICOM modality worklist configuration for individual scanners
- Radiologist user provisioning

## Constraints

- Change window available: Saturday 03:00–05:00
- CAB submission deadline: Wednesday 17:00
- Test environment must be validated by ABC's IT team before production deployment
- No service disruption permitted to existing 7 sites during any phase of this work
