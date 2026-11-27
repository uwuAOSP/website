---
title: "选择后台运行策略"
parent: /project-docs/
appBarTitle: "后台管理"
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

进入 **uwuAOSP Plus! > 后台管理**，找到应用，选择它的运行模式。
不确定是否需要管理时，保持“默认”即可。

| 模式 | 用途 |
| --- | --- |
| 默认 | 交给 Android 原有后台管理 |
| 墓碑 | 应用空闲后冻结进程，保留当时的内存状态 |
| Full | 不冻结进程，并调整后台存活策略 |

> [!TIP] 消息延迟或后台播放异常
> 将受影响的应用恢复为“默认”。

## 划掉最近任务后保留应用

“忽略启动器任务卡移除”适用于墓碑和 Full 模式。开启后，从最近任务中划掉卡片仍可保留应用状态和进程。

## 冻结后端

默认使用“自动判定”。其他选项取决于设备内核支持。

需要向维护者反馈问题时，可以使用设置里的日志导出功能，附上出现问题的应用和具体操作。

墓碑实现参考 [Cirno](https://github.com/Freezer-Team/Cirno)。
