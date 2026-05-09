from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)

MODEL_PATH = r"C:\Users\yolme\Desktop\runs\detect\dog_v2-2\weights\best.pt"

try:
    model = YOLO(MODEL_PATH)
    print("✅ YOLOv11 Modeli Başarıyla Yüklendi!")
except Exception as e:
    print(f"❌ Model Yükleme Hatası: {e}")

@app.route('/detect', methods=['POST'])
def detect():
    try:
        data = request.json['image']
        if "data:image" in data:
            data = data.split(',')[1]

        img_data = base64.b64decode(data)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        frame = cv2.flip(frame, 1)
        frame = cv2.resize(frame, (640, 640))
        results = model(frame, conf=0.05)

        detections = []
        for r in results:
            for box in r.boxes:
                detections.append({
                    "label": model.names[int(box.cls[0])],
                    "confidence": float(box.conf[0])
                })

        detections.sort(key=lambda x: x['confidence'], reverse=True)
        return jsonify({"success": True, "data": detections})

    except Exception as e:
        print(f"Hata: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"status": "Model canlı ve hazır!", "model": "YOLOv11m", "accuracy": "91.7%"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)