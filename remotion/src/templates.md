# Remotion Component Templates Documentation

This file provides a detailed overview of each Remotion component template available in this project, explaining its purpose, how it works, and its primary use cases.

---

## TestBounceComp
*   **Description:** A simple text component that bounces into view and bounces out.
*   **How it works:** Uses the `spring` function to create a physical-based scale animation for both the entrance and exit phases.
*   **How to use them:**
    *   **Props:** None (displays "Hello" by default).
    *   **Example Usage:**
        ```tsx
        <TestBounceComp />
        ```
*   **Mainly used for:** Playful introductions or quick text callouts.

---

## FadeInTextTransition
*   **Description:** A versatile component for displaying text that fades in, holds for a duration, and then fades out.
...