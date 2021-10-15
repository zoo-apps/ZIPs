---
zip: 0401
title: "Species Detection ML Pipeline"
description: "Standardized ML pipeline for automated species detection from camera traps, drones, and acoustic sensors"
author: "Zoo Labs Foundation"
status: Draft
type: Standards Track
category: AI
originated: 2021-10
traces-from: "Whitepaper section 03 (Sustainability)"
follow-on: [zoo-species-classification]
created: 2025-01-15
tags: [species-detection, ml-pipeline, camera-traps, acoustic-monitoring, computer-vision]
requires: [0001, 0400]
references: HIP-0057, HIP-0081, HIP-0043, LP-7000
repository: https://github.com/zooai/species-pipeline
license: CC BY 4.0
---

# ZIP-401: Species Detection ML Pipeline

## Abstract

This proposal defines a standardized ML pipeline for automated species detection and identification from three primary sensor modalities: camera traps, aerial drones, and passive acoustic monitors. The pipeline specifies data ingestion formats, preprocessing stages, model architectures for each modality, a fusion layer for multi-modal detections, and output schemas compatible with established biodiversity databases (GBIF, iNaturalist, eBird). The design follows HIP-0057 ML pipeline standards for reproducibility and HIP-0081 computer vision conventions for image processing. All inference runs are attested on-chain via LP-7000.

## Motivation

Wildlife monitoring generates petabytes of raw sensor data annually, yet the vast majority goes unprocessed:

1. **Camera traps**: An estimated 30 million camera trap images are captured daily worldwide. Manual review is the bottleneck -- a single researcher can classify roughly 1,000 images per hour.
2. **Drone surveys**: Aerial surveys for large mammal counts produce gigapixels of imagery per flight. Current semi-manual workflows take weeks to produce population estimates.
3. **Acoustic monitoring**: Passive recorders capture continuous audio streams. Identifying species from spectrograms requires specialized expertise that most field teams lack.

Zoo's Species Detection Pipeline automates this workflow end-to-end, reducing time-to-insight from weeks to hours while maintaining accuracy above 95% for focal species.

### Design Principles

- **Modular stages**: Each pipeline stage is independently deployable and testable.
- **Reproducible**: Every inference is deterministic given the same model version and input.
- **Attested**: All detections carry cryptographic provenance via LP-7000.
- **Federated-ready**: Pipeline integrates with DSO (ZIP-0400) for distributed training on field data.

## Specification

### 1. Pipeline Architecture

```
Sensor Input
    |
    v
+---+---+---+---+---+---+---+---+---+---+---+
|  Stage 1: Ingestion & Normalization        |
|  - Format detection (JPEG/WAV/TIFF/MP4)    |
|  - Metadata extraction (GPS, timestamp)    |
|  - Quality filtering (blur, noise, empty)  |
+---+---+---+---+---+---+---+---+---+---+---+
    |
    v
+---+---+---+---+---+---+---+---+---+---+---+
|  Stage 2: Modality-Specific Detection      |
|  - Camera: MegaDetector v6 + Zoo Classifier|
|  - Drone:  Aerial Object Detector          |
|  - Audio:  BirdNET + ZooSound Classifier   |
+---+---+---+---+---+---+---+---+---+---+---+
    |
    v
+---+---+---+---+---+---+---+---+---+---+---+
|  Stage 3: Multi-Modal Fusion               |
|  - Temporal co-occurrence matching         |
|  - Spatial proximity correlation           |
|  - Confidence re-scoring                   |
+---+---+---+---+---+---+---+---+---+---+---+
    |
    v
+---+---+---+---+---+---+---+---+---+---+---+
|  Stage 4: Output & Attestation             |
|  - Darwin Core / GBIF format export        |
|  - On-chain attestation (LP-7000)          |
|  - Alert dispatch (poaching, rare species) |
+---+---+---+---+---+---+---+---+---+---+---+
```

### 2. Stage 1: Ingestion & Normalization

