---
title: 构建与移植
---

<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

## 初始化

建议使用 uwuAOSP 的 Repo fork。否则，浅克隆中断后重试时，即使指定了 `--depth`，也可能拉取完整历史。

推荐使用发布清单：

```bash
repo init --repo-url=https://github.com/uwuAOSP/git-repo.git --repo-branch=main --no-repo-verify -u https://github.com/uwuAOSP/platform_vendor_uwu-versions.git -b main --git-lfs
```

也可以跟进开发分支：

> [!NOTE] 开发分支
> 开发分支可能不稳定。

```bash
repo init --repo-url=https://github.com/uwuAOSP/git-repo.git --repo-branch=main --no-repo-verify -u https://github.com/uwuAOSP/platform_manifests.git -b uwu-17.0 --git-lfs
```

## 同步源码

```bash
repo sync -c -j$(nproc --all) --force-sync --force-checkout --no-clone-bundle --no-tags --optimized-fetch --prune
```

## 设置构建环境

```bash
source build/envsetup.sh
lunch uwu_devicecode-cp2a-userdebug
```

> [!TIP] 新设备
> 首次移植请参考 [设备移植](bringup.md)。

## 构建 OTA 包

```bash
meow otapackage
```

## 相关文档

- [Soong-only](soong-only.md)
- [uwu_kernel](kernel/index.md)
