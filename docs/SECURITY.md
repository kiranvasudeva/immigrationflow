# Security & GDPR Compliance Documentation

## Data Protection Overview

ImmigrationFlow processes personal data for Romanian immigration workflows and is designed with GDPR compliance at its core. This document outlines our data protection measures, security controls, and compliance procedures.

## Data Processing Legal Basis

### Article 6(1) GDPR - Lawfulness of Processing
- **Contract performance** (Art. 6(1)(b)): Processing necessary for immigration service delivery
- **Legal obligation** (Art. 6(1)(c)): Compliance with Romanian immigration law requirements
- **Legitimate interests** (Art. 6(1)(f)): Operational necessity for service provision

### Article 9 GDPR - Special Categories
When processing special category data (nationality, ethnicity):
- **Explicit consent** obtained for sensitive data processing
- **Legal claims** for immigration legal proceedings
- **Public interest** for immigration law compliance

## Data Categories & Retention

### Personal Data Processed

| Data Category | Examples | Legal Basis | Retention Period |
|---------------|----------|-------------|------------------|
| **Identity Data** | Name, nationality, passport details | Contract + Legal obligation | 7 years post-completion |
| **Contact Data** | Email, phone, address | Contract | 7 years post-completion |
| **Employment Data** | Job offers, work contracts | Contract + Legal obligation | 7 years post-completion |
| **Document Images** | Passport scans, certificates | Contract + Legal obligation | 7 years post-completion |
| **Application Status** | Workflow stage, decision history | Legal obligation | 7 years post-completion |
| **Audit Data** | User actions, access logs | Legitimate interests | 7 years |

### Data Retention Schedule

1. **Active Cases**: Data retained during active immigration process
2. **Completed Cases**: 7-year retention for legal compliance
3. **Failed Applications**: 3-year retention for appeals process
4. **Audit Logs**: 7-year retention for compliance monitoring
5. **System Logs**: 90-day retention for operational purposes

## Technical Security Measures

### Encryption & Data Protection

**Data in Transit:**
- TLS 1.3 encryption for all communications
- Certificate pinning for API connections
- Secure WebSocket connections for real-time updates

**Data at Rest:**
- AES-256 encryption for database storage
- S3 server-side encryption for document storage
- Encrypted backup storage with rotation

**Application Security:**
- JWT token authentication with secure signing
- Role-based access control (RBAC)
- Session management with HTTP-only cookies
- CSRF protection on all state-changing endpoints
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries

### Infrastructure Security

**Server Hardening:**
- Regular security updates and patching
- Minimal attack surface with Alpine Linux
- Non-root container execution
- Resource limits and health monitoring

**Network Security:**
- VPC isolation in production environments
- Firewall rules limiting external access
- Internal service communication encryption
- Regular security scanning and vulnerability assessment

**File Upload Security:**
- ClamAV malware scanning for all uploads
- File type validation and size limits
- Quarantine system for suspicious files
- Signed URL access with expiration

## Data Subject Rights

### Right of Access (Article 15)
Data subjects can request:
- Confirmation of data processing
- Copy of personal data held
- Information about processing purposes
- Details of data recipients

**Implementation**: `GET /api/data-subject/export` endpoint

### Right to Rectification (Article 16)
Data subjects can request correction of:
- Inaccurate personal data
- Incomplete information

**Implementation**: Standard update endpoints with audit trail

### Right to Erasure (Article 17)
Data subjects can request deletion when:
- Data no longer necessary for original purpose
- Consent withdrawn (where applicable)
- Data unlawfully processed
- Legal obligation to delete

**Implementation**: `DELETE /api/data-subject/erase` with cascading deletion

### Right to Data Portability (Article 20)
Data subjects can receive:
- Personal data in structured, machine-readable format
- Transmission to another controller where technically feasible

**Implementation**: `GET /api/data-subject/export?format=json` endpoint

### Right to Object (Article 21)
Data subjects can object to processing based on:
- Legitimate interests (Article 6(1)(f))
- Direct marketing purposes

**Implementation**: Consent management system with granular controls

## Data Protection Impact Assessment (DPIA)

### High-Risk Processing Activities
- **Automated decision-making**: Workflow status automation
- **Large-scale processing**: Multi-client immigration data
- **Special category data**: Nationality and ethnicity information
- **Cross-border transfers**: Romanian government system integration

