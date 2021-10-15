---
zip: 510
title: Species Protection & Monitoring
tags: [conservation, species, monitoring, technology]
description: Framework for species protection initiatives and monitoring programs.
author: Zoo Labs Foundation (@zoolabs)
discussions-to: https://github.com/zoolabs/zips/discussions
status: Draft
type: Meta
originated: 2021-10
traces-from: "Whitepaper section 03 (Sustainability)"
follow-on: [zoo-wildlife-tracking]
created: 2025-12-17
requires: [500, 501]
---

# ZIP-510: Species Protection & Monitoring

## Abstract

This ZIP establishes the framework for Zoo Labs Foundation's species protection and monitoring initiatives. It defines priority-setting criteria, monitoring methodologies, technology deployment standards, and success metrics for species-focused conservation work.

## Species Prioritization

### Priority Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Conservation status** | 30% | IUCN Red List category |
| **Uniqueness** | 20% | Evolutionary distinctiveness |
| **Feasibility** | 20% | Likelihood of success |
| **Opportunity** | 15% | Partner/site availability |
| **Technology fit** | 15% | AI/tech applicability |

### Conservation Status Scoring

| IUCN Category | Score |
|---------------|-------|
| **Critically Endangered (CR)** | 5 |
| **Endangered (EN)** | 4 |
| **Vulnerable (VU)** | 3 |
| **Near Threatened (NT)** | 2 |
| **Data Deficient (DD)** | 3 (high uncertainty value) |
| **Least Concern (LC)** | 1 |

### Priority Species Categories

| Category | Definition | Examples |
|----------|------------|----------|
| **Flagship** | High-profile, ecosystem representatives | Great apes, elephants |
| **Keystone** | Disproportionate ecological role | Apex predators, pollinators |
| **Indicator** | Health of ecosystem | Amphibians, corals |
| **Umbrella** | Protection benefits many species | Wide-ranging species |
| **Edge** | Evolutionarily distinct | EDGE species |

## Monitoring Methodologies

### Survey Methods

#### Direct Observation

| Method | Application | Technology |
|--------|-------------|------------|
| **Line transects** | Population density | GPS, data apps |
| **Point counts** | Species presence | Audio recording |
| **Focal follows** | Behavior, health | Video recording |
| **Mark-recapture** | Population size | Individual ID |

#### Remote Sensing

| Method | Application | Technology |
|--------|-------------|------------|
| **Camera traps** | Presence, occupancy | AI species ID |
| **Acoustic monitoring** | Vocal species | Bioacoustic AI |
| **Satellite tracking** | Movement, range | GPS/Argos tags |
| **Drone surveys** | Population counts, habitat | AI image analysis |

#### Genetic Methods

| Method | Application | Technology |
|--------|-------------|------------|
| **eDNA** | Aquatic species presence | Metabarcoding |
| **Non-invasive sampling** | Population genetics | DNA analysis |
| **Tissue banking** | Conservation genetics | Biobanking |

### Monitoring Protocol Standards

#### Protocol Requirements

| Element | Requirement |
|---------|-------------|
| **Objectives** | Clear, measurable goals |
| **Design** | Statistically robust sampling |
| **Methods** | Standardized, repeatable |
| **Analysis** | Pre-specified approach |
| **Reporting** | Consistent format |

#### Data Collection Standards

| Standard | Implementation |
|----------|----------------|
| **Species ID** | Verified by expert or AI confidence >95% |
| **Location** | GPS coordinates (appropriate precision) |
| **Date/time** | Standardized format |
| **Observer** | Recorded for all observations |
| **Effort** | Systematic effort tracking |

### AI-Assisted Monitoring

#### Species Recognition Models

| Model Type | Application | Performance Standard |
|------------|-------------|---------------------|
| **Image classification** | Camera trap ID | >95% top-1 accuracy |
| **Object detection** | Wildlife in imagery | >90% mAP |
| **Individual ID** | Re-identification | >85% accuracy |
| **Sound classification** | Bioacoustic ID | >90% accuracy |

#### Deployment Standards

