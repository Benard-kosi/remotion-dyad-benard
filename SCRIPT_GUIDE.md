# Video Factory Scripting Guide (v1.2.0)

Use this guide to generate valid scripts for the Video Factory automation engine.

## 1. Core Structure
Scripts are processed line-by-line. Empty lines are ignored.

### FV (Front Video) Sequence
Adds a background animation template to the main timeline.
- **Syntax**: `FV: <TemplateName> [*Multiplier]`
- **Example**: `FV: WhiteBackground *10` (Repeats the template 10 times)

### CALL (Sequential Templates)
Inserts a template into the timeline. Templates now stack **automatically** one after the other.
- **Syntax**: `CALL: <TemplateName/Number> [Param1] [Param2] ... [Duration]`
- **Duration**: Use `Xs` for seconds (e.g., `10s`) or a raw number for frames.
- **Example**: `CALL: 1 /face.png "Hero" 10s` (Starts at frame 0, lasts 300 frames)
- **Example**: `CALL: 2 /img.png "Next" 5s` (Starts automatically at frame 300)

### Hinge Stretching
Templates now use a "Hinge" (Stretch Frame) to protect intros and outros.
- **Intro**: Objects ending before the hinge stay at the start.
- **Outro**: Objects starting after the hinge are pushed to the new end.
- **Hold**: Objects active during the hinge are extended to fill the duration.

---

## 2. Overlays & Sequence Objects
Place images, videos, or complex animation sequences on top of the background.

### Sequence Objects (The "Hold" System)
Allows you to chain animations with custom hold durations.
- **Syntax**: `FV: Overlay [ID] SequenceObject <Position> <Start>-<End> <SizeMode> [constrained] "<Label>" <Animation1|Data|ExtraHold>, <Animation2|Data|ExtraHold>`
- **Format**: `ComponentName|Data|ExtraHold`
- **Example**: `FV: Overlay [s] SequenceObject center-center 0-300 main constrained "Intro" TypewriterText|Hello World|90, ArrowSequence|right|30`

---

## 3. Camera Movements
Control the "virtual camera" to zoom or pan.
- **Syntax**: `FV: Camera focus <Target> <Start>-<End> <ZoomLevel>`
- **Target**: `#<Index>` (e.g., `#1`) or `[<ID>]` (e.g., `[hero]`).