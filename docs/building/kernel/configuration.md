---
title: uwu_kernel 配置参考
appBarTitle: 内核配置
parent: /building/kernel/
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

以下配置用于手动调整迁移结果。常规迁移步骤见 [迁移指南](migration.md)。

## Kernel 和工具链

| 属性 | 用途 |
| --- | --- |
| `kernel_dir` | 相对 Android 源码根目录的 kernel 源码路径 |
| `kernel_arch` | Kbuild 架构，例如 `arm64` |
| `image_name` | `arch/<arch>/boot` 下的 kernel 文件名 |
| `clang_version` | `prebuilts/clang/host/linux-x86` 下的工具链版本 |
| `clang_path` | 自定义 Clang 目录，优先于 `clang_version` |
| `rust_version` | 可选的 Rust 工具链版本 |
| `make_flags` | 传给 Kbuild 的变量或参数 |
| `additional_flags` | 设备额外的 Kbuild 参数 |
| `environment` | `NAME=value` 格式的构建环境变量 |
| `build_jobs` | Kbuild 并行度 |

源码构建需要配置 `kernel_dir` 和 `image_name`。
未设置工具链版本时，优先使用 envsetup 导出的版本。

## Kconfig

```Android.bp
config: {
    defconfig: "gki_defconfig",
    fragments: [
        "vendor/common.config",
        "vendor/device.config",
    ],
    merge_at_once: true,
    overrides: [
        "CONFIG_EXAMPLE=y",
    ],
    lto: "thin",
},
```

`defconfig` 是基础配置，`fragments` 是补充配置，`overrides` 用于追加配置项。
`lto` 可选 `none`、`thin`、`full`。

不含 `/` 的配置名，以及 `vendor/` 开头的配置名，按 kernel 的 `arch/<架构>/configs/` 查找。
其他支持的路径可以相对 Android 源码根目录填写。

## DTB 和 DTBO

| 属性 | 用途 |
| --- | --- |
| `enabled` | 开启对应输出 |
| `target` | Kbuild 目标 |
| `image_name` | 输出文件名 |
| `input_globs` | 从 Kbuild 输出中收集 DT 文件 |
| `src` | 预编译 kernel 使用的 DTB／DTBO 输入 |
| `custom_command` | 标准流程未覆盖的自定义命令 |

`dtb.qcom_merge` 开启 Qualcomm DT merge，要求 DTB 和 DTBO 输出同时开启。
该模式通过 `dtb.target` 构建输入，再完成两类镜像的合并。

> [!NOTE] DTBO 专用选项
> `config` 和 `page_size` 用于 DTBO，不用于 DTB。`page_size` 默认 4096。

`custom_command` 可使用 `$(kernelDir)`、`$(kernelOut)` 和 `$(out)`。

## Modules

支持 `system_dlkm`、`vendor_dlkm`、`vendor_ramdisk` 和 `recovery` 四类安装位置。
每类同时配置 install list 与 load list：

```Android.bp
modules: {
    enabled: true,
    auto_collect_deps: true,
    install_strip: true,

    vendor_dlkm_module_install_list: ["modules.include.vendor_dlkm"],
    vendor_dlkm_module_load_list: ["modules.load.vendor_dlkm"],
},
```

每类还可以提供对应的 blocklist。
`vendor_dlkm_install_all` 可以将未安装到 `system_dlkm` 的已构建 modules 加入 `vendor_dlkm` 安装集合。
`module_aliases` 使用 `old_name.ko:new_name.ko` 格式。

External modules 的配置见 [迁移指南](migration.md#external-modules)。

## 预编译 kernel

`prebuilt` 指定预编译 kernel，跳过源码 Kbuild。
可配套提供 `prebuilt_config`、`prebuilt_headers` 和 `prebuilt_modules`；
它们仅用于预编译 kernel。

## 输出引用

其他 Soong 模块可以通过以下标签引用名为 `kernel` 的模块：

| 引用 | 输出 |
| --- | --- |
| `:kernel` | Kernel image |
| `:kernel{.config}` | 最终 kernel configuration |
| `:kernel{.dtb}` | DTB image |
| `:kernel{.dtbo}` | DTBO image |
| `:kernel{.modules}` | Kernel modules archive |

对应产物存在时，相关标签才可用。
Kernel headers 通过 generated headers 接口提供，现有 `generated_kernel_includes` 使用方式继续有效。

设备产品只需添加主模块，不需要添加内部 module installer。

## 其他配置

完整属性定义及构建入口位于：

```text
vendor/uwu/build/soong/kernel/kernel.go
```
