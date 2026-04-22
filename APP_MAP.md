# Remotion Studio: Application Map

This map highlights the key directories and files for the server, AI filtering, and data storage.

## 📂 Root Structure
- **`/src`**: React frontend source code (Pages, Components, Hooks).
- **`/remotion`**: Video engine source code (Animation components, Composition logic).
- **`/public`**: Static assets and data storage.
- **`/MediaPipe`**: AI-powered media filtering logic.
- **`server.js`**: The main Express server file.

## 🤖 AI Filtering (MediaPipe)
- **Location**: `/MediaPipe/`
- **Logic**: `media_filter.py` (Python script for face detection).
- **Model**: `face_detector.tflite` (The AI model used by MediaPipe).

## 💾 Data Storage
Stored within the `/public` directory:
- **`/public/uploads`**: (Temporary) Downloaded media and rendered MP4s. The app auto-downloads assets as needed for each video.
- **`/public/templates`**: (Persistent) JSON files for Secondary Video (SV) templates.
- **`/public/huds`**: (Persistent) JSON files for HUD (Heads-Up Display) designs.

## ⚙️ Configuration
- **`settings.json`**: Stores webhook URLs and public base URL settings.
- **`package.json`**: Project dependencies and scripts.
- **`docker-compose.yml`**: Container orchestration and volume mapping.