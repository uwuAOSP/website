---
title: 设备移植
parent: /building/
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

本教程介绍构建 uwuAOSP 所需的设备树侧修改。
操作前需要已同步 uwuAOSP 源码，并准备好设备树及其依赖。

## 使用 uwuCLI

在源码根目录运行：

```bash
source build/envsetup.sh
uwu
```

选择语言，再选择“改造 LineageOS 产品设备树”，按提示填写设备类型、通信能力和维护者。
维护者名称可以留空；填写后会显示在 **设置 > 系统 > 软件更新** 中。

## 手动改造

在设备产品 Makefile 中设置：

```make
UWU_DEVICE_TYPE := phone
UWU_SUPPORTS_TELEPHONY := true

# 可选：设备维护者
UWU_MAINTAINER := Akaza_Akari

$(call inherit-product, vendor/uwu/config/common.mk)
```

设备类型和通信能力必须写在继承 `common.mk` 之前。

- `UWU_DEVICE_TYPE`：`phone`、`tablet` 或 `foldable`。
- `UWU_SUPPORTS_TELEPHONY`：支持移动通信填写 `true`，Wi-Fi 设备填写 `false`。
- `UWU_MAINTAINER`：最多 64 个字符，可用字母、数字、空格、点、下划线、连字符和 `@`。

`vendor/uwu` 没有 `common_full_phone.mk` 等变种，统一使用 `common.mk`。
设备原本需要的 AOSP 基础产品继承仍需保留。

## 构建

完成设备树修改后，在源码根目录选择产品并构建：

```bash
source build/envsetup.sh
lunch uwu_codename-cp2a-user
meow otapackage
```

构建产物位于 `out/target/product/<设备代号>/`。
刷入方式依设备而异，请使用对应设备的安装说明。

## 可选：Soong-only

开启 Soong-only 不是启动 uwuAOSP 的必要条件。

uwuCLI 可以转换固件镜像集成方式，并协助迁移内核构建。相关说明见：

- [Soong-only](soong-only.md)
- [从 legacy kernel build 迁移到 uwu_kernel](kernel/migration.md)
