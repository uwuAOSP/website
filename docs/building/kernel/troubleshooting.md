---
title: uwu_kernel 故障排查
appBarTitle: 故障排查
parent: /building/kernel/
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

## 修改源码后没有重新编译

确认文件在 `kernel_dir` 或 `external_module_root` 指向的目录中。
目录之外的额外构建输入才需要通过 `srcs` 声明。

不要使用 `srcs: ["**/*"]` 展开整个源码树，这会增加构建图生成开销。

## External module 构建失败

确认 `external_module_root` 和 `external_modules` 路径正确。
如果 module 需要使用主 kernel 的 Kbuild，而不是自身 Makefile，给条目添加 `:kbuild`：

```Android.bp
external_modules: ["vendor/example:kbuild"],
```

## Module 未安装或未加载

- 未安装：查看对应分区的 install list。
- 已安装但未加载：查看 load list、blocklist 和启动日志。
- 构建提示 load list 不属于 install list：将需要安装的 module 加入该分区的 install list。

Install list 决定安装内容，load list 决定加载内容。`auto_collect_deps` 只补充安装依赖。

## DTB／DTBO 构建失败

检查对应输出是否启用，`target` 和 `input_globs` 是否符合 kernel 实际输出。
使用 `qcom_merge` 时，需要同时启用 DTB、DTBO。

## 配置没有得到预期结果

> [!TIP] 先看最终 `.config`
> Kconfig 的默认值处理可能影响最终结果，仅看 defconfig 或 fragment 无法判断实际生效的配置。
