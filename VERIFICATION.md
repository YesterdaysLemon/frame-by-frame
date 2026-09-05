# Verification — 2026-09-05

## Classic chrome revision

The modern design was replaced using the owner's supplied 665 × 570 screenshot as the visual reference. No pixels or proprietary program assets from the screenshot are bundled; bevels, controls and icons are HTML/CSS/SVG and figures are canvas drawings.

- At 665 × 570, the floating builder measured x=345, y=144, width=292, height=386. The main canvas measured x=143, y=133, width=507, height=418. Visual inspection matched the reference's gray panel chrome, compact menus/controls, blue builder title, hollow heads and red/orange joints closely. The application retains its own title.
- Opening and closing the builder without edits preserved the pose. Increasing thickness changed 9 to 10.3; apply succeeded and Ctrl+Z restored 9.
- An actual builder joint drag moved the joint; circle/fill tool changes applied. The builder edits existing joints rather than constructing arbitrary new topology.
- Actual main-stage hip dragging moved [144,350] to approximately [164,360]. Next Frame created frame 7; playback started and stopped.
- Download/save and open restored the seven-frame project. The previous MVP's three-frame JSON also opened successfully. Malformed JSON was rejected.
- Screenshots refreshed at 665 × 570, 1280 × 900 and 390 × 844. At 390px, the builder's right edge was 376px and all chrome stayed within the viewport. No uncaught browser errors occurred in the final interaction check. Physical touch hardware was not tested.

Earlier checks below document the initial MVP, prior to this visual revision.

Tested in a real Microsoft Edge browser with Playwright, at desktop 1440px and narrow 390px viewport widths. Desktop/mobile screenshots are included. No horizontal page overflow was found at 390px; physical touchscreen hardware was not tested.

- Actual hip dragging moved the figure origin from [400,270] to [450,250].
- Next frame and Duplicate produced three frames; Play and Stop changed playback state.
- Actual joint dragging changed the wrist pose while preserving segment lengths to floating-point precision (maximum measured difference 1.42e-14 stage pixels).
- Save project downloaded JSON. After adding a frame, opening the saved JSON restored exactly the saved frames.
- Invalid JSON was rejected with a visible error message; the existing project remained loaded.
- Export PNG produced a downloaded frame image.
- JavaScript syntax checks passed. Fresh navigation produced no console errors or uncaught page exceptions.
- Local server returned pages successfully and rejected Git metadata/dotfile and encoded traversal requests with HTTP 403.

This is a bounded smoke test, not exhaustive device or format compatibility verification. The editor uses its own JSON format and does not import .piv, export animated GIF/video, or add arbitrary skeleton topology.
