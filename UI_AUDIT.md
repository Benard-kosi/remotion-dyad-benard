# Remotion Studio: Technical UI/UX Audit (v1.2.0)

This document serves as the "Source of Truth" for the current system state. It must be referenced before and during any UI/UX modifications to ensure no functionality is lost.

---

## 1. Global Design System & Layout
*   **Theme:** Light/Dark mode support (primarily tested in Light mode with `gray-50` backgrounds).
*   **Typography:** 
    *   UI: System Sans-serif (Inter/Default).
    *   Video Overlays: **Bebas Neue** (Primary), Monospace (Typewriter).
*   **Color Palette:**
    *   `Primary`: Slate/Zinc (`#0f172a`).
    *   `Magic/AI`: Purple (`#9333ea`).
    *   `Automation/Server`: Green (`#22c55e`).
    *   `HUD/Design`: Blue (`#2563eb`).
    *   `Warning/Test`: Amber (`#d97706`).
*   **Layout Pattern:** Standard "Dashboard" layout with a sticky or top-aligned header and a 12-column grid (typically 4-5 columns for controls, 7-8 for preview).

---

## 2. Screen-by-Screen Component Inventory

### 2.1 Index (Home)
*   **Components:**
    *   `TitleCard`: Centered hero component with Title and Subtitle.
    *   `Badges`: Version (`v1.1.0`) and Engine Status (`Dynamic Engine`).
    *   `Navigation Cards (6)`: Large cards with Lucide icons, descriptions, and full-width action buttons.
*   **Functional Logic:**
    *   Simple routing via `react-router-dom`.
    *   Hover state: Cards feature a subtle shadow transition (`hover:shadow-md`).

### 2.2 Magic Generator (`/auto-generator`)
*   **Header:** Wand icon, Title, "Full Auto Mode" button (Purple), Face Filter/Test Mode toggles, Back button.
*   **Left Panel (AI Chain Config):**
    *   `Transcript Textarea`: Multi-line input for raw text.
    *   `Accordion (Steps 0-2)`: 
        *   Inputs for Provider (Select), Model (Input), and System Message (Textarea).
        *   Logic: Step 2 includes a "Template Catalog" injected into the prompt.
    *   `Global HUD Select`: Dropdown to apply a saved HUD style to the generated script.
*   **Right Panel (Output & Generation):**
    *   `Progress Card`: Visible only during AI runs. Shows current step and a percentage progress bar for Step 2 loops.
    *   `Step 1 Output`: Read-only JSON view of extracted topics.
    *   `Final Aggregated JSON`: Editable JSON view of the structured visual plan.
    *   `Action Buttons`: "Generate Intro Only" (Outline) and "Generate Full Script" (Solid).
    *   `Script Output`: Black code block with syntax highlighting (Green text) and a "Copy" button.
*   **Hidden Logic:**
    *   **Step 2 Loop:** The AI is called sequentially for every topic identified in Step 1.
    *   **Media Search:** The "Full Script" button triggers a server-side process that scrapes images, downloads them, and runs MediaPipe face filtering.

### 2.3 Script Creator (`/script-creator`)
*   **Header:** Wand icon, Title, "Search Images" tool, "Save SVs" button, "Hide Preview" toggle.
*   **Left Panel (Editor):**
    *   `DSL Textarea`: The core editor for the custom scripting language.
    *   `Subs Switch`: Global toggle for subtitles.
    *   `Info Dialog`: Contains the "Scripting Guide" with syntax examples.
    *   `Action Buttons`: "Update Preview" (Secondary) and "Render Video" (Primary).
*   **Right Panel (Preview):**
    *   `Remotion Player`: 16:9 aspect ratio, black background, full transport controls.
    *   `Export Dialog`: Generates the raw `npx remotion render` CLI command.
    *   `Parsed Structure`: Lists detected Backgrounds, Cuts, and Subtitle chunks with frame ranges.
*   **Hidden Logic:**
    *   **Real-time Parsing:** The `useMemo` hook parses the DSL into a JSON config for the `FinalComposition`.
    *   **Subtitle Chunking:** Long text is automatically split into chunks based on "Words Per Second" logic.