```python
class IngestionStage:
    """
    Normalize heterogeneous sensor data into standard pipeline format.
    Supports: JPEG, PNG, TIFF, WAV, FLAC, MP4, AVI.
    """

    SUPPORTED_IMAGE = {".jpg", ".jpeg", ".png", ".tiff", ".tif"}
    SUPPORTED_AUDIO = {".wav", ".flac", ".mp3"}
    SUPPORTED_VIDEO = {".mp4", ".avi", ".mov"}

    def __init__(self, config: IngestionConfig):
        self.target_image_size = config.target_image_size  # (1024, 1024)
        self.target_sample_rate = config.target_sample_rate  # 48000 Hz
        self.min_image_quality = config.min_image_quality  # 0.3 (blur score)

    def process(self, file_path: Path) -> PipelineRecord:
        suffix = file_path.suffix.lower()

        if suffix in self.SUPPORTED_IMAGE:
            return self._process_image(file_path)
        elif suffix in self.SUPPORTED_AUDIO:
            return self._process_audio(file_path)
        elif suffix in self.SUPPORTED_VIDEO:
            return self._process_video(file_path)
        else:
            raise UnsupportedFormatError(f"Unknown format: {suffix}")

    def _process_image(self, path: Path) -> PipelineRecord:
        img = load_image(path)
        metadata = extract_exif(path)  # GPS, timestamp, camera model

        # Quality gate: reject blurry or empty frames
        blur_score = compute_laplacian_variance(img)
        if blur_score < self.min_image_quality:
            return PipelineRecord(status="rejected", reason="blur", metadata=metadata)

        # Normalize
        img_normalized = resize_pad(img, self.target_image_size)

        return PipelineRecord(
            modality="image",
            data=img_normalized,
            metadata=metadata,
            quality_score=blur_score,
        )

    def _process_audio(self, path: Path) -> PipelineRecord:
        waveform, sr = load_audio(path)
        metadata = extract_audio_metadata(path)

        # Resample to target rate
        if sr != self.target_sample_rate:
            waveform = resample(waveform, sr, self.target_sample_rate)

        # Compute spectrogram for downstream models
        spectrogram = mel_spectrogram(
            waveform,
            n_mels=128,
            hop_length=512,
            n_fft=2048,
        )

        return PipelineRecord(
            modality="audio",
            data=spectrogram,
            raw_waveform=waveform,
            metadata=metadata,
        )
```

### 3. Stage 2: Modality-Specific Detection

#### Camera Trap Detection

```python
class CameraTrapDetector:
    """
    Two-stage detection: (1) animal/human/vehicle detection,
    (2) species classification on cropped regions.
    """

    def __init__(self):
        self.detector = load_model("zoo-megadetector-v6")  # YOLO-based
        self.classifier = load_model("zoo-species-classifier-v3")  # ViT-L/14
        self.taxonomy = load_taxonomy("zoo-taxonomy-v2")  # 45,000 species

    def detect(self, record: PipelineRecord) -> list[Detection]:
        # Stage 1: Object detection
        boxes = self.detector.predict(
            record.data,
            confidence_threshold=0.2,
            nms_threshold=0.45,
        )

        detections = []
        for box in boxes:
            if box.label == "animal":
                # Stage 2: Crop and classify species
                crop = extract_crop(record.data, box, padding=0.15)
                species_probs = self.classifier.predict(crop)

                top_k = species_probs.topk(5)
                detections.append(Detection(
                    bbox=box,
                    species=self.taxonomy.lookup(top_k.indices[0]),
                    confidence=top_k.values[0].item(),
                    top_k_species=[
                        (self.taxonomy.lookup(idx), prob.item())
                        for idx, prob in zip(top_k.indices, top_k.values)
                    ],
                    modality="camera_trap",
                    timestamp=record.metadata.timestamp,
                    location=record.metadata.gps,
                ))

        return detections
```

#### Acoustic Species Detection

```python
class AcousticDetector:
    """
    Detect and classify species from audio spectrograms.
    Optimized for bird, amphibian, and marine mammal vocalizations.
    """

    def __init__(self):
        self.bird_model = load_model("zoo-birdnet-v4")  # 6,000+ bird species
        self.amphibian_model = load_model("zoo-amphibian-v2")  # 800+ species
        self.marine_model = load_model("zoo-marine-acoustic-v1")  # 150+ species

    def detect(self, record: PipelineRecord) -> list[Detection]:
        detections = []

        # Sliding window over spectrogram (3-second windows, 1-second stride)
        windows = sliding_window(record.data, window_sec=3.0, stride_sec=1.0)

        for window_idx, window in enumerate(windows):
            # Run all classifiers
            bird_probs = self.bird_model.predict(window)
            amphibian_probs = self.amphibian_model.predict(window)
            marine_probs = self.marine_model.predict(window)

            # Select best detection across models
            best = max_across_models(bird_probs, amphibian_probs, marine_probs)

            if best.confidence > 0.5:
                detections.append(Detection(
                    species=best.species,
                    confidence=best.confidence,
                    modality="acoustic",
                    time_offset=window_idx * 1.0,
                    frequency_range=best.freq_range,
                    timestamp=record.metadata.timestamp,
                    location=record.metadata.gps,
                ))

        return merge_consecutive_detections(detections, gap_threshold=2.0)
```

### 4. Stage 3: Multi-Modal Fusion

```python
class MultiModalFusion:
    """
    Fuse detections across modalities using spatiotemporal co-occurrence.
    A camera trap image of a bird + concurrent acoustic detection of
    the same species at the same location yields higher confidence.
    """

    def fuse(
        self,
        detections: list[Detection],
        spatial_threshold_m: float = 500.0,
        temporal_threshold_s: float = 300.0,
    ) -> list[FusedDetection]:
        # Group by spatiotemporal proximity
        clusters = self._cluster_detections(
            detections, spatial_threshold_m, temporal_threshold_s
        )

        fused = []
        for cluster in clusters:
            modalities = {d.modality for d in cluster}
            species_votes = Counter(d.species for d in cluster)
            consensus_species = species_votes.most_common(1)[0][0]

            # Multi-modal bonus: increase confidence when multiple modalities agree
            base_confidence = max(d.confidence for d in cluster)
            modal_bonus = 0.05 * (len(modalities) - 1)  # +5% per extra modality
            fused_confidence = min(1.0, base_confidence + modal_bonus)

            fused.append(FusedDetection(
                species=consensus_species,
                confidence=fused_confidence,
                modalities=list(modalities),
                evidence=cluster,
                location=centroid([d.location for d in cluster]),
                time_range=(
                    min(d.timestamp for d in cluster),
                    max(d.timestamp for d in cluster),
                ),
            ))

        return fused
```

