# Video Script Syntax Reference

## SequenceObject & Extra Hold
The `SequenceObject` allows you to play multiple animations in a row within a single overlay. You can control the "Hold" duration of each animation.

- **Syntax**: `ComponentName|Data|ExtraHold`
- **Example**: `TypewriterText|Welcome|60` (Types "Welcome", holds for 60 extra frames, then erases).

## Dynamic ArrowSequence
Display an animated arrow pointing in any direction.
- **Directions**: `up`, `down`, `left`, `right`, `up-right`, `down-right`, `up-left`, `down-left`.
- **Example**: `ArrowSequence|up-right|30`

## Template Multipliers
Repeat a background template.
- **Example**: `FV: WhiteBackground *5`

## Resizing & Constraints
- `main`: Primary focus (large).
- `small`: Scaled down (can link to a `main` object using `[RefID]`).
- `keep`: Original size.
- `constrained`: Keyword to keep the object within a safe 80% screen boundary.

## Camera Focus
- **Syntax**: `FV: Camera focus [#index or [name]] [StartFrame]-[EndFrame] [ZoomLevel]`