### 2.4 SV Creator (`/sv-video-creator`)
*   **Sidebar Panels:**
    *   `Project Settings`: Inputs for Name, Template Number, AI Description, and **Stretch Hinge**.
    *   `Server Templates`: List of `.json` files in `public/templates/` with Load/Delete actions.
    *   `Camera Tool`: 
        *   Tabs for "Custom Path" (Manual inputs or Grid Dragging) and "Object Focus".
        *   Grid: A 10x10 interactive area to set X/Y coordinates visually.
    *   `Sequence List`: Vertical list of background templates. **Logic:** Items can be deleted directly via the Trash icon.
    *   `Objects Panel`: 
        *   Tabs: Single vs. Batch.
        *   **Slot Pickers:** Buttons to map `{{1}}`, `{{2}}`, etc., to Image, Label, or Sequence data.
        *   Size Mode: Select between `main`, `small`, and `keep`.
*   **Hidden Logic:**
    *   **Stretch Hinge:** Defines the specific frame where the video "pauses" to expand if the requested duration is longer than the template.
    *   **Camera Chaining:** The `endZoom/X/Y` of movement $N$ automatically becomes the `startZoom/X/Y` of movement $N+1$.

### 2.5 HUD Creator (`/hud-creator`)
*   **Sidebar Panels:**
    *   `HUD Settings`: Name input and buttons to add Text, Image, or Progress elements.
    *   `Subtitle Settings`: Global configuration for font size, padding, and chunking logic.
    *   `Elements List`: 
        *   **Auto-Mapping Toggle:** If ON, `{{topic}}` is replaced by the current topic name.
        *   Position Select: 6-point anchoring (Top-Left, Bottom-Center, etc.).
*   **Main Area:** Player showing a preview with a dummy "PREVIEW TOPIC" label.

### 2.6 Server Dashboard (`/dashboard`)
*   **Panels:**
    *   `Automation Settings`: Webhook URL and Base URL inputs. Displays the local Docker endpoints for n8n.
    *   `Media Filter Activity`: Real-time logs of MediaPipe scans. Shows "ALLOWED" (Green) or "BLOCKED" (Red) with confidence scores.
    *   `Active Downloads`: Progress bars for `yt-dlp` or direct downloads. Includes a "SKIP" button to kill the process.
    *   `Active Renders`: Progress bars for Remotion rendering tasks.
    *   `HTTP Traffic Log`: Last 50 requests (Inbound/Outbound) with status codes and body snippets.

---

## 3. Core Interaction Flows

### 3.1 The "Magic" Workflow (AI to Video)
1.  User pastes transcript into **Magic Generator**.
2.  User clicks **Run AI Chain**.
3.  System executes Step 1 (Topic Extraction) -> UI updates Step 1 Output.
4.  System executes Step 2 (Visual Planning) -> UI updates Progress Bar for each topic.
5.  User reviews/edits the **Final Aggregated JSON**.
6.  User clicks **Generate Full Script**.
7.  Server searches for media -> Filters via MediaPipe -> Downloads assets -> Generates DSL Script.
8.  User copies script to **Script Creator** to preview and render.

### 3.2 The Template Design Workflow (SV)
1.  User opens **SV Creator**.
2.  User adds background templates to the **Sequence**.
3.  User adds an **ImageObject**, sets Size to `main`, and assigns it to **Slot 1** (`{{1}}`).
4.  User sets a **Stretch Hinge** at frame 150 (the middle of the animation).
5.  User saves to server.
6.  The template is now available for the AI to use via the `CALL: TemplateName` command.

### 3.3 The Manual Stitching Workflow (FV)
1.  User opens **FV Creator**.
2.  User builds a long background sequence.
3.  User uses the **Cuts Panel** to select an SV Template from the server.
4.  User specifies a frame (e.g., `300`) and clicks **Add Cut**.
5.  The Player now shows the FV pausing at frame 300, playing the SV, then resuming the FV.

---

## 4. Critical "Hidden" Logic to Preserve
*   **Camera Focus Math:** When "Camera Focus" is used, the system calculates the center point of an object based on its `Position` (e.g., `right-top`) or its `Grid Index` (e.g., item 3 in a 4x2 grid).
*   **DSL Tagging:** The `#topic1` tag in the script creator is the "glue" that links a `HUD`, an `Overlay`, and a `CALL` sequence together into a single visual group.
*   **MediaPipe Sampling:** The server samples videos at 0%, 20%, 40%, 60%, 80%, and 95% to ensure no human faces appear at any point in the clip.