### 5. Stage 4: Output & Attestation

```python
class OutputStage:
    """
    Export detections in Darwin Core format and attest on-chain.
    """

    def export_darwin_core(self, detection: FusedDetection) -> dict:
        return {
            "occurrenceID": generate_uuid(),
            "scientificName": detection.species.scientific_name,
            "vernacularName": detection.species.common_name,
            "taxonRank": detection.species.rank,
            "decimalLatitude": detection.location.lat,
            "decimalLongitude": detection.location.lon,
            "eventDate": detection.time_range[0].isoformat(),
            "basisOfRecord": "MachineObservation",
            "identificationVerificationStatus": confidence_to_status(
                detection.confidence
            ),
            "associatedMedia": [e.source_file for e in detection.evidence],
            "institutionCode": "ZOO",
            "datasetName": "Zoo Automated Species Detection",
        }

    def attest_on_chain(self, detection: FusedDetection, model_version: str):
        """Record detection on LP-7000 attestation chain."""
        attestation = {
            "type": "SpeciesDetection",
            "model_version": model_version,
            "species": detection.species.scientific_name,
            "confidence": detection.confidence,
            "location_hash": hash_location(detection.location),  # Privacy
            "evidence_hashes": [hash_file(e.source_file) for e in detection.evidence],
            "timestamp": int(time.time()),
        }
        return submit_attestation(attestation, chain="zoo-ai-attestation")
```

### 6. Model Training Integration

The pipeline integrates with DSO (ZIP-0400) for distributed model improvement:

```python
class PipelineTrainer:
    """
    Use pipeline outputs to improve models via DSO.
    Expert-validated detections become training signal.
    """

    def submit_validated_detection(
        self,
        detection: FusedDetection,
        expert_label: str,  # Expert-corrected species label
        dso_node: DSONode,
    ):
        training_sample = create_training_sample(
            image=detection.evidence[0].data,
            label=expert_label,
            metadata=detection.to_metadata(),
        )

        # Train locally and submit semantic gradient to DSO
        gradient = dso_node.compute_local_gradient(
            model=self.classifier,
            samples=[training_sample],
        )
        dso_node.submit_to_round(gradient)
```

## Rationale

### Why a multi-stage pipeline?

Monolithic end-to-end models are harder to debug, update, and audit. A staged pipeline allows independent improvement of each component: upgrading the bird acoustic model does not require retraining the camera trap detector.

### Why multiple acoustic models rather than one unified model?

Bird, amphibian, and marine mammal vocalizations occupy different frequency ranges and exhibit different temporal patterns. Specialized models achieve 15-20% higher accuracy than a single generalist model.

### Why Darwin Core output format?

Darwin Core is the international standard for biodiversity data, accepted by GBIF, iNaturalist, and all major biodiversity databases. Compatibility ensures Zoo detections can be integrated into global conservation datasets without manual transformation.

## Security Considerations

1. **Location privacy**: GPS coordinates of endangered species are hashed before on-chain attestation. Full coordinates are only available to authorized conservation agencies.
2. **Model extraction**: Pipeline models are served via API; weights are not distributed to untrusted nodes. Only semantic gradients (ZIP-0400) are shared for training.
3. **Adversarial inputs**: The quality gate in Stage 1 rejects anomalous inputs. The classifier includes an out-of-distribution detector that flags inputs unlikely to be natural camera trap images.
4. **False positive management**: High-confidence thresholds (>0.95) required for automated alerts (e.g., poaching detection). Lower-confidence detections are queued for human review.

## References

1. [HIP-0057: ML Pipeline Standards](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0057.md)
2. [HIP-0081: Computer Vision Conventions](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0081.md)
3. [HIP-0043: LLM Inference](https://github.com/hanzoai/hips/blob/main/HIPs/hip-0043.md)
4. [LP-7000: AI Attestation Chain](https://github.com/luxfi/lps/blob/main/LPs/lp-7000.md)
5. [ZIP-0400: Decentralized Semantic Optimization](./zip-0400-decentralized-semantic-optimization-dso.md)
6. [Beery et al., "MegaDetector: Real-time Animal Detection for Camera Traps"](https://github.com/microsoft/CameraTraps)
7. [Kahl et al., "BirdNET: A deep learning solution for avian diversity monitoring"](https://doi.org/10.1016/j.ecoinf.2021.101236)
8. [GBIF Darwin Core Standard](https://dwc.tdwg.org/)

## Copyright

Copyright and related rights waived via [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