| Standard | Requirement |
|----------|-------------|
| **Validation** | Local validation dataset |
| **Human review** | QA on sample of outputs |
| **Continuous improvement** | Retrain with local data |
| **Uncertainty flagging** | Flag low-confidence detections |

## Protection Programs

### Anti-Poaching Technology

#### Detection Systems

| Technology | Application | Integration |
|------------|-------------|-------------|
| **Camera networks** | Intrusion detection | Real-time alerts |
| **Acoustic sensors** | Gunshot, chainsaw detection | Rapid response |
| **Satellite monitoring** | Large-area surveillance | Change detection |
| **Drone patrol** | Active monitoring | AI-guided routes |

#### Response Integration

| Component | Implementation |
|-----------|----------------|
| **Alert system** | Real-time notification to rangers |
| **Response coordination** | GPS-guided dispatch |
| **Incident logging** | Automated record keeping |
| **Analysis** | Pattern recognition for prevention |

### Health Monitoring

#### Wildlife Health Surveillance

| Component | Implementation |
|-----------|----------------|
| **Routine health checks** | Protocol-based assessments |
| **Disease detection** | AI-assisted diagnostics |
| **Outbreak response** | Early warning systems |
| **One Health integration** | Human-wildlife-ecosystem health |

#### Welfare Standards

For captive/managed populations:
| Standard | Requirement |
|----------|-------------|
| **Five Domains** | Nutrition, environment, health, behavior, mental |
| **Assessment frequency** | Regular welfare scoring |
| **Intervention thresholds** | Defined action triggers |

## Data Management

### Species Data Standards

| Data Type | Standard |
|-----------|----------|
| **Taxonomy** | IUCN/ITIS standard names |
| **Location** | WGS84 coordinates |
| **Observation** | Darwin Core standard |
| **Genetic** | GenBank/BOLD submission |

### Data Sharing

| Data Category | Sharing Approach |
|---------------|------------------|
| **Occurrence data** | GBIF contribution |
| **Population data** | Species-specific databases |
| **Genetic data** | GenBank, BOLD |
| **Sensitive data** | Restricted access (poaching risk) |

### Sensitive Species Protection

| Protection Measure | Implementation |
|--------------------|----------------|
| **Location fuzzing** | Reduce coordinate precision |
| **Access control** | Restricted to authorized users |
| **Need-to-know** | Only share when necessary |
| **Legal protection** | Comply with species protections |

## Partnerships

### Partner Types

| Partner | Role |
|---------|------|
| **Government agencies** | Policy, enforcement, permits |
| **Protected area managers** | Site access, coordination |
| **Research institutions** | Science, expertise |
| **Local NGOs** | Community links, implementation |
| **Indigenous communities** | Traditional knowledge, stewardship |

### Partnership Standards

| Standard | Requirement |
|----------|-------------|
| **Data agreements** | Clear ownership and use terms |
| **Co-authorship** | Appropriate credit |
| **Benefit sharing** | Equitable benefits |
| **Capacity building** | Knowledge transfer |

## Success Metrics

### Species-Level Metrics

| Metric | Target |
|--------|--------|
| **Status improvement** | Downlisting on IUCN Red List |
| **Population stability** | Stable or increasing trend |
| **Range maintenance** | No range contraction |
| **Genetic health** | Maintained diversity |

### Program-Level Metrics

| Metric | Target |
|--------|--------|
| **Species monitored** | 100 priority species |
| **Detection accuracy** | >90% for target species |
| **Response time** | <30 min for poaching alerts |
| **Partner satisfaction** | >80% positive rating |

### Technology Metrics

| Metric | Target |
|--------|--------|
| **Deployment uptime** | >95% operational |
| **Data quality** | <5% error rate |
| **Model accuracy** | >90% for deployed models |
| **User adoption** | >80% of trained users active |

## Related ZIPs

- **ZIP-500**: ESG Principles for Conservation Impact
- **ZIP-501**: Conservation Impact Measurement
- **ZIP-520**: Habitat Conservation
- **ZIP-530**: Community Partnerships & FPIC
- **ZIP-540**: Research Ethics & Data Governance

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial draft |

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