### Risk Mitigation Measures
1. **Technical measures**: Encryption, access controls, audit logging
2. **Organizational measures**: Staff training, data minimization, purpose limitation
3. **Legal measures**: Data processing agreements, privacy policies
4. **Physical measures**: Secure data centers, access restrictions

## Incident Response Procedure

### Data Breach Response Plan

**Phase 1: Detection & Assessment (0-1 hours)**
1. Incident identification and classification
2. Immediate containment measures
3. Initial impact assessment
4. Stakeholder notification

**Phase 2: Investigation & Containment (1-24 hours)**
1. Detailed forensic investigation
2. Root cause analysis
3. Additional containment measures
4. Evidence preservation

**Phase 3: Notification & Recovery (24-72 hours)**
1. Supervisory authority notification (where required)
2. Data subject notification (if high risk)
3. System recovery and testing
4. Security improvements implementation

**Phase 4: Review & Documentation**
1. Post-incident review
2. Process improvements
3. Documentation updates
4. Staff retraining

### Breach Notification Thresholds

**Supervisory Authority (72 hours):**
- Risk to rights and freedoms of data subjects
- Unauthorized access to personal data
- Data integrity compromise
- Availability disruption affecting service delivery

**Data Subjects (Without undue delay):**
- High risk to rights and freedoms
- Sensitive data exposure
- Financial or identity theft risk
- Potential discrimination or reputational damage

## Compliance Monitoring

### Regular Audits
- **Quarterly**: Access control reviews and permission audits
- **Annually**: Full GDPR compliance assessment
- **Continuous**: Automated log monitoring and anomaly detection

### Compliance Metrics
- Data subject request response times
- Security incident frequency and severity
- Staff training completion rates
- System availability and backup success rates

### Documentation Requirements
- **Data Processing Records**: Maintained per Article 30
- **Privacy Policies**: Updated and accessible
- **Consent Records**: Granular tracking with timestamps
- **Training Records**: Staff GDPR awareness documentation

## Data Processing Agreements (DPA)

### Third-Party Processors

**Email Service Provider (Mailjet/Postmark):**
- EU-based servers for GDPR compliance
- Standard contractual clauses for data transfers
- Data encryption and access controls
- Regular security assessments

**Cloud Infrastructure (Neon, AWS/Hetzner):**
- EU data centers only
- GDPR-compliant data processing agreements
- Encryption at rest and in transit
- Regular compliance certifications

**File Storage (S3-compatible):**
- EU region deployment mandatory
- Server-side encryption enabled
- Access logging and monitoring
- Backup encryption and retention

## Security Monitoring

### Automated Monitoring
- **Real-time alerts**: Suspicious access patterns
- **Log analysis**: Automated PII detection and scrubbing
- **Performance monitoring**: Service availability and response times
- **Security scanning**: Regular vulnerability assessments

### Manual Reviews
- **Monthly**: Access log reviews and user permission audits
- **Quarterly**: Security policy reviews and updates
- **Annually**: Penetration testing and security assessments

## Contact Information

### Data Protection Officer
**Email**: dpo@immigrationflow.com
**Response Time**: 48 hours for data subject requests

### Security Team
**Email**: security@immigrationflow.com
**Emergency**: 24/7 incident response hotline

### Supervisory Authority
**Romania ANSPDCP**: https://www.dataprotection.ro/
**Emergency Contact**: Available for high-risk breaches

## Training & Awareness

### Staff Training Requirements
- **Initial training**: GDPR fundamentals and company policies
- **Annual refresher**: Updated regulations and procedures
- **Role-specific**: Additional training for data processors
- **Incident response**: Emergency procedures and escalation

### Security Awareness
- **Phishing simulation**: Monthly testing and training
- **Password policies**: Strong authentication requirements
- **Access controls**: Principle of least privilege
- **Clean desk**: Physical security measures

## Regular Reviews

This security documentation is reviewed and updated:
- **Monthly**: Threat landscape and security controls
- **Quarterly**: Compliance procedures and training materials
- **Annually**: Complete security program assessment
- **As needed**: Following incidents or regulatory changes

---

**Document Version**: 1.0  
**Last Updated**: August 30, 2025  
**Next Review**: November 30, 2025