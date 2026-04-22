# Remotion Studio

AI-powered video creation platform with anime-only face filtering.

## Quick Setup (After Cloning)

### 1. Install Node Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Install Python Dependencies
```bash
pip install mediapipe opencv-python-headless yt-dlp
```

### 3. Install FFmpeg
- **Windows**: `choco install ffmpeg` or download from [ffmpeg.org](https://ffmpeg.org)
- **Linux**: `sudo apt install ffmpeg`
- **Mac**: `brew install ffmpeg`

### 4. Run the App
```bash
npm run build  # Build frontend (first time only)
npm run start  # Start server on http://localhost:3000
```

For development: `npm run dev`

## Features

- **Face Filtering**: MediaPipe-based detection (blocks real humans & 3D renders at 75% confidence)
- **Video Creation**: Remotion-powered rendering
- **Auto Downloads**: Self-healing download system (retries until anime content found)
- **Templates & HUDs**: JSON-based customization

## Project Structure

```
/
├── server.js              # Express server
├── MediaPipe/             # Face detection
│   ├── media_filter.py    # Python detection script
│   └── face_detector.tflite
├── public/
│   ├── templates/         # SV templates (persistent)
│   ├── huds/              # HUD designs (persistent)
│   └── uploads/           # Temp media (auto-created)
├── src/                   # React frontend
└── remotion/              # Video engine
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/upload` | POST | Upload media (returns URL) |
| `/render-script` | POST | Start video rendering |
| `/api/generate-sv-script` | POST | Generate script from topics |
| `/api/active-downloads` | GET | Monitor download progress |
| `/api/skip-download/:id` | POST | Cancel a download |

## Recovery from Backup

If you lose your computer:

1. Clone: `git clone your-repo`
2. Install Node deps: `npm install --legacy-peer-deps`
3. Install Python deps: `pip install mediapipe opencv-python-headless yt-dlp`
4. Install FFmpeg (one-time)
5. Run: `npm run build && npm run start`

**Total recovery time: ~15 minutes**

## Notes

- `public/uploads/` is temporary - videos are deleted after rendering
- Templates and HUDs are persistent (back them up)
- Face filter threshold: 75% (blocks humans & 3D, allows anime)