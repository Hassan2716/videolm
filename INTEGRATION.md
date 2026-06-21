# 🔌 Image Captioning Model Integration

## What Was Integrated

Your **silent-video-segmentation** captioning pipeline has been fully integrated
into VideoLM. These are the exact files from your project:

| Your File | VideoLM Location | Status |
|-----------|-----------------|--------|
| `pipeline/captioner.py` | `pipeline/visual/captioner.py` | ✅ Integrated |
| `pipeline/visual_detector.py` | `pipeline/visual/visual_detector.py` | ✅ Integrated |
| `pipeline/frame_extractor.py` | `pipeline/video/frame_extractor.py` | ✅ Integrated |
| `pipeline/scene_detector.py` | `pipeline/video/scene_detector.py` | ✅ Integrated |
| `pipeline/deduplicator.py` | `pipeline/video/deduplicator.py` | ✅ Integrated |
| `pipeline/ocr_extractor.py` | `pipeline/visual/ocr_extractor.py` | ✅ Integrated |

## How the Captioner Works

Your BLIP-2 model is used in `captioner.py` which exposes **both APIs**:

### Original API (unchanged from your project)
```python
captioner = Captioner(model_name="Salesforce/blip2-opt-2.7b", device="cpu")
caption = captioner.caption("frame.jpg", visual_type="chart")
```

### VideoLM API (new — wraps your model)
```python
caption = captioner.caption_frame("frame.jpg")
scene_summary = captioner.summarize_scene(["f1.jpg", "f2.jpg", "f3.jpg"])
all_captions = captioner.batch_caption_frames(["f1.jpg", "f2.jpg"])
```

## Model Loading Order

1. Tries **BLIP-2** (`Salesforce/blip2-opt-2.7b`) first
2. Falls back to **BLIP** (`Salesforce/blip-image-captioning-base`) if BLIP-2 fails
3. Uses rule-based captions if both fail

## Pipeline Flow (pipeline_service.py)

```
Video Input
    ↓
AudioExtractor (FFmpeg → WAV)
    ↓
WhisperSTT (speech → timestamped transcript)
    ↓
FrameExtractor (FFmpeg I-frames + 1fps interval)   ← YOUR CODE
    ↓
SceneDetector (histogram diff filtering)            ← YOUR CODE
    ↓
Deduplicator (pHash + SSIM)                        ← YOUR CODE
    ↓
VisualDetector (YOLOv8 + heuristic)                ← YOUR CODE
    ↓
OCRExtractor (Tesseract + OpenCV)                  ← YOUR CODE
    ↓
Captioner.caption() (BLIP-2 → BLIP)               ← YOUR MODEL
    ↓
Summarizer (BART/T5/PEGASUS)
    ↓
IndexService (FAISS vector search)
    ↓
Results saved to database
```

## Config Settings (from your .env.example)

```env
BLIP2_MODEL=Salesforce/blip2-opt-2.7b
BLIP2_MAX_NEW_TOKENS=150
BLIP2_NUM_BEAMS=4
BLIP2_MIN_LENGTH=20
SCENE_THRESHOLD=0.35
SIMILARITY_THRESHOLD=0.92
PERCEPTUAL_HASH_THRESHOLD=10
CONFIDENCE_THRESHOLD=0.65
OCR_LANG=eng
```
