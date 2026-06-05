"""
OCR Microservice - Flask API (EasyOCR Engine)
Nhan dien van ban tu hinh anh hoa don su dung EasyOCR
Port: 5050

Kien truc trong bao cao KLTN:
  React Frontend -> .NET API -> [OCR Service (EasyOCR)] -> Gemini LLM -> JSON -> SQL Server
"""
import os
import sys
import base64
import tempfile
import logging
import io

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

logging.basicConfig(level=logging.INFO, format='[OCR Service] %(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Lazy load EasyOCR (heavy model, only load once)
_ocr_reader = None

def get_ocr_reader():
    global _ocr_reader
    if _ocr_reader is None:
        logger.info("Loading EasyOCR engine (first time, downloading ~100MB model)...")
        import easyocr
        _ocr_reader = easyocr.Reader(
            ['vi', 'en'],   # Vietnamese + English
            gpu=False,       # CPU mode
            verbose=False
        )
        logger.info("[OK] EasyOCR engine loaded successfully! (Vietnamese + English)")
    return _ocr_reader


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok", 
        "service": "EasyOCR Invoice Recognition Microservice",
        "languages": ["vi", "en"],
        "engine": "EasyOCR"
    })


@app.route('/ocr', methods=['POST'])
def ocr_extract():
    """
    Input:  { "base64Image": "data:image/jpeg;base64,..." }
    Output: { "success": true, "fullText": "...", "blocks": [...], "totalBlocks": N }
    """
    try:
        data = request.get_json()
        if not data or 'base64Image' not in data:
            return jsonify({"success": False, "error": "Missing base64Image field"}), 400

        base64_str = data['base64Image']
        
        # Strip data URI prefix
        if ',' in base64_str:
            base64_str = base64_str.split(',', 1)[1]

        # Decode base64 to image bytes
        img_bytes = base64.b64decode(base64_str)
        logger.info(f"Received image: {len(img_bytes):,} bytes ({len(img_bytes)/1024:.1f} KB)")

        # Save to temp file for EasyOCR
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            tmp.write(img_bytes)
            tmp_path = tmp.name

        try:
            # Run EasyOCR
            reader = get_ocr_reader()
            logger.info("Running OCR recognition...")
            results = reader.readtext(tmp_path)

            blocks = []
            full_text_lines = []

            for (bbox, text, confidence) in results:
                blocks.append({
                    "text": text,
                    "confidence": round(float(confidence), 4),
                    "bbox": {
                        "topLeft": [int(bbox[0][0]), int(bbox[0][1])],
                        "topRight": [int(bbox[1][0]), int(bbox[1][1])],
                        "bottomRight": [int(bbox[2][0]), int(bbox[2][1])],
                        "bottomLeft": [int(bbox[3][0]), int(bbox[3][1])]
                    }
                })
                full_text_lines.append(text)

            full_text = '\n'.join(full_text_lines)
            logger.info(f"[OK] OCR completed: {len(blocks)} text blocks found")
            logger.info(f"Full text:\n{'='*50}\n{full_text}\n{'='*50}")

            return jsonify({
                "success": True,
                "fullText": full_text,
                "blocks": blocks,
                "totalBlocks": len(blocks)
            })

        finally:
            try:
                os.unlink(tmp_path)
            except:
                pass

    except Exception as e:
        logger.error(f"[ERROR] OCR Error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("  EasyOCR Invoice Recognition Service")
    print("  Port: 5050 | Languages: Vietnamese + English")
    print("  Architecture: Image -> EasyOCR -> Text -> LLM -> JSON")
    print("=" * 60)
    
    # Pre-load model on startup
    try:
        get_ocr_reader()
    except Exception as e:
        logger.error(f"Failed to pre-load OCR engine: {e}")
        logger.info("Engine will be loaded on first request instead.")
    
    app.run(host='0.0.0.0', port=5050, debug=False)
