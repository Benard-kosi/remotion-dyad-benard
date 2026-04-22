import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os
import glob

# Load MediaPipe model
model_path = "face_detector.tflite"
base_options = python.BaseOptions(model_asset_path=model_path)
options = vision.FaceDetectorOptions(base_options=base_options)
detector = vision.FaceDetector.create_from_options(options)

def analyze_faces(image_path, threshold=0.50):
    """
    Returns detection results with confidence scores
    """
    img = cv2.imread(image_path)
    if img is None:
        return None, 0
    
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_image)
    
    faces = []
    if result.detections:
        for detection in result.detections:
            bbox = detection.bounding_box
            confidence = detection.categories[0].score if detection.categories else 0
            faces.append({
                'x': bbox.origin_x,
                'y': bbox.origin_y,
                'width': bbox.width,
                'height': bbox.height,
                'confidence': confidence
            })
    
    # Determine if it's a "real human" based on threshold
    max_confidence = max([f['confidence'] for f in faces]) if faces else 0
    is_real_human = max_confidence >= threshold
    
    return faces, max_confidence, is_real_human

# Get all images
all_images = glob.glob("*.png") + glob.glob("*.jpg") + glob.glob("*.jpeg")
all_images = [f for f in all_images if not f.startswith("detected_")]

# Separate by type
anime_images = [f for f in all_images if "anime" in f.lower() or "bleach" in f.lower()]
cgi_images = [f for f in all_images if "3d" in f.lower()]
human_images = [f for f in all_images if "human" in f.lower()]

print("=" * 80)
print("MEDIAPIPE FACE DETECTION - CONFIDENCE THRESHOLD TEST")
print("=" * 80)

# Test different thresholds
thresholds = [0.50, 0.60, 0.70, 0.80, 0.85, 0.90]

print("\n📊 Testing different confidence thresholds...")
print("-" * 80)

for threshold in thresholds:
    print(f"\n🔹 THRESHOLD: {threshold:.0%}")
    print("-" * 40)
    
    # Test Anime images
    if anime_images:
        anime_scores = []
        for img in anime_images:
            _, max_conf, is_real = analyze_faces(img, threshold)
            anime_scores.append(max_conf)
            status = "🔴 BLOCK" if is_real else "✅ ALLOW"
            print(f"  {img}: conf={max_conf:.2%} → {status}")
        avg_anime = sum(anime_scores) / len(anime_scores) if anime_scores else 0
        print(f"  Avg Anime confidence: {avg_anime:.2%}")
    
    # Test 3D/CGI images
    if cgi_images:
        cgi_scores = []
        for img in cgi_images:
            _, max_conf, is_real = analyze_faces(img, threshold)
            cgi_scores.append(max_conf)
            status = "🔴 BLOCK" if is_real else "✅ ALLOW"
            print(f"  {img}: conf={max_conf:.2%} → {status}")
        avg_cgi = sum(cgi_scores) / len(cgi_scores) if cgi_scores else 0
        print(f"  Avg 3D confidence: {avg_cgi:.2%}")
    
    # Test Human images
    if human_images:
        human_scores = []
        for img in human_images:
            _, max_conf, is_real = analyze_faces(img, threshold)
            human_scores.append(max_conf)
            status = "🔴 BLOCK" if is_real else "✅ ALLOW"
            print(f"  {img}: conf={max_conf:.2%} → {status}")
        avg_human = sum(human_scores) / len(human_scores) if human_scores else 0
        print(f"  Avg Human confidence: {avg_human:.2%}")

print("\n" + "=" * 80)
print("RECOMMENDATION:")
print("=" * 80)

# Calculate averages one more time for recommendation
all_anime_scores = []
all_human_scores = []

for img in anime_images:
    _, conf, _ = analyze_faces(img, 0)
    all_anime_scores.append(conf)

for img in human_images:
    _, conf, _ = analyze_faces(img, 0)
    all_human_scores.append(conf)

avg_anime_final = sum(all_anime_scores) / len(all_anime_scores) if all_anime_scores else 0
avg_human_final = sum(all_human_scores) / len(all_human_scores) if all_human_scores else 0

print(f"\n📊 Your data:")
print(f"   Average Anime/3D confidence: {avg_anime_final:.2%}")
print(f"   Average Human confidence: {avg_human_final:.2%}")
print(f"   Gap between them: {(avg_human_final - avg_anime_final):.2%}")

# Find optimal threshold
optimal = (avg_anime_final + avg_human_final) / 2
print(f"\n🎯 Recommended threshold: {optimal:.0%}")
print(f"   (This is the midpoint between anime and human scores)")

print("\n" + "=" * 80)
print("USAGE IN YOUR APP:")
print("=" * 80)
print(f"""
def should_block_image(image_path):
    faces, max_confidence, is_real = analyze_faces(image_path, threshold={optimal:.0%})
    
    if is_real:
        return True  # BLOCK - real human detected
    else:
        return False  # ALLOW - anime/3D or no face
""")

# Run final test with recommended threshold
print(f"\n✅ FINAL TEST WITH THRESHOLD = {optimal:.0%}:")
print("-" * 40)

for img in all_images[:5]:  # Test first 5 images
    _, max_conf, is_real = analyze_faces(img, optimal)
    category = "🔴 HUMAN" if is_real else "✅ ANIME/3D"
    print(f"  {img}: {max_conf:.2%} → {category}")