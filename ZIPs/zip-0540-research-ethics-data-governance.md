---
zip: 540
title: Research Ethics & Data Governance
tags: [research, ethics, data, governance]
description: Framework for ethical research practices and responsible data governance in conservation.
author: Zoo Labs Foundation (@zoolabs)
discussions-to: https://github.com/zoolabs/zips/discussions
status: Draft
type: Meta
created: 2025-12-17
requires: [500, 530]
---

# ZIP-540: Research Ethics & Data Governance

## Abstract

This ZIP establishes the framework for ethical research practices and responsible data governance in Zoo Labs Foundation conservation initiatives. It defines ethical review processes, data management standards, publication ethics, and technology deployment principles.

## Research Ethics Framework

### Ethical Principles

| Principle | Application |
|-----------|-------------|
| **Beneficence** | Research benefits conservation and communities |
| **Non-maleficence** | Minimize harm to wildlife, habitats, communities |
| **Justice** | Fair distribution of benefits and burdens |
| **Respect** | Respect for communities, wildlife, ecosystems |
| **Integrity** | Honest, rigorous scientific practice |

### Ethical Considerations by Domain

#### Wildlife Research

| Consideration | Requirement |
|---------------|-------------|
| **Animal welfare** | Minimize disturbance and harm |
| **Necessity** | Research justified by conservation need |
| **Methods** | Least invasive appropriate method |
| **Sample sizes** | Minimum needed for valid results |
| **Release** | Safe return to wild |

#### Community-Engaged Research

| Consideration | Requirement |
|---------------|-------------|
| **FPIC** | Full consent process (see ZIP-530) |
| **Benefit sharing** | Communities share benefits |
| **Participation** | Meaningful involvement |
| **Data sovereignty** | Community data rights |

#### AI/Technology Research

| Consideration | Requirement |
|---------------|-------------|
| **Privacy** | Protect human privacy |
| **Bias** | Test for and mitigate bias |
| **Transparency** | Disclose AI use |
| **Accountability** | Clear responsibility |

## Ethics Review Process

### Review Categories

| Category | Criteria | Review Level |
|----------|----------|--------------|
| **Exempt** | Existing data, no human/wildlife contact | Self-assessment |
| **Expedited** | Minimal risk, standard methods | Staff review |
| **Full** | Higher risk, new methods, sensitive | Committee review |

### Review Criteria

| Criterion | Assessment |
|-----------|------------|
| **Scientific merit** | Sound methodology |
| **Conservation value** | Clear benefit |
| **Risk assessment** | Identified and mitigated |
| **Consent** | Appropriate consent processes |
| **Data management** | Responsible data plans |
| **Dissemination** | Appropriate sharing plans |

### Ethics Committee

| Role | Responsibility |
|------|----------------|
| **Chair** | Process oversight |
| **Conservation scientist** | Scientific review |
| **Community representative** | Community perspective |
| **Indigenous representative** | Indigenous rights |
| **External reviewer** | Independent assessment |

### Review Process

```
1. Research proposal submission
    ↓
2. Category determination
    ↓
3. Review (appropriate level)
    ↓
4. Decision (approve/revise/reject)
    ↓
5. Monitoring (ongoing compliance)
    ↓
6. Completion review
```

### Timeline

| Review Type | Timeline |
|-------------|----------|
| **Exempt** | 1 week |
| **Expedited** | 2 weeks |
| **Full** | 4-6 weeks |
| **Amendments** | 1-2 weeks |

## Wildlife Research Standards

### Welfare Requirements

| Requirement | Standard |
|-------------|----------|
| **Capture methods** | Approved, minimally invasive |
| **Handling** | Trained personnel, minimal duration |
| **Tagging/marking** | Appropriate size, minimal impact |
| **Samples** | Minimum needed, justified |
| **Release** | Monitored recovery |

### Permit Compliance

| Requirement | Implementation |
|-------------|----------------|
| **Research permits** | Obtained before research |
| **CITES** | Compliance for protected species |
| **National laws** | Local legal compliance |
| **Access agreements** | Site access permissions |

### Invasive Procedures

| Procedure | Requirement |
|-----------|-------------|
| **Surgery** | Veterinary supervision |
| **Implants** | Justified necessity, appropriate size |
| **Sampling** | Minimum quantities |
| **Euthanasia** | Only when necessary, humane methods |

### Monitoring & Reporting

| Requirement | Implementation |
|-------------|----------------|
| **Welfare monitoring** | Ongoing during study |
| **Incident reporting** | Immediate report of problems |
| **Annual reporting** | Summary to ethics committee |
| **Post-study** | Long-term impact monitoring |

## Data Governance

### Data Principles

| Principle | Implementation |
|-----------|----------------|
| **FAIR** | Findable, Accessible, Interoperable, Reusable |
| **CARE** | Collective benefit, Authority, Responsibility, Ethics |
| **Quality** | Accurate, complete, consistent |
| **Security** | Protected from unauthorized access |
| **Sustainability** | Long-term preservation |

