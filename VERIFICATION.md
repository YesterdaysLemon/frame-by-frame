# Verification — 2026-09-05

Tested in a real Microsoft Edge browser with Playwright, at desktop 1440px and narrow 390px viewport widths. Desktop/mobile screenshots are included. No horizontal page overflow was found at 390px; physical touchscreen hardware was not tested.

- Actual hip dragging moved the figure origin from [400,270] to [450,250].
- Next frame and Duplicate produced three frames; Play and Stop changed playback state.
- Actual joint dragging changed the wrist pose while preserving segment lengths to floating-point precision (maximum measured difference 1.42e-14 stage pixels).
- Save project downloaded JSON. After adding a frame, opening the saved JSON restored exactly the saved frames.
- Invalid JSON was rejected with a visible error message; the existing project remained loaded.
- Export PNG produced a downloaded frame image.
- JavaScript syntax checks passed. Fresh navigation produced no console errors or uncaught page exceptions.
- Local server returned pages successfully and rejected Git metadata/dotfile and encoded traversal requests with HTTP 403.

This is a bounded smoke test, not exhaustive device or format compatibility verification. The editor uses its own JSON format and does not import .piv, export animated GIF/video, or provide a custom skeleton builder.
