---
title: "使用外接屏桌面"
parent: /project-docs/
appBarTitle: "外接屏桌面"
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

准备支持视频输出的设备、显示器和连接线。

1. 进入 **uwuAOSP Plus! > 外接屏桌面**，开启该功能。
2. 连接支持的 USB-C 或 HDMI 显示器。
3. 在外接屏上使用任务栏和窗口。断开后，系统返回本机显示和输入。

> [!TIP] 只使用外接屏
> 开启“遮盖本机屏幕”。

## 使用 scrcpy 虚拟屏

连接好 adb，确认 scrcpy 支持 `--new-display`。在外接屏桌面设置中开启“允许 scrcpy 虚拟屏”，然后在电脑运行：

```sh
scrcpy --new-display=1920x1080
```
