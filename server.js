import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import bodyParser from 'body-parser';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Detect Python command (Windows usually uses 'python', Linux/Mac 'python3')
const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

// Persistent paths
const SETTINGS_PATH = path.join(__dirname, 'settings.json');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');
const TEMPLATES_DIR = path.join(__dirname, 'public/templates');
const HUDS_DIR = path.join(__dirname, 'public/huds');
const BIN_DIR = path.join(__dirname, 'bin');

// Ensure directories exist
[UPLOADS_DIR, TEMPLATES_DIR, HUDS_DIR, BIN_DIR, path.join(__dirname, 'public')].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Default settings
let settings = {
  webhookUrl: "https://n8n.ukapexxn8n.dpdns.org/webhook-test/4a4e8d62-5364-4791-8b43-15328962da0a",
  publicBaseUrl: "" 
};

if (fs.existsSync(SETTINGS_PATH)) {
  try {
    const savedSettings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    settings = { ...settings, ...savedSettings };
  } catch (e) {
    console.error("Failed to load settings.json");
  }
}

let httpLogs = [];
let activeRenders = [];
let activeDownloads = new Map(); 

const addLog = (method, url, status, body = null, isInternal = false) => {
  httpLogs.unshift({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    method,
    url,
    status,
    isInternal,
    body: body ? (typeof body === 'string' ? body : JSON.stringify(body)).substring(0, 500) : null
  });
  if (httpLogs.length > 50) httpLogs.pop();
};

/**
 * Calls the Python validation script to check for human/3D faces.
 */
async function validateMedia(filePath, type = 'image') {
  return new Promise((resolve) => {
    try {
      const scriptPath = path.join(__dirname, 'MediaPipe/media_filter.py');
      const proc = spawn(PYTHON_CMD, [scriptPath, filePath, type]);
      let output = '';
      let errorOutput = '';
      
      proc.stdout.on('data', (data) => output += data.toString());
      proc.stderr.on('data', (data) => errorOutput += data.toString());
      
      proc.on('error', (err) => {
        console.error(`Failed to start validation script (${PYTHON_CMD}):`, err);
        resolve({ should_delete: false, confidence: 0, error: err.message });
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          console.error('Validation script exited with code', code, errorOutput);
          return resolve({ should_delete: false, confidence: 0, error: 'Script failed' });
        }
        try {
          resolve(JSON.parse(output.trim()));
        } catch (e) {
          console.error('Failed to parse validation output:', output);
          resolve({ should_delete: false, confidence: 0, error: 'Parse failed' });
        }
      });
    } catch (err) {
      console.error('Validation error:', err);
      resolve({ should_delete: false, confidence: 0, error: err.message });
    }
  });
}

/**
 * Downloads a file, optionally only a specific duration if it's a video.
 */