### Data Categories

| Category | Examples | Governance |
|----------|----------|------------|
| **Species data** | Observations, monitoring | Open with exceptions |
| **Sensitive location** | Endangered species sites | Restricted access |
| **Community data** | Survey responses, knowledge | Community-controlled |
| **Indigenous knowledge** | Traditional practices | CARE principles |
| **Personal data** | Researcher info | Privacy protected |

### Data Lifecycle

```
Collection → Storage → Analysis → Sharing → Archiving → Deletion
     ↑          ↑          ↑          ↑          ↑           ↑
   Policy    Policy     Policy     Policy    Policy      Policy
```

### Data Management Plan

| Element | Requirement |
|---------|-------------|
| **Description** | What data will be collected |
| **Formats** | Data formats and standards |
| **Storage** | Where and how stored |
| **Security** | Protection measures |
| **Sharing** | Who can access, when |
| **Preservation** | Long-term archiving |
| **Responsibilities** | Who manages the data |

### Sensitive Data Protection

| Data Type | Protection Measures |
|-----------|---------------------|
| **Endangered species locations** | Coordinate fuzzing, access control |
| **Anti-poaching operations** | Encryption, strict access |
| **Community data** | FPIC, community control |
| **Personal data** | Privacy laws compliance |

### Data Sharing Standards

| Sharing Level | Access |
|---------------|--------|
| **Open** | Public access, no restrictions |
| **Registered** | Requires account/agreement |
| **Restricted** | Case-by-case approval |
| **Confidential** | Partners/funders only |
| **Sovereign** | Community-controlled |

## Publication Ethics

### Publication Principles

| Principle | Implementation |
|-----------|----------------|
| **Integrity** | Accurate, honest reporting |
| **Attribution** | Proper credit to all contributors |
| **Transparency** | Disclose methods, data, conflicts |
| **Access** | Open access where possible |
| **Sensitivity** | Protect sensitive information |

### Authorship Standards

| Criterion | Required |
|-----------|----------|
| **Substantial contribution** | Design, data, analysis, or writing |
| **Drafting/revision** | Critical intellectual input |
| **Final approval** | Agree to submitted version |
| **Accountability** | Responsible for accuracy |

### Community Authorship

| Requirement | Implementation |
|-------------|----------------|
| **Knowledge contributions** | Acknowledged as authors |
| **Community review** | Right to review before submission |
| **Community veto** | Right to prevent publication |
| **Appropriate credit** | Named appropriately |

### Sensitive Information

| Information Type | Handling |
|------------------|----------|
| **Endangered species locations** | Generalized or withheld |
| **Poaching vulnerability** | Exclude exploitable details |
| **Traditional knowledge** | Community consent for publication |
| **Personal information** | De-identified |

### Open Access

| Commitment | Implementation |
|------------|----------------|
| **Gold OA** | Prefer fully open access journals |
| **Green OA** | Deposit preprints/postprints |
| **Data availability** | Share data where appropriate |
| **Code availability** | Open source analysis code |

## Technology Deployment

### Deployment Standards

| Standard | Requirement |
|----------|-------------|
| **Testing** | Thorough testing before deployment |
| **Validation** | Local validation |
| **Training** | User training |
| **Support** | Ongoing technical support |
| **Monitoring** | Performance and impact tracking |

### AI Ethics in Conservation

| Requirement | Implementation |
|-------------|----------------|
| **Transparency** | Disclose AI use |
| **Accuracy** | Validate AI outputs |
| **Bias** | Test for bias against species/regions |
| **Human oversight** | Human review of critical decisions |
| **Accountability** | Clear responsibility for errors |

### Technology Transfer

| Principle | Implementation |
|-----------|----------------|
| **Capacity building** | Build local expertise |
| **Sustainability** | Ensure long-term viability |
| **Appropriateness** | Fit local context |
| **Ownership** | Clear ownership arrangements |

## Compliance & Monitoring

### Compliance Framework

| Level | Mechanism |
|-------|-----------|
| **Self-assessment** | Researcher checklist |
| **Internal review** | Staff review |
| **Ethics committee** | Formal review |
| **External audit** | Independent assessment |

### Monitoring Activities

| Activity | Frequency |
|----------|-----------|
| **Protocol compliance** | Ongoing |
| **Data management** | Quarterly |
| **Publication ethics** | Per publication |
| **Annual review** | Annual |

### Non-Compliance Response

| Severity | Response |
|----------|----------|
| **Minor** | Correction, documentation |
| **Moderate** | Remediation plan, monitoring |
| **Serious** | Investigation, suspension |
| **Critical** | Termination, reporting |

## Related ZIPs

- **ZIP-500**: ESG Principles for Conservation Impact
- **ZIP-501**: Conservation Impact Measurement
- **ZIP-510**: Species Protection & Monitoring
- **ZIP-520**: Habitat Conservation
- **ZIP-530**: Community Partnerships & FPIC

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
