---
title: "Background management"
parent: /project-docs/
appBarTitle: "Background"
contentLang: en
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

Open **uwuAOSP Plus! > Background management**, select an app, and choose its mode.
Leave apps on **Default** unless you need a different policy.

| Mode | Behavior |
| --- | --- |
| Default | Use Android's standard background management |
| Tombstone | Freeze the process when idle, keeping its memory state |
| Full | Keep the process unfrozen and adjust its background survival policy |

> [!TIP] Delayed notifications or interrupted playback
> Switch the affected app back to **Default**.

## Dismissing recent tasks

“Ignore launcher task removal” applies to Tombstone and Full. It lets the system retain the app's state and process when you dismiss its recent-task card.
## Freezer backend

Normally, leave this on Automatic. Other options depend on kernel support.

If you need to report a problem, export a report from Settings and describe the affected app and what you were doing.

Tombstone freezing is inspired by [Cirno](https://github.com/Freezer-Team/Cirno).