async function downloadExternalFile(url, duration = null, retries = 2) {
  if (!url || !url.startsWith('http')) return { path: url, skipped: false };
  
  const cacheKey = duration ? `${url}_dur_${duration}` : url;
  const hash = crypto.createHash('md5').update(cacheKey).digest('hex');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  
  const ext = isYouTube ? '.mp4' : (path.extname(new URL(url).pathname) || '.mp4');
  const filename = `${hash}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  const publicPath = `/uploads/${filename}`;

  if (fs.existsSync(filePath)) return { path: publicPath, skipped: false };

  addLog('DOWNLOAD', url, 102, duration ? `Starting partial download (${duration}s)...` : 'Starting full download...', true);

  const downloadId = hash;
  const controller = new AbortController();
  
  activeDownloads.set(downloadId, {
    id: downloadId,
    url,
    progress: 0,
    size: 'Unknown',
    status: 'starting',
    isYouTube,
    controller
  });

  if (isYouTube) {
    const ytDlpPath = process.platform === 'win32' 
      ? path.join(BIN_DIR, 'yt-dlp.exe') 
      : 'yt-dlp';
    
    return new Promise((resolve) => {
      const args = [
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '--no-warnings',
        '--newline',
        '--progress',
        '-o', filePath,
        url
      ];

      if (duration) {
        args.push('--download-sections', `*0-${duration + 5}`); 
      }
      
      const proc = spawn(ytDlpPath, args);
      const item = activeDownloads.get(downloadId);
      item.proc = proc;
      item.status = 'downloading';

      proc.stdout.on('data', (data) => {
        const line = data.toString();
        // Improved regex for yt-dlp progress and size
        const progressMatch = line.match(/(\d+\.\d+)%/);
        const sizeMatch = line.match(/of\s+~?([\d.]+[kMG]i?B)/i);
        
        if (activeDownloads.has(downloadId)) {
          const currentItem = activeDownloads.get(downloadId);
          if (progressMatch) currentItem.progress = parseFloat(progressMatch[1]);
          if (sizeMatch) currentItem.size = sizeMatch[1];
        }
      });
      
      proc.on('close', (code) => {
        const wasSkipped = activeDownloads.get(downloadId)?.skipped || false;
        activeDownloads.delete(downloadId);
        
        if (code === 0 && fs.existsSync(filePath)) {
          addLog('DOWNLOAD', url, 200, 'YouTube download complete', true);
          resolve({ path: publicPath, skipped: false });
        } else {
          addLog('DOWNLOAD', url, 500, wasSkipped ? 'Download skipped by user' : `YouTube download failed (code ${code})`, true);
          resolve({ path: null, skipped: wasSkipped });
        }
      });

      proc.on('error', (err) => {
        activeDownloads.delete(downloadId);
        addLog('DOWNLOAD', url, 500, `Process error: ${err.message}`, true);
        resolve({ path: null, skipped: false });
      });
    });
  }

  if (duration) {
    return new Promise((resolve) => {
      const ffmpegArgs = [
        '-t', (duration + 5).toString(),
        '-i', url,
        '-c', 'copy',
        '-y',
        filePath
      ];

      const proc = spawn('ffmpeg', ffmpegArgs);
      const item = activeDownloads.get(downloadId);
      item.proc = proc;
      item.status = 'streaming';

      proc.on('close', (code) => {
        const wasSkipped = activeDownloads.get(downloadId)?.skipped || false;
        activeDownloads.delete(downloadId);
        
        if (code === 0 && fs.existsSync(filePath)) {
          addLog('DOWNLOAD', url, 200, 'Partial stream complete', true);
          resolve({ path: publicPath, skipped: false });
        } else {
          addLog('DOWNLOAD', url, 500, wasSkipped ? 'Stream skipped by user' : `FFmpeg stream failed (code ${code})`, true);
          resolve({ path: null, skipped: wasSkipped });
        }
      });

      proc.on('error', (err) => {
        activeDownloads.delete(downloadId);
        addLog('DOWNLOAD', url, 500, `FFmpeg error: ${err.message}`, true);
        resolve({ path: null, skipped: false });
      });
    });
  }

  // Direct download with real-time progress tracking
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal
      });
      
      if (!response.ok) throw new Error(`Status ${response.status}`);
      
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength) : 0;
      
      if (totalSize > 0 && activeDownloads.has(downloadId)) {
        activeDownloads.get(downloadId).size = (totalSize / (1024 * 1024)).toFixed(2) + 'MB';
      }

      const fileStream = fs.createWriteStream(filePath);
      const reader = response.body.getReader();
      let downloadedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        downloadedBytes += value.length;
        fileStream.write(Buffer.from(value));

        if (totalSize > 0 && activeDownloads.has(downloadId)) {
          const item = activeDownloads.get(downloadId);
          item.progress = (downloadedBytes / totalSize) * 100;
          item.status = 'downloading';
        }
      }

      fileStream.end();
      activeDownloads.delete(downloadId);
      addLog('DOWNLOAD', url, 200, 'Direct download complete', true);
      return { path: publicPath, skipped: false };
    } catch (err) {
      const wasSkipped = err.name === 'AbortError';
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Clean up partial file
      
      if (wasSkipped || i === retries - 1) {
        activeDownloads.delete(downloadId);
        addLog('DOWNLOAD', url, 500, wasSkipped ? 'Download skipped by user' : `Failed: ${err.message}`, true);
        return { path: null, skipped: wasSkipped };
      }
    }
  }
  return { path: null, skipped: false };
}

async function n8nStyleImageSearch(query) {
  addLog('SEARCH', query, 102, 'Searching DuckDuckGo Images...', true);
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
  try {
    const tokenResponse = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': userAgent }
    });
    const html = await tokenResponse.text();
    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) throw new Error('Could find VQD token');
    const vqd = vqdMatch[1];
    const searchUrl = `https://duckduckgo.com/i.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': userAgent, 'Referer': 'https://duckduckgo.com/' }
    });
    const data = await searchResponse.json();
    addLog('SEARCH', query, 200, `Found ${data.results?.length || 0} images`, true);
    return data.results || [];
  } catch (err) {
    addLog('SEARCH', query, 500, `Search error: ${err.message}`, true);
    return [];
  }
}

async function n8nStyleVideoSearch(query) {
  addLog('SEARCH', query, 102, 'Searching DuckDuckGo Videos...', true);
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
  try {
    const tokenResponse = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': userAgent }
    });
    const html = await tokenResponse.text();
    const vqdMatch = html.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) throw new Error('Could find VQD token');
    const vqd = vqdMatch[1];
    const searchUrl = `https://duckduckgo.com/v.js?l=wt-wt&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,`;
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': userAgent, 'Referer': 'https://duckduckgo.com/' }
    });
    const data = await searchResponse.json();
    addLog('SEARCH', query, 200, `Found ${data.results?.length || 0} videos`, true);
    return data.results || [];
  } catch (err) {
    addLog('SEARCH', query, 500, `Search error: ${err.message}`, true);
    return [];
  }
}

function getTemplateSlots(template) {
  const str = JSON.stringify(template);
  const matches = str.match(/\{\{(\d+)\}\}/g) || [];
  const nums = matches.map(m => parseInt(m.replace('{{', '').replace('}}', '')));
  return nums.length > 0 ? Math.max(...nums) : 0;
}

