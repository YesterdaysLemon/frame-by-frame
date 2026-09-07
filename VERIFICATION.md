# Verification — 2026-09-05

## Floating windows and reusable library

- The builder's parent is now BODY, outside the stage's clipping region. A real title-bar drag moved it to [7,7]; hit-testing over the top menu and an overlapping library window returned the builder. Maximize filled a 1100 × 800 viewport with a 10px margin (1080 × 780).
- Saved a named character, rig, and full animation through the UI. All three survived a reload and appeared in the library; saved figures also appeared in the Add Figure selector. Inserting a saved character increased the frame's figure count from 1 to 2.
- Exported the library to JSON and imported it back. Existing items remained and duplicate names gained a numbered suffix. Malformed JSON was rejected. Rename and delete worked on the imported test assets, leaving one saved item in each category.
- All six procedural starter clips pass the app's project validator. Their forward-kinematic poses preserve source bone lengths to floating-point precision and stay within the stage.
- Library Preview visibly advanced frames. Appending Walk added 24 frames (3 → 27), retained the selected character's colour and produced a valid project. A later Wave append preserved rig lengths with maximum measured error 2.14e-14 stage units.
- Opening Jump produced its 24-frame, 18fps project. Undo restored the previous timeline and its 12fps rate; later append produced 51 total frames. Imported and saved clips are not treated as executable code.
- Desktop and narrow library screenshots were visually inspected. At 665 × 570 the library was 580 × 468 at [42.5,65]; at 390 × 844 it was 378 × 600 at [6,55]. Window resize/clamping, minimize and maximize were checked. Console inspection reported zero errors and warnings.

Checks used a dedicated local browser session and original test assets; test save files remain outside the repository. Browser storage quota exhaustion and physical touch hardware were not exhaustively tested. The library is local, and rigs retain the existing 11-joint topology.

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


## Custom figure / joint-pulling iteration (2026-09-05)

- `npm run check` passes syntax checks for all application scripts and `rig.test.cjs`.
- Pure geometry checks cover legacy and arbitrary-tree validation, reachable and unreachable hand targets, unchanged torso/opposite branches, limb-length preservation, pinned endpoints, classic branch rotation, and inward pulls on a perfectly straight custom chain. Invalid parent indices, cycles, non-finite coordinates and inconsistent metadata are rejected.
- Real Edge browser interaction checks verified hand dragging, Shift-click pinning and release, speed dialog Apply/Cancel/Undo, frame duplicate/delete/undo, and figure duplicate/scale/undo.
- Drew a four-joint branched figure from a blank origin, using line and circle segments; verified grid snapping and builder Undo. Named and saved it, inserted it through the figure picker, reloaded the browser, exported/imported its figure JSON, and round-tripped a complete animation containing custom figures.
- Exercised shape conversion, fill, thickness, static state, hide/restore, branch deletion/undo, reset/undo, window dragging above the main menus, minimize/maximize/restore, and cancel without modifying the animation.
- Rejected an invalid project without altering the timeline. A mismatched clip reports the topology difference and leaves the timeline unchanged; disabling retargeting appends the original actors successfully.
- Inspected captures at 665 x 570, 1100 x 800 and 390 x 700. Builder bounds fit each viewport; gray beveled controls, blue tool title bars and modeless stacking are retained. `builder-iteration.png` shows the new construction tools.
- Both browser suites completed with zero page errors. Tests used a separate Edge profile, not the owner's in-app animation/library storage.

Limits: endpoint IK stops at a branch or pinned/static ancestor; this is not full-body physics. Coincident snapping points remain distinct joints. Custom figures are trees with at most 128 joints. Animation retargeting requires the same parent layout. Saves remain local and portable through JSON export.


## Elbow/knee bend correction

The previous pull mode rotated both bones together when dragging an elbow or knee, preserving its bend angle. Direct middle-joint dragging now aims the upper bone at the pointer and projects the hand/foot toward its previous position at the fixed lower-bone length. Both bend directions are reachable; unrelated joints remain unchanged. Classic rotation and explicit pin/static constraints retain their previous behavior.

Regression tests first reproduced the one-sided failure, then passed after the correction. Real browser checks covered four pointer orientations for each elbow and knee at 665 x 570, 1100 x 800 and 390 x 700 (48 drags), asserting pointer tracking, both bend directions, fixed lengths, unchanged other joints and no page errors. The owner's in-app tab was refreshed; it restored the 44-frame, 12 fps animation, with Pull joints enabled.
