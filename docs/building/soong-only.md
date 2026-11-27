---
title: Soong-only
parent: /building/
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

Android build graph 的生成过程中包含一个串行执行的 Kati 阶段。Kati 负责处理 Make
构建规则，并生成相应的 Ninja 构建规则。

LineageOS 在 23.2 的 release blog 中提到：

> LineageOS is now nearly Android.mk free! Google announced their move from make to
> soong many years ago, pushing developers to migrate from Android.mk to Android.bp,
> and has started blocking Android.mk in many locations of the source tree.

但是，一些核心构建组件仍然依赖 Make，因此 Kati 仍然是构建流程中不可跳过的一环。

uwuAOSP 继续完成这项迁移的最后一步，使现代设备可以跳过 Kati 的主构建图生成阶段。
在原文记录的测试中，这使 build graph 的生成时间近乎减半。

> [!NOTE] 产品配置仍使用 Make
> Soong-only 跳过的是主构建图的 Kati 阶段，BoardConfig 等产品配置仍然使用 Makefile。

## 迁移设备

设备侧通常需要迁移：

- [`uwu_kernel`](kernel/index.md)：替代 legacy kernel build task。
- `uwu_prebuilt_image`：替代 Make 层的 `$(call add-radio-file, ...)`。

uwuCLI 提供相应的迁移入口。在源码根目录运行 `uwu`，按菜单选择产品树或内核迁移。
如果设备使用 `add-radio-file` 添加固件镜像，产品树迁移会提供相应转换。

完成迁移并 lunch 后，执行：

```bash
uwu inspect soong-only
```

输出中出现以下结果，表示选中的产品包已没有未迁移的 Android.mk 依赖：

```text
Conclusion
--------------------
  READY
  No selected package still depends on Android.mk.
```

有未完成项时，按工具给出的路径处理。

## 开启

临时启用：

```bash
export SOONG_ONLY=true
```

也可以在产品配置中设置：

```make
PRODUCT_SOONG_ONLY := true
```

临时设置可通过 `unset SOONG_ONLY` 撤销；产品配置中的开关需在产品文件里修改。

## 适用范围

> [!WARNING] A-only 设备暂不支持 Soong-only
> 这些设备依赖的 `//bootable/deprecated-ota:updater` 尚未完成迁移，请使用原有构建流程。

存在其他未迁移组件时，也可以继续使用原有构建流程。

已完成构建和启动验证的设备：

- OnePlus 6T（`fajita`）
- OnePlus Ace 3 / 12R（`aston(c)`）