// --- SCRIPT PARSER FOR RENDERER ---
function parseScriptToConfig(script, availableTemplates, availableHuds = []) {
  const lines = script.split('\n').map(l => l.trim()).filter(l => l !== "");
  const width = 1920;
  const height = 1080;
  
  const fvVideo = { sequence: [], overlays: [], cameraMovements: [], subtitles: [], showSubtitles: true, huds: [], width, height };
  const internalSVs = {};
  const cuts = [];
  let currentTarget = fvVideo;

  const baseTemplates = JSON.parse(fs.readFileSync(path.join(__dirname, 'remotion/src/templates.json'), 'utf8'));

  const getDuration = (config) => {
    return config.sequence.reduce((acc, name) => {
      const t = baseTemplates.find(temp => temp.name === name);
      return acc + (t?.durationInFrames || 0);
    }, 0) || 0;
  };

  // Helper to split long text into subtitle chunks
  const addSubtitleChunks = (target, text, start, end, hudTemplate = null) => {
    if (!text) return;
    
    const settings = hudTemplate?.subtitleSettings || {
      maxWordsPerChunk: 8,
      wordsPerSecond: 3
    };

    const words = text.split(' ');
    if (words.length <= settings.maxWordsPerChunk) {
      target.subtitles.push({ text, startFrame: start, endFrame: end });
      return;
    }

    const totalFrames = end - start;
    const chunks = [];
    for (let i = 0; i < words.length; i += settings.maxWordsPerChunk) {
      chunks.push(words.slice(i, i + settings.maxWordsPerChunk).join(' '));
    }

    const framesPerChunk = Math.floor(totalFrames / chunks.length);
    chunks.forEach((chunk, i) => {
      target.subtitles.push({
        text: chunk,
        startFrame: start + (i * framesPerChunk),
        endFrame: i === chunks.length - 1 ? end : start + ((i + 1) * framesPerChunk)
      });
    });
  };

  lines.forEach(line => {
    if (line.startsWith('SUBTITLES:')) {
      const val = line.replace('SUBTITLES:', '').trim().toUpperCase();
      fvVideo.showSubtitles = val === 'ON';
      return;
    }

    if (line.startsWith('SUBTITLE:')) {
      const parts = line.match(/SUBTITLE: "([^"]*)" (\d+)-(\d+)/);
      if (parts) {
        addSubtitleChunks(fvVideo, parts[1], parseInt(parts[2]), parseInt(parts[3]));
      }
      return;
    }

    if (line.startsWith('HUD:')) {
      const parts = line.match(/HUD: (\w+) (#\w+)/);
      if (parts) {
        const hudName = parts[1];
        const tag = parts[2];
        const hudTemplate = availableHuds.find(h => h.name === hudName);
        if (hudTemplate) {
          fvVideo.huds.push({ template: hudTemplate, tag });
        }
      }
      return;
    }

    if (line.startsWith('SV_START:')) {
      const name = line.replace('SV_START:', '').trim();
      internalSVs[name] = { name, sequence: [], overlays: [], cameraMovements: [], subtitles: [], width, height };
      currentTarget = internalSVs[name];
      return;
    }
    if (line.startsWith('SV_END')) {
      currentTarget = fvVideo;
      return;
    }
    if (line.startsWith('FV: ') && !line.includes('Overlay') && !line.includes('Camera') && !line.includes('Batch')) {
      const content = line.replace('FV: ', '').trim();
      const match = content.match(/^(\w+)(?:\s*\*(\d+))?$/);
      if (match) {
        const name = match[1];
        const count = parseInt(match[2] || "1");
        if (baseTemplates.find(t => t.name === name)) {
          for (let i = 0; i < count; i++) currentTarget.sequence.push(name);
        }
      }
    }
    if (line.startsWith('FV: Batch')) {
      const parts = line.match(/FV: Batch (\w+) (\d+) (\d+) (\d+)-(\d+)(?:\s+(constrained))?\s+"([^"]*)"\s*(.*)/);
      if (parts) {
        const objectName = parts[1];
        const count = parseInt(parts[2]);
        const columns = parseInt(parts[3]);
        const startFrame = parseInt(parts[4]);
        const endFrame = parseInt(parts[5]);
        const isConstrained = parts[6] === 'constrained';
        const labels = parts[7].split(',').map(s => s.trim());
        const images = parts[8].split(',').map(s => s.trim());

        for (let i = 0; i < count; i++) {
          currentTarget.overlays.push({
            name: objectName,
            grid: { index: i, total: count, columns: columns },
            startFrame,
            endFrame,
            constrained: isConstrained,
            props: {
              label: labels[i] || "",
              imageSrc: images[i] || "/placeholder.png",
              sizeMode: 'keep'
            }
          });
        }
      }
    }
    if (line.startsWith('FV: Overlay')) {
      const parts = line.match(/FV: Overlay (?:\[(\w+)\] )?(\w+) ([\w-]+) (\d+)-(\d+)(?:\s+(main|small|keep))?(?:\s+(constrained))?(?:\s+\[(\w+)\])?\s+"([^"]*)"\s*(.*)/);
      if (parts) {
        const objectType = parts[2];
        let content = parts[10].trim();
        const startFrame = parseInt(parts[4]);
        const endFrame = parseInt(parts[5]);
        const label = parts[9];

        let tag = null;
        const tagMatch = content.match(/\s+(#\w+)$/);
        if (tagMatch) {
          tag = tagMatch[1];
          content = content.replace(tagMatch[0], '').trim();
        }

        const isTextComp = objectType.includes('Text') || objectType.includes('Transition');

        currentTarget.overlays.push({
          name: objectType,
          position: parts[3],
          startFrame,
          endFrame,
          constrained: parts[7] === 'constrained',
          props: { 
            label, 
            tag,
            text: isTextComp ? content : undefined,
            textContent: isTextComp ? content : undefined,
            imageSrc: (!isTextComp && objectType !== 'VideoObject' && objectType !== 'SequenceObject') ? content : undefined,
            videoSrc: objectType === 'VideoObject' ? content : undefined,
            sequence: objectType === 'SequenceObject' ? content.split(',').map(s => s.trim()) : undefined,
            sizeMode: parts[6] || 'keep'
          }
        });

        if (isTextComp) {
          const activeHud = fvVideo.huds.find(h => h.tag === tag);
          addSubtitleChunks(currentTarget, content, startFrame, endFrame, activeHud?.template);
        }
      }
    }
    if (line.startsWith('FV: Camera focus')) {
      const parts = line.match(/FV: Camera focus (?:#(\d+)|\[(\w+)\]) (\d+)-(\d+) ([\d.]+)/);
      if (parts) {
        const targetIdx = parts[1] ? parseInt(parts[1]) - 1 : -1;
        const startFrame = parseInt(parts[3]);
        const endFrame = parseInt(parts[4]);
        const zoom = parseFloat(parts[5]);
        
        currentTarget.cameraMovements.push({
          startFrame,
          endFrame,
          startZoom: 1, 
          endZoom: zoom,
          startX: 0, startY: 0,
          endX: 0, endY: 0,
          targetIdx 
        });
      }
    }
    if (line.startsWith('CUT: ')) {
      const parts = line.match(/CUT: (.*) at (\d+)/);
      if (parts) {
        const svName = parts[1].trim();
        const frame = parseInt(parts[2]);
        const sv = internalSVs[svName] || availableTemplates.find(t => t.name === svName || String(t.number) === svName);
        if (sv) cuts.push({ fvStartTime: frame, svVideo: sv });
      }
    }
    if (line.startsWith('CALL: ')) {
      const tagMatch = line.match(/\s+(#\w+)$/);
      const tag = tagMatch ? tagMatch[1] : null;
      const cleanLine = tag ? line.replace(tagMatch[0], '') : line;

      const parts = cleanLine.match(/CALL: (.*?) (?:at (\d+) )?(.*)/);
      if (parts) {
        const templateRef = parts[1].trim();
        const explicitFrame = parts[2] ? parseInt(parts[2]) : null;
        const paramsStr = parts[3].trim();
        const params = paramsStr.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(p => p.replace(/"/g, '')) || [];
        
        let durationFrames = 0;
        const lastParam = params[params.length - 1];
        if (lastParam && (lastParam.endsWith('s') || !isNaN(Number(lastParam)))) {
          const durVal = lastParam.endsWith('s') ? parseFloat(lastParam.slice(0, -1)) * 30 : Number(lastParam);
          durationFrames = Math.floor(durVal);
          params.pop();
        }

        const template = availableTemplates.find(t => String(t.number) === templateRef || t.name === templateRef);
        if (template) {
          let instantiated = JSON.parse(JSON.stringify(template));
          let tStr = JSON.stringify(instantiated);
          params.forEach((val, i) => { tStr = tStr.split(`{{${i + 1}}}`).join(val); });
          instantiated = JSON.parse(tStr);

          const originalTotal = getDuration(instantiated);

          if (durationFrames > 0) {
            const extra = durationFrames - originalTotal;
            const hinge = instantiated.stretchFrame || Math.floor(originalTotal / 2);

            instantiated.overlays = instantiated.overlays.map(obj => {
              if (obj.endFrame <= hinge) return obj;
              if (obj.startFrame >= hinge) return { ...obj, startFrame: obj.startFrame + extra, endFrame: obj.endFrame + extra };
              
              const newObj = JSON.parse(JSON.stringify(obj));
              newObj.endFrame = obj.endFrame + extra;
              
              if (newObj.name === 'SequenceObject' && newObj.props?.sequence) {
                const seq = [...newObj.props.sequence];
                const lastIdx = seq.length - 1;
                if (lastIdx >= 0) {
                  const parts = seq[lastIdx].split('|');
                  while (parts.length < 3) parts.push(parts.length === 1 ? "" : "0");
                  parts[2] = (parseInt(parts[2] || "0") + extra).toString();
                  seq[lastIdx] = parts.join('|');
                  newObj.props.sequence = seq;
                }
              } else if (newObj.props) {
                newObj.props.extraHoldFrames = (newObj.props.extraHoldFrames || 0) + extra;
              }
              return newObj;
            });

            instantiated.cameraMovements = instantiated.cameraMovements.map(m => {
              if (m.endFrame <= hinge) return m;
              if (m.startFrame >= hinge) return { ...m, startFrame: m.startFrame + extra, endFrame: m.endFrame + extra };
              return { ...m, endFrame: m.endFrame + extra };
            });

            if (durationFrames > originalTotal) {
              const last = instantiated.sequence[instantiated.sequence.length - 1];
              let cur = originalTotal;
              while (cur < durationFrames) {
                const tInfo = baseTemplates.find(t => t.name === last);
                instantiated.sequence.push(last);
                cur += (tInfo?.durationInFrames || 30);
              }
            }
          }

          instantiated.subtitles = [];
          const unmappedParams = params.filter(p => !JSON.stringify(template).includes(p));
          if (unmappedParams.length > 0) {
            const text = unmappedParams[unmappedParams.length - 1];
            const activeHud = fvVideo.huds.find(h => h.tag === tag);
            addSubtitleChunks(instantiated, text, 0, durationFrames || originalTotal, activeHud?.template);
          }

          if (tag) {
            if (!internalSVs[tag]) {
              internalSVs[tag] = { name: tag, sequence: [], overlays: [], cameraMovements: [], subtitles: [], width, height };
            }
            const group = internalSVs[tag];
            const offset = getDuration(group);
            
            group.sequence.push(...instantiated.sequence);
            group.overlays.push(...instantiated.overlays.map(o => ({
              ...o,
              startFrame: o.startFrame + offset,
              endFrame: o.endFrame + offset
            })));
            group.cameraMovements.push(...instantiated.cameraMovements.map(m => ({
              ...m,
              startFrame: m.startFrame + offset,
              endFrame: m.endFrame + offset
            })));
            if (instantiated.subtitles) {
              group.subtitles.push(...instantiated.subtitles.map(s => ({
                ...s,
                startFrame: s.startFrame + offset,
                endFrame: s.endFrame + offset
              })));
            }
          } else {
            const startFrame = explicitFrame !== null ? explicitFrame : 0;
            cuts.push({ fvStartTime: startFrame, svVideo: instantiated });
          }
        }
      }
    }
  });

  [fvVideo, ...Object.values(internalSVs)].forEach((target) => {
    let lastZoom = 1;
    let lastX = 0;
    let lastY = 0;

    target.cameraMovements.forEach((m) => {
      m.startZoom = lastZoom;
      m.startX = lastX;
      m.startY = lastY;

      if (m.targetIdx !== undefined && m.targetIdx >= 0) {
        const overlay = target.overlays[m.targetIdx];
        if (overlay) {
          let coords = { x: 0, y: 0 };
          const width = 1920;
          const height = 1080;
          if (overlay.position) {
            if (overlay.position.includes('left')) coords.x = -width/2 + (width * 0.1);
            if (overlay.position.includes('right')) coords.x = width/2 - (width * 0.1);
            if (overlay.position.includes('top')) coords.y = -height/2 + (height * 0.1);
            if (overlay.position.includes('bottom')) coords.y = height/2 - (height * 0.1);
          } else if (overlay.grid) {
            const boxW = overlay.constrained ? width * 0.8 : width;
            const boxH = overlay.constrained ? height * 0.8 : height;
            const cols = overlay.grid.columns;
            const rows = Math.ceil(overlay.grid.total / cols);
            const col = overlay.grid.index % cols;
            const row = Math.floor(overlay.grid.index / cols);
            const cellW = boxW / cols;
            const cellH = boxH / rows;
            coords.x = (col * cellW + cellW / 2) - boxW / 2;
            coords.y = (row * cellH + cellH / 2) - boxH / 2;
          }
          m.endX = coords.x;
          m.endY = coords.y;
        }
      }
      lastZoom = m.endZoom;
      lastX = m.endX;
      lastY = m.endY;
    });
  });

  const fvDuration = getDuration(fvVideo);
  let totalSvDuration = 0;
  cuts.forEach(cut => {
    totalSvDuration += getDuration(cut.svVideo);
  });
  
  const totalFrames = Math.max(fvDuration + totalSvDuration, 30);

  return { fvVideo, cuts, totalFrames };
}

const AI_CONFIGS = {
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    apiKeyEnv: "OPENROUTER_API_KEY",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    }),
    buildBody: (model, systemMessage, transcript) => ({
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: transcript }
      ]
    }),
    parseResponse: (data) => data.choices[0].message.content
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    apiKeyEnv: "GROQ_API_KEY",
    headers: (key) => ({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    }),
    buildBody: (model, systemMessage, transcript) => ({
      model,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: transcript }
      ]
    }),
    parseResponse: (data) => data.choices[0].message.content
  },
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    headers: (key) => ({
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01"
    }),
    buildBody: (model, systemMessage, transcript) => ({
      model,
      max_tokens: 1000,
      system: systemMessage,
      messages: [{ role: "user", content: transcript }]
    }),
    parseResponse: (data) => data.content[0].text
  }
};

