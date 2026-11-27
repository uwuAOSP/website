---
title: 从 legacy kernel build 迁移到 uwu_kernel
appBarTitle: 内核迁移
parent: /building/kernel/
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

## 使用 uwuCLI

在源码根目录运行：

```bash
uwu
```

按提示选择设备和内核迁移。uwuCLI 会读取现有配置并生成对应的 `uwu_kernel`。
有无法自动转换的项目时，按工具提示处理。

下面说明迁移后配置中几个主要部分的对应关系。

## Kernel

Legacy kernel build 通常使用：

```make
TARGET_KERNEL_SOURCE := kernel/<vendor>/<kernel>
TARGET_KERNEL_ARCH := arm64
BOARD_KERNEL_IMAGE_NAME := Image
```

迁移后由 `uwu_kernel` 模块声明：

```Android.bp
uwu_kernel {
    name: "kernel",

    kernel_dir: "kernel/<vendor>/<kernel>",
    kernel_arch: "arm64",
    image_name: "Image",
}
```

工具链和额外参数按设备需要设置，见 [配置参考](configuration.md)。

## Kernel configuration

例如原配置：

```make
TARGET_KERNEL_CONFIG := \
    gki_defconfig \
    vendor/device.config

TARGET_KERNEL_ADDITIONAL_FLAGS := \
    CONFIG_EXAMPLE=y
```

对应：

```Android.bp
additional_flags: [
    "CONFIG_EXAMPLE=y",
],

config: {
    defconfig: "gki_defconfig",
    fragments: [
        "vendor/device.config",
    ],
},
```

## DTB 和 DTBO

在 `uwu_kernel` 中声明设备需要的输出：

```Android.bp
dtb: {
    enabled: true,
    target: "dtbs",
    image_name: "dtb.img",
},

dtbo: {
    enabled: true,
    target: "dtbs",
    image_name: "dtbo.img",
    page_size: 4096,
},
```

> [!IMPORTANT] Qualcomm DT merge
> 在 `dtb` 中添加 `qcom_merge: true` 时，必须同时开启 `dtb.enabled` 和 `dtbo.enabled`。

## Kernel modules

每个需要安装 modules 的分区分别配置两份列表：

- **install list**：安装到这个分区的 modules。
- **load list**：其中需要加载的 modules。

load list 必须是 install list 的子集。

```Android.bp
modules: {
    enabled: true,
    auto_collect_deps: true,

    system_dlkm_module_install_list: ["modules.include.system_dlkm"],
    system_dlkm_module_load_list: ["modules.load.system_dlkm"],

    vendor_dlkm_module_install_list: ["modules.include.vendor_dlkm"],
    vendor_dlkm_module_load_list: ["modules.load.vendor_dlkm"],
},
```

uwuCLI 会转换现有 module 配置和它引用的静态列表。
`auto_collect_deps` 会补充安装列表中 modules 的依赖，不会从 load list 推断安装列表。

### External modules

独立于主 kernel tree 的 external modules 可以这样配置：

```Android.bp
modules: {
    enabled: true,
    external_module_root: "kernel/<vendor>/<device>-modules",
    external_modules: [
        "vendor/example",
    ],
},
```

普通条目使用 external module 自身的 Makefile。
需要通过主 kernel Kbuild 的 `M=` 模式构建时，使用 `"vendor/example:kbuild"`。

## 接入 Android build

在设备配置中选择 Soong kernel，并加入产品：

```make
BOARD_USES_SOONG_KERNEL := true
SOONG_KERNEL_MODULE := //device/<vendor>/<device>:kernel

PRODUCT_PACKAGES += kernel
```

将路径替换为实际定义模块的位置。
完成后按设备正常构建流程构建。

## 无法自动迁移的配置

自定义 DTB/DTBO Makefile、依赖旧输出路径的脚本，以及平台专用构建 wrapper，可能需要额外适配。
工具会指出不能转换的部分；共同需要但尚未支持的功能可以向项目反馈。

遇到具体构建问题，请看 [故障排查](troubleshooting.md)。
