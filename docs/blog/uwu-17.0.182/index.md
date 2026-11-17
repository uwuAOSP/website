---
title: uwuAOSP 17.0.182
description: uwuAOSP 17.0.182
aside: false
outline: false
changelogBranch: uwu-17.0.182
---

<ReleaseBlog locale="zh-CN" mode="article" release="uwu-17.0.182" />

- 修复 uwuQS（环形）的标签、媒体播放卡片、亮度条的不正确行为

- 允许配置音量条在左侧
- 在平板的锁屏页面上滑时，现在会根据您的滑动位置自动选择将面板出现在左/中/右。
- 为分离式 QS 右上角的电池胶囊中的电池图标添加取色
- 支持 16:9 小窗
- 为小窗应用了 M3E 动画
有关小窗的视觉变更，请参考 https://b23.tv/aeQSDWd
- 修复了启动器搜索栏可能在关闭后异常出现的问题
- 移除多任务页面的屏幕截图按钮并替换为清除所有按钮。每个 App 的弹出菜单仍然支持进行截图。
- 添加 Superellipse 外形的图标
- 在搜索栏关闭时，清除为它预留的空间，这个在上面的视频里也一并演示了。
- 为 Google Apps 添加从 Pixel 中提取的主题图标
- 重写 uwuAppOps，现在您可以像管理正常权限一样对传感器、应用跳转、剪贴板进行管理，方法和您操作其他权限是一致的。
- 修复蓝牙连接后，连接的设备被折叠的问题
- 修复 uwuClock
- 现在 uwuAOSP 使用 hardware/lineage/interfaces 提供的 device_framework_matrix.xml，您无需再手动导入
- 移除 uni 的全树指纹检查，这大概会节省 40s 的启动时长
- uni TUI 已经重新设计

重要的上游变更：
- (LineageOS) 添加回中国广电 APN
