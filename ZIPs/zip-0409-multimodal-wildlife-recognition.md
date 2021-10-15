---
zip: 409
title: "Multimodal Wildlife Recognition"
description: "Standard for combined vision and audio AI models for automated wildlife species identification and monitoring"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
originated: 2021-10
traces-from: "Whitepaper section 02 (Zoo Animal Utility)"
follow-on: [zoo-species-classification]
created: 2025-01-15
tags: [ai, multimodal, wildlife, recognition, vision, audio]
requires: [0, 1, 400, 401, 406]
---

# ZIP-409: Multimodal Wildlife Recognition

## Abstract

This proposal defines a standard interface and evaluation framework for multimodal (vision + audio) AI models that perform automated wildlife species recognition. The standard specifies input formats (camera trap images, drone footage, acoustic recordings), output schemas (species identification with confidence scores, behavioral annotations, population estimates), model evaluation benchmarks, and integration with the Zoo conservation data pipeline. Compliant models fuse visual and acoustic signals to achieve higher identification accuracy than either modality alone, particularly in challenging conditions (nighttime, dense vegetation, underwater).

## Motivation

Wildlife monitoring relies on species identification. Camera traps generate millions of images. Acoustic sensors record continuous audio streams. Manual review of this data is the primary bottleneck in conservation fieldwork. AI-assisted identification exists but is fragmented:

1. **Single-modality limitations**: Vision models fail at night, in fog, or when animals are partially occluded. Audio models fail in noisy environments or for visually distinctive but quiet species. Multimodal fusion overcomes both limitations.
2. **No standard interface**: Each conservation project builds bespoke recognition pipelines. A model trained for African savanna species cannot be easily adapted for Southeast Asian rainforest without rebuilding the entire pipeline.
3. **Evaluation inconsistency**: Without standard benchmarks, it is impossible to compare models objectively. A model claiming 95% accuracy on one dataset may achieve 60% on another.
4. **Integration gap**: Recognition outputs must flow into conservation databases, alert systems (ZIP-405 SentinelAgent), and impact reporting (ZIP-501). A standard output schema enables this integration.

## Specification

### 1. Input Standards

```typescript
interface VisualInput {
  type: "image" | "video";
  format: "jpeg" | "png" | "mp4" | "h265";
  source: "camera_trap" | "drone" | "satellite" | "handheld";
  resolution: [number, number];
  timestamp: string;              // ISO 8601
  location: GeoPoint;
  metadata: {
    cameraModel?: string;
    exposureMs?: number;
    nightVision: boolean;
    infrared: boolean;
  };
}

interface AudioInput {
  type: "audio";
  format: "wav" | "flac" | "opus";
  source: "acoustic_sensor" | "microphone_array" | "hydrophone";
  sampleRate: number;             // Hz (minimum 44100)
  channels: number;
  durationMs: number;
  timestamp: string;              // ISO 8601
  location: GeoPoint;
  metadata: {
    sensorModel?: string;
    noiseFloorDb?: number;
    underwater: boolean;
  };
}

type RecognitionInput = {
  visual?: VisualInput;
  audio?: AudioInput;
  fusionMode: "early" | "late" | "hybrid";
};
```

### 2. Output Schema

```typescript
interface RecognitionResult {
  requestId: string;
  timestamp: string;
  location: GeoPoint;
  detections: Detection[];
  environmentContext: EnvironmentContext;
  modelInfo: {
    modelId: string;               // ZIP-406 attested model
    version: string;
    modalities: ("visual" | "audio")[];
  };
}

interface Detection {
  detectionId: string;
  species: {
    scientificName: string;        // Binomial nomenclature
    commonName: string;
    taxonomyId: string;            // GBIF taxonomy ID
    iucnStatus: string;            // IUCN Red List category
  };
  confidence: number;              // 0.0 - 1.0
  modalityConfidences: {
    visual?: number;
    audio?: number;
    fused: number;
  };
  boundingBox?: BoundingBox;       // For visual detections
  audioSegment?: {
    startMs: number;
    endMs: number;
    frequencyRange: [number, number];
  };
  behavior?: string;               // Feeding, mating, distress, etc.
  count?: number;                  // Estimated individual count
  age?: "juvenile" | "subadult" | "adult";
  sex?: "male" | "female" | "unknown";
}

interface EnvironmentContext {
  habitat: string;
  timeOfDay: "dawn" | "day" | "dusk" | "night";
  weather?: string;
  temperature?: number;
  humidity?: number;
}
```