app.use(bodyParser.json({ limit: '50mb' }));

app.use((req, res, next) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/assets/') || req.url.includes('favicon')) return next();
  res.on('finish', () => addLog(req.method, req.url, res.statusCode, req.body));
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/templates', express.static(path.join(__dirname, 'public/templates')));
app.use('/huds', express.static(path.join(__dirname, 'public/huds')));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ai-generate-plan', async (req, res) => {
  let { transcript, systemMessage, provider = 'openrouter', model = 'google/gemma-3-27b-it:free', apiKey: userApiKey, isStep2 = false } = req.body;
  const config = AI_CONFIGS[provider];
  
  if (!config) return res.status(400).json({ error: `Invalid provider: ${provider}` });

  const apiKey = userApiKey || process.env[config.apiKeyEnv];
  if (!apiKey) return res.status(500).json({ error: `API Key for ${provider} not provided.` });

  if (isStep2) {
    const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
    const serverTemplates = files.map(f => JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8')));
    
    let templateListStr = "\n\n### AVAILABLE SERVER TEMPLATES (Template Catalog):\n";
    serverTemplates.forEach(t => {
      const slots = getTemplateSlots(t);
      templateListStr += `- **${t.number || t.name}**: ${t.description || 'No description.'} (Requires ${slots} media slots)\n`;
    });
    
    systemMessage += templateListStr;
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: config.headers(apiKey),
      body: JSON.stringify(config.buildBody(model, systemMessage, transcript))
    });

    if (!response.ok) throw new Error(JSON.stringify(await response.json()));

    const data = await response.json();
    let raw = config.parseResponse(data);
    
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error("AI response did not contain a valid JSON object.");
    }
    
    const jsonStr = raw.substring(firstBrace, lastBrace + 1);
    res.json(JSON.parse(jsonStr));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-sv-script', async (req, res) => {
  const { topics, category = null, testMode = false, faceDetection = true, introOnly = false, hudName = null } = req.body;
  if (!topics || !Array.isArray(topics)) return res.status(400).json({ error: 'Topics array required' });

  addLog('GENERATOR', 'Script Build', 102, `Starting build for ${topics.length} topics (Category: ${category || 'General'}, Face Filter: ${faceDetection ? 'ON' : 'OFF'})`, true);

  try {
    const scriptLines = [];
    const usedUrls = new Set(); 
    
    const templateFiles = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
    const availableTemplates = templateFiles.map(f => JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8')));

    const topicCount = topics.length;
    let columns = Math.ceil(Math.sqrt(topicCount));
    const introDuration = Math.max(360, topicCount * 60 + 60);
    const whiteBgCount = Math.ceil(introDuration / 60);
    
    scriptLines.push(`FV: WhiteBackground *${whiteBgCount}`);
    
    const introLabels = topics.map(t => t.label).join(', ');
    const introImages = [];
    const topicImageMap = {}; 

    addLog('GENERATOR', 'Intro Build', 102, 'Downloading intro images...', true);

    for (const topic of topics) {
      if (testMode) {
        introImages.push("/placeholder.png");
        topicImageMap[topic.label] = "/placeholder.png";
      } else {
        const searchQuery = `${category ? category + ': ' : ''}${topic.label}`;
        const results = await n8nStyleImageSearch(searchQuery);
        let localPath = null;
        for (let j = 0; j < Math.min(results.length, 15); j++) {
          const downloadResult = await downloadExternalFile(results[j].image);
          if (downloadResult.path) {
            const fullPath = path.join(__dirname, 'public', downloadResult.path);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 5000) {
              localPath = downloadResult.path;
              break;
            }
          }
          if (downloadResult.skipped) break; 
        }
        const finalPath = localPath || "/placeholder.png";
        introImages.push(finalPath);
        topicImageMap[topic.label] = finalPath;
      }
    }
    
    scriptLines.push(`FV: Batch Circles ${topicCount} ${columns} 0-${introDuration} "${introLabels}" ${introImages.join(', ')}`);
    for (let i = 0; i < topicCount; i++) {
      scriptLines.push(`FV: Camera focus #${i + 1} ${(i * 60) + 30}-${(i * 60) + 60} 2`);
    }
    scriptLines.push(""); 

    if (introOnly) {
      addLog('GENERATOR', 'Complete', 200, 'Intro script generated', true);
      return res.json({ script: scriptLines.join('\n').trim() });
    }

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const cutFrame = (i * 60) + 90;
      const tag = `#topic${i+1}`;
      
      addLog('GENERATOR', topic.label, 102, `Processing topic ${i+1}/${topics.length}`, true);

      const totalTopicDuration = topic.moments.reduce((acc, m) => acc + (m.duration_estimate * 30), 0);
      
      if (hudName) {
        scriptLines.push(`HUD: ${hudName} ${tag}`);
      }
      
      scriptLines.push(`FV: Overlay center-top 0-${totalTopicDuration} "${topic.label}" FadeInTextTransition ${tag}`);
      scriptLines.push(`FV: Overlay right-top 0-${totalTopicDuration} small "" ${topicImageMap[topic.label]} ${tag}`);

      for (let mIdx = 0; mIdx < topic.moments.length; mIdx++) {
        const moment = topic.moments[mIdx];
        
        const template = availableTemplates.find(t => 
          String(t.number) === String(moment.template) || 
          t.name.toLowerCase() === String(moment.template).toLowerCase()
        );
        
        const templateName = template ? template.name : moment.template;
        const slotCount = template ? getTemplateSlots(template) : 0;

        addLog('GENERATOR', topic.label, 102, `Moment ${mIdx+1}/${topic.moments.length}: ${templateName} (${slotCount} slots)`, true);

        const momentMediaUrls = [];
        if (slotCount > 0) {
          if (testMode) {
            for (let j = 0; j < slotCount; j++) momentMediaUrls.push(`"/placeholder.png"`);
          } else {
            for (let slotIdx = 1; slotIdx <= slotCount; slotIdx++) {
              let preferredType = 'any';
              if (template && template.overlays) {
                const slotStr = `{{${slotIdx}}}`;
                const isUsedInVideo = template.overlays.some(o => 
                  o.name === 'VideoObject' && 
                  JSON.stringify(o.props).includes(slotStr)
                );
                const isUsedInImage = template.overlays.some(o => 
                  (o.name === 'ImageObject' || o.name === 'Circles' || o.name === 'RoundedRectangle') && 
                  JSON.stringify(o.props).includes(slotStr)
                );
                
                if (isUsedInVideo) preferredType = 'video';
                else if (isUsedInImage) preferredType = 'image';
              }

              const words = moment.description.split(' ').slice(0, 4).join(' ');
              const searchQuery = `${category ? category + ': ' : ''}${topic.label} ${words}`.replace(/[^\w\s:]/g, '').trim();
              
              let localPath = null;
              const searchAttempts = [searchQuery, `${category ? category + ': ' : ''}${topic.label}`];

              for (const query of searchAttempts) {
                if (localPath) break;
                
                let results = [];
                if (preferredType === 'video') {
                  results = await n8nStyleVideoSearch(query);
                } else if (preferredType === 'image') {
                  results = await n8nStyleImageSearch(query);
                } else {
                  results = await n8nStyleVideoSearch(query);
                  if (results.length === 0) results = await n8nStyleImageSearch(query);
                }

                const startIdx = (mIdx + slotIdx) % Math.max(1, results.length);
                for (let j = 0; j < results.length; j++) {
                  const idx = (startIdx + j) % results.length;
                  const mediaUrl = results[idx].image || results[idx].content;
                  
                  if (!usedUrls.has(mediaUrl)) {
                    const downloadResult = await downloadExternalFile(mediaUrl, moment.duration_estimate);
                    if (downloadResult.path) {
                      const fullPath = path.join(__dirname, 'public', downloadResult.path);
                      const localFilename = path.basename(fullPath);

                      if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 5000) {
                        const isVideo = fullPath.toLowerCase().endsWith('.mp4') || fullPath.toLowerCase().endsWith('.webm');
                        
                        if (isVideo && faceDetection) {
                          const validation = await validateMedia(fullPath, 'video');
                          if (validation.should_delete) {
                            addLog('FILTER', localFilename, 403, `BLOCK: Human/3D face detected (${(validation.confidence * 100).toFixed(1)}%)`, true);
                            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                            continue; 
                          }
                          addLog('FILTER', localFilename, 200, `ALLOW: Media verified (${(validation.confidence * 100).toFixed(1)}%)`, true);
                        }
                        
                        localPath = downloadResult.path;
                        usedUrls.add(mediaUrl);
                        break;
                      }
                    }
                    if (downloadResult.skipped) break; 
                  }
                }
              }

              momentMediaUrls.push(`"${localPath || topicImageMap[topic.label] || "/placeholder.png"}"`);
            }
          }
        }

        const params = momentMediaUrls.length > 0 ? ` ${momentMediaUrls.join(' ')}` : '';
        const transcriptParam = ` "${moment.description.replace(/"/g, "'")}"`;
        scriptLines.push(`CALL: ${templateName}${params}${transcriptParam} ${moment.duration_estimate}s ${tag}`);
      }
      scriptLines.push(`CUT: ${tag} at ${cutFrame}`);
      scriptLines.push(""); 
    }

    addLog('GENERATOR', 'Complete', 200, 'Full script generated', true);
    res.json({ script: scriptLines.join('\n').trim() });
  } catch (err) {
    addLog('GENERATOR', 'Error', 500, err.message, true);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', (req, res) => res.json(httpLogs));
app.get('/api/renders', (req, res) => res.json(activeRenders));
app.get('/api/active-downloads', (req, res) => {
  const list = Array.from(activeDownloads.values()).map(d => ({
    id: d.id,
    url: d.url,
    progress: d.progress,
    size: d.size,
    status: d.status,
    isYouTube: d.isYouTube
  }));
  res.json(list);
});
app.post('/api/skip-download/:id', (req, res) => {
  const id = req.params.id;
  if (activeDownloads.has(id)) {
    const item = activeDownloads.get(id);
    item.skipped = true;
    if (item.proc) {
      item.proc.kill();
    }
    if (item.controller) {
      item.controller.abort();
    }
    addLog('SKIP', item.url, 200, 'Download skipped by user', true);
    res.json({ message: 'Download skipped' });
  } else {
    res.status(404).json({ error: 'Download not found' });
  }
});

app.get('/api/settings', (req, res) => res.json(settings));
app.post('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
  res.json({ message: 'Settings updated', settings });
});
app.get('/api/search-images', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  const results = await n8nStyleImageSearch(q);
  res.json(results.map(r => ({ image: r.image, title: r.title, url: r.url })));
});
app.get('/api/templates', (req, res) => {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
  const templates = files.map(f => JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8')));
  res.json(templates);
});
app.post('/api/templates', (req, res) => {
  const template = req.body;
  const filename = `${template.name.toLowerCase().replace(/\s+/g, '_')}.json`;
  fs.writeFileSync(path.join(TEMPLATES_DIR, filename), JSON.stringify(template, null, 2));
  res.json({ message: 'Template saved', filename });
});
app.delete('/api/templates/:name', (req, res) => {
  const filename = `${req.params.name.toLowerCase().replace(/\s+/g, '_')}.json`;
  if (fs.existsSync(path.join(TEMPLATES_DIR, filename))) {
    fs.unlinkSync(path.join(TEMPLATES_DIR, filename));
    res.json({ message: 'Template deleted' });
  } else res.status(404).json({ error: 'Not found' });
});

// HUD Endpoints
app.get('/api/huds', (req, res) => {
  const files = fs.readdirSync(HUDS_DIR).filter(f => f.endsWith('.json'));
  const huds = files.map(f => JSON.parse(fs.readFileSync(path.join(HUDS_DIR, f), 'utf8')));
  res.json(huds);
});
app.post('/api/huds', (req, res) => {
  const hud = req.body;
  const filename = `${hud.name.toLowerCase().replace(/\s+/g, '_')}.json`;
  fs.writeFileSync(path.join(HUDS_DIR, filename), JSON.stringify(hud, null, 2));
  res.json({ message: 'HUD saved', filename });
});
app.delete('/api/huds/:name', (req, res) => {
  const filename = `${req.params.name.toLowerCase().replace(/\s+/g, '_')}.json`;
  if (fs.existsSync(path.join(HUDS_DIR, filename))) {
    fs.unlinkSync(path.join(HUDS_DIR, filename));
    res.json({ message: 'HUD deleted' });
  } else res.status(404).json({ error: 'Not found' });
});

app.post('/api/test-webhook', async (req, res) => {
  const payload = { message: "Ping", timestamp: new Date().toISOString() };
  const response = await fetch(settings.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  addLog('POST (OUT)', settings.webhookUrl, response.status, payload, true);
  res.json({ status: response.status });
});
app.post('/verify-script', (req, res) => res.json({ message: 'Verified' }));
app.post('/render-script', async (req, res) => {
  let { script, outputName = `video_${Date.now()}` } = req.body;
  const renderId = Date.now().toString();
  const renderTask = { id: renderId, name: outputName, status: 'rendering', progress: 0, startTime: new Date().toISOString() };
  activeRenders.push(renderTask);
  res.json({ message: 'Render started', renderId });
  
  try {
    const templateFiles = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
    const availableTemplates = templateFiles.map(f => JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf8')));
    
    const hudFiles = fs.readdirSync(HUDS_DIR).filter(f => f.endsWith('.json'));
    const availableHuds = hudFiles.map(f => JSON.parse(fs.readFileSync(path.join(HUDS_DIR, f), 'utf8')));

    const config = parseScriptToConfig(script, availableTemplates, availableHuds);
    const propsPath = path.join(__dirname, `props_${renderId}.json`);
    fs.writeFileSync(propsPath, JSON.stringify({ fvVideo: config.fvVideo, cuts: config.cuts }));

    const remotionBin = path.join(__dirname, 'node_modules/.bin/remotion');
    const cmd = `"${remotionBin}" render remotion/src/index.ts FinalComposition "public/${outputName}.mp4" --props="${propsPath}" --duration=${config.totalFrames}`;
    const renderProcess = spawn(cmd, { shell: true });
    
    renderProcess.stdout.on('data', (data) => {
      const match = data.toString().match(/Rendered (\d+)\/(\d+)/);
      if (match) {
        const idx = activeRenders.findIndex(r => r.id === renderId);
        if (idx > -1) activeRenders[idx].progress = Math.floor((parseInt(match[1]) / parseInt(match[2])) * 100);
      }
    });

    renderProcess.on('close', (code) => {
      const idx = activeRenders.findIndex(r => r.id === renderId);
      if (idx > -1) {
        activeRenders[idx].status = code === 0 ? 'success' : 'failed';
        if (code === 0) activeRenders[idx].videoUrl = `/public/${outputName}.mp4`;
      }
      if (fs.existsSync(propsPath)) fs.unlinkSync(propsPath);
    });
  } catch (err) {
    const idx = activeRenders.findIndex(r => r.id === renderId);
    if (idx > -1) { activeRenders[idx].status = 'failed'; activeRenders[idx].error = err.message; }
  }
});

app.get('/*path', (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`Server on ${PORT}`));