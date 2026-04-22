# Remotion Studio: Comprehensive Documentation (v1.2.0)

Welcome to the **Remotion Studio**, a powerful, programmatic video creation platform built with React, Vite, and Remotion. This application allows you to create, preview, and automate high-quality video content using visual editors, a custom scripting language, and an advanced AI-powered "Magic Generator."

---

## 1. Core Concepts: FV vs. SV

The application distinguishes between two types of video projects:

### **Front Video (FV)**
*   **Purpose**: The main timeline or "background" of your video.
*   **Structure**: A sequence of background animation templates (e.g., `WhiteBackground`, `AnimatedGridBackground`) with overlays (images, videos, text) and camera movements.
*   **Use Case**: The primary narrative flow of your video.

### **Secondary Video (SV)**
*   **Purpose**: Reusable,<dyad-write path="DOCUMENTATION.md" description="Completing the comprehensive documentation for the Remotion Studio application.">
# Remotion Studio: Comprehensive Documentation (v1.2.0)

Welcome to the **Remotion Studio**, a powerful, programmatic video creation platform built with React, Vite, and Remotion. This application allows you to create, preview, and automate high-quality video content using visual editors, a custom scripting language, and an advanced AI-powered "Magic Generator."

---

## 1. Core Concepts: FV vs. SV

The application distinguishes between two types of video projects:

### **Front Video (FV)**
*   **Purpose**: The main timeline or "background" of your video.
*   **Structure**: A sequence of background animation templates (e.g., `WhiteBackground`, `AnimatedGridBackground`) with overlays (images, videos, text) and camera movements.
*   **Use Case**: The primary narrative flow of your video.

### **Secondary Video (SV)**
*   **Purpose**: Reusable, template-based clips that can be "cut" into the main FV timeline.
*   **Structure**: Similar to FV, but designed to be dynamic. They use "Slots" (e.g., `{{1}}`, `{{2}}`) for images and text, which are filled at runtime.
*   **Use Case**: Explainer segments, character introductions, or repetitive visual patterns.

---

## 2. Key Features

### **Magic Generator (AI Chain)**
The most advanced feature of the app. It uses a two-step AI process to turn a raw transcript into a fully structured video script.
1.  **Step 1 (Analysis)**: Extracts the "Main Subject" (e.g., an Anime name) and a list of topics with estimated durations.
2.  **Step 2 (Structuring)**: Loops through each topic to assign specific Remotion templates and structure "moments" (visual beats).
3.  **Tightened Search**: Automatically prepends `anime: [Subject]` to all image searches to ensure high relevance (e.g., searching for "God Hand" in a Berserk video won't return religious images).

### **Script Creator**
A text-based editor where you can build complex videos using a custom domain-specific language (DSL).
*   **FV Commands**: Set backgrounds (`FV: WhiteBackground *5`).
*   **Overlay Commands**: Place objects (`FV: Overlay center-center 0-60 "Hello"`).
*   **Batch Commands**: Create grids of objects (`FV: Batch Circles 8 4 0-240 ...`).
*   **Camera Commands**: Focus on specific objects (`FV: Camera focus #1 30-60 2`).
*   **Cut Commands**: Insert SV templates into the timeline (`CUT: #topic1 at 90`).

### **Visual Creators (FV & SV)**
Drag-and-drop style editors for those who prefer a GUI over scripting.
*   **FV Creator**: Sequence backgrounds and place overlays visually.
*   **SV Creator**: Design reusable templates with "Slot Pickers" to define where dynamic data will go.

### **Final Stitcher**
The tool that brings everything together. It takes your main FV project and allows you to precisely "cut" SV templates into the timeline. The FV video will pause, play the SV, and then resume seamlessly.

---

## 3. How to Use the App

### **Method A: The AI Workflow (Fastest)**
1.  Go to the **Magic Generator**.
2.  Paste your transcript.
3.  Click **Run AI Chain**. Wait for the topics to be extracted and structured.
4.  Click **Generate Full Script**. The system will search for relevant images and build the final script.
5.  Copy the script to the **Script Creator** to preview or render.

### **Method B: The Manual Scripting Workflow**
1.  Go to the **Script Creator**.
2.  Write your script using the `FV:`, `CALL:`, and `CUT:` commands.
3.  Use the **Image Search** tool to find URLs for your assets.
4.  Preview the video in the live player.
5.  Click **Render** to generate the final MP4.

### **Method C: The Visual Workflow**
1.  Design your reusable templates in the **SV Creator** and save them to the server.
2.  Build your main background sequence in the **FV Creator**.
3.  Go to the **Final Stitcher** to insert your SV templates at specific timestamps.

---

## 4. Technical Details

### **Server & Automation**
The app includes a built-in Express server (`server.js`) that handles:
*   **Image Search**: Scrapes DuckDuckGo for relevant media.
*   **Media Downloader**: Downloads and caches external images/videos to the `public/uploads` folder for stable rendering.
*   **Template Management**: Saves and loads JSON templates from `public/templates`.
*   **Headless Rendering**: Provides a `/render-script` endpoint for automation tools like **n8n**.

### **Camera System**
The virtual camera supports smooth zooming and panning. You can either define paths manually or use the "Focus" tool to automatically center the camera on a specific overlay object.

### **Hinge Stretching**
SV templates use a "Stretch Hinge" (defined by a frame number). When a template is called with a duration longer than its original design, it "stretches" at that specific frame, extending the middle section while keeping the intro and outro animations intact.

---

## 5. Troubleshooting
*   **Irrelevant Images**: Ensure the "Main Subject" is correctly identified in the Magic Generator.
*   **Render Fails**: Check the **Server Dashboard** for logs. Ensure all external URLs are accessible.
*   **Font Issues**: The app uses "Bebas Neue". Ensure it is loaded correctly in the browser before rendering.

---
*Documentation generated for Remotion Studio v1.2.0*