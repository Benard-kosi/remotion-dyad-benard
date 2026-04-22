import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import subprocess
import os
import tempfile
import sys
import json

# Resolve model path relative to script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(SCRIPT_DIR, "face_detector.tflite")

# Initialize MediaPipe Face Detector
base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.FaceDetectorOptions(base_options=base_options)
detector = vision.FaceDetector.create_from_options(options)

# Confidence threshold: Scores above this are considered "Real Human/3D" and blocked
THRESHOLD = 0.75 

def check_image(image_path):
    """Returns (should_delete, confidence)"""
    try:
        img = cv2.imread(image_path)
        if img is None:
            return False, 0
        
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = detector.detect(mp_image)
        
        if not result.detections:
            return False, 0  # No face detected - safe for anime
        
        # Check confidence of the most prominent face
        max_conf = max([d.categories[0].score for d in result.detections])
        return max_conf >= THRESHOLD, max_conf
    except Exception as e:
        return False, 0

def check_video(video_path):
    """
    Returns (should_delete, max_confidence_found)
    Samples frames at 0%, 20%, 40%, 60%, 80%, 95%
    """
    try:
        # Get video duration using ffprobe
        cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', video_path]
        result = subprocess.run(cmd, capture_output=True, text=True)
        duration = float(result.stdout.strip())
        
        sample_positions = [0, 0.2, 0.4, 0.6, 0.8, 0.95]
        max_video_conf = 0
        
        with tempfile.TemporaryDirectory() as temp_dir:
            for pos in sample_positions:
                timestamp = duration * pos
                frame_path = os.path.join(temp_dir, f"frame_{int(pos*100)}.jpg")
                
                # Extract frame using ffmpeg
                ffmpeg_cmd = [
                    'ffmpeg', '-ss', str(timestamp), '-i', video_path, 
                    '-vframes', '1', '-q:v', '2', frame_path, '-y', '-loglevel', 'error'
                ]
                subprocess.run(ffmpeg_cmd, capture_output=True)
                
                if os.path.exists(frame_path):
                    should_del, conf = check_image(frame_path)
                    max_video_conf = max(max_video_conf, conf)
                    if should_del:
                        return True, max_video_conf
        
        return False, max_video_conf
    except Exception as e:
        return False, 0

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"should_delete": False, "confidence": 0, "error": "No file provided"}))
        sys.exit(0)
    
    file_path = sys.argv[1]
    file_type = sys.argv[2] if len(sys.argv) > 2 else "image"
    
    if file_type == "video":
        should_delete, confidence = check_video(file_path)
    else:
        should_delete, confidence = check_image(file_path)
    
    print(json.dumps({"should_delete": should_delete, "confidence": float(confidence)}))