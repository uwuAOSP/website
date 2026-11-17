---
title: uwuAOSP 17.0.182
description: uwuAOSP 17.0.182
aside: false
outline: false
changelogBranch: uwu-17.0.182
---

<ReleaseBlog locale="en-US" mode="article" release="uwu-17.0.182" />

- Fixed incorrect behavior of labels, media player cards, and the brightness slider in circular uwuQS.
- Added support for positioning the volume panel on the left via a SystemUI overlay. Set "volume_dialog_gravity" to "19" for left or "21" for right (default).
- On tablets, the lock screen PIN panel now appears on the left, center, or right depending on the swipe-up position.
- Applied dynamic theme colors to the battery icon in the split QS battery pill.
- Added support for 16:9 Moment windows.
- Added Material 3 Expressive spatial and effects spring animations to Moment windows.
- Fixed the launcher search bar unexpectedly reappearing after being disabled.
- Replaced the screenshot button in Recents with a Clear all button. Screenshots remain available in each app's context menu.
- Added the Superellipse icon shape.
- Removed reserved search bar spacing when the search bar is disabled.
- Added Pixel-extracted themed icons for Google apps.
- Reworked uwuAppOps to manage sensor access, app launches, and clipboard access through the standard permission management interface.
- Fixed connected audio devices being collapsed on the Settings dashboard.
- Fixed uwuClocks styles not applying correctly.
- Switched to "device_framework_matrix.xml" from "hardware/lineage/interfaces", removing the need for manual imports.
- Removed the source tree fingerprint check from uni's build graph reuse mechanism, potentially reducing startup time by approximately 40 seconds.
- Redesigned the uni TUI.
- Restored the China Broadnet APN (LineageOS upstream).