### 3. Evaluation Benchmarks

Compliant models must be evaluated on standardized benchmarks:

| Benchmark | Modality | Species Count | Environments | Minimum mAP |
|-----------|----------|---------------|--------------|-------------|
| ZooBench-V1 | Visual | 500 | Terrestrial (5 biomes) | 0.70 |
| ZooBench-A1 | Audio | 300 | Terrestrial + marine | 0.65 |
| ZooBench-M1 | Multimodal | 500 | All environments | 0.80 |
| ZooBench-Night | Visual (IR) | 200 | Nocturnal | 0.60 |
| ZooBench-Marine | Audio | 150 | Underwater | 0.60 |

Models must report per-class accuracy alongside aggregate mAP. Species with IUCN status "Endangered" or higher must achieve a minimum recall of 0.80 to prevent false negatives for the most critical species.

### 4. Fusion Architecture Requirements

Compliant models must implement one of three fusion strategies:

- **Early fusion**: Raw visual and audio features concatenated before the main network. Best for synchronized inputs.
- **Late fusion**: Separate visual and audio encoders; outputs combined at decision level. Best for asynchronous inputs.
- **Hybrid fusion**: Cross-attention between modalities at intermediate layers. Best for complex multi-species scenes.

The model must expose modality-specific confidence scores alongside the fused score, enabling downstream systems to assess which modality drove the detection.

### 5. Conservation Data Pipeline Integration

Recognition results feed into the Zoo conservation pipeline:

```
Camera/Audio Sensor -> Recognition Model -> Detection Events
    |
    v
ZIP-405 SentinelAgent (real-time alerts for critical species)
ZIP-501 Impact Measurement (population monitoring data)
ZIP-601 Biodiversity Database (species occurrence records)
```

## Rationale

- **Multimodal over single-modality**: Peer-reviewed studies show 15-30% accuracy improvement when fusing vision and audio for wildlife identification. The improvement is largest in challenging conditions where Zoo models are most needed.
- **GBIF taxonomy alignment**: Using Global Biodiversity Information Facility taxonomy IDs ensures interoperability with the world's largest biodiversity data network.
- **Minimum recall for endangered species**: False negatives for endangered species are more costly than for common species. A higher recall threshold ensures conservation-critical species are not missed.
- **Modality-specific confidence**: Downstream systems need to know why a detection was made. If a detection relies entirely on audio in a noisy environment, the confidence interpretation differs from a clean visual detection.

## Security Considerations

1. **Adversarial inputs**: An attacker could craft images or audio that cause misidentification. Mitigation: models must include adversarial robustness evaluation in their ZIP-406 attestation; benchmark suite includes adversarial test cases.
2. **Location privacy**: Detection results include GPS coordinates that could reveal the locations of endangered species to poachers. Mitigation: coordinates for species with IUCN status >= "Vulnerable" are obfuscated to 10km grid cells in public outputs per ZIP-510. Full precision is available only to authorized conservation agents.
3. **Dual-use risk**: A high-accuracy species recognition model could be used by poachers to locate valuable wildlife. Mitigation: mandatory ZIP-408 ethics review; access controls for real-time detection APIs; usage logging and anomaly detection.
4. **Model bias**: Models trained predominantly on data from certain regions may underperform in others. Mitigation: ZooBench benchmarks require per-biome accuracy reporting; models with accuracy disparity > 20% across biomes receive conditional ethics approval only.

## References

1. [ZIP-0: Zoo Ecosystem Architecture](./zip-0000-zoo-ecosystem-architecture-framework.md)
2. [ZIP-1: Hamiltonian LLMs for Zoo](./zip-0001-hamiltonian-large-language-models-for-zoo.md)
3. [ZIP-401: Species Detection ML Pipeline](./zip-0401-species-detection-ml-pipeline.md)
4. [ZIP-406: Model Attestation Protocol](./zip-0406-model-attestation-protocol.md)
5. [ZIP-510: Species Protection Monitoring](./zip-0510-species-protection-monitoring.md)
6. Beery, S. et al. "The iWildCam Challenge." CVPR Workshop 2021.
7. Kahl, S. et al. "BirdNET: A deep learning solution for avian diversity monitoring." Ecological Informatics 61, 2021.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
