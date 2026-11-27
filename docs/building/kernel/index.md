---
title: uwu_kernel
parent: /building/
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

`uwu_kernel` 是 uwuAOSP 用于将 kernel build 接入 Soong 的模块类型，旨在替代 legacy kernel build task。

`uwu_kernel` 不替代 kernel 自身的 build system。Kbuild、Bazel 等仍负责实际的 kernel build，
`uwu_kernel` 负责将其构建过程和产物接入 Android build system。

## 为什么需要 uwu_kernel

Legacy kernel build task 是普通设备切换 Soong-only 的主要阻碍之一。

Legacy kernel module 配置将 module 的安装位置和加载列表分散在多个 Make 变量和文件中，两者之间还存在交叉引用。
`uwu_kernel` 将这些信息直接写在设备配置中，区分哪些 modules 安装到分区，以及其中哪些需要加载。

## 迁移

> [!TIP] 先用 uwuCLI 迁移
> uwuCLI 会读取现有设备配置，生成对应的 `uwu_kernel` 配置，并报告无法自动转换的项目。

- [迁移指南](migration.md)：转换设备配置并接入构建。
- [配置参考](configuration.md)：手动调整时使用的常用属性和输出引用。
- [故障排查](troubleshooting.md)：出现对应问题时查阅。

## 已有设备

原文记录了以下设备的构建和启动验证：

| 设备 | Kernel | 类型 | Kernel build system |
| --- | --- | --- | --- |
| OnePlus 6T（`fajita`） | 4.19 | non-GKI | Kbuild |
| OnePlus Ace 3 / 12R（`aston(c)`） | 5.15 | GKI | Kbuild |
| POCO F7 / Redmi Turbo 4 Pro（`onyx`） | 6.6 | GKI | Bazel |
