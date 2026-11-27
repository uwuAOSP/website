<!--
SPDX-FileCopyrightText: The uwuAOSP Project
SPDX-License-Identifier: Apache-2.0
-->

<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { MNavigationDrawer, MNavigationDrawerItem } from 'material/vue'
import bookIcon from '@material-design-icons/svg/outlined/menu_book.svg?raw'
import appsIcon from '@material-design-icons/svg/outlined/apps.svg?raw'
import articleIcon from '@material-design-icons/svg/outlined/description.svg?raw'
import buildIcon from '@material-design-icons/svg/outlined/construction.svg?raw'
import kernelIcon from '@material-design-icons/svg/outlined/memory.svg?raw'
import languageIcon from '@material-design-icons/svg/outlined/language.svg?raw'

const { page } = useData()
const emit = defineEmits<{ navigate: [] }>()
const icon = (svg: string) => svg.replace('<svg ', '<svg fill="currentColor" ')

const groups = [
  { id: 'features', title: '功能说明', icon: icon(appsIcon), links: [
    { title: '应用与隐私', file: 'project-docs/features/privacy.md' },
    { title: '桌面与界面', file: 'project-docs/features/appearance.md' },
    { title: '应用音量', file: 'project-docs/features/audio.md' },
    { title: '智能建议', file: 'project-docs/features/suggestions.md' },
  ] },
  { id: 'tutorials', title: '实用教程', icon: icon(articleIcon), links: [
    { title: '更新系统', file: 'project-docs/tutorials/updates.md' },
    { title: '使用 Prism 提取文字和图片', file: 'project-docs/tutorials/prism.md' },
    { title: '选择后台运行策略', file: 'project-docs/tutorials/background.md' },
    { title: '使用外接屏桌面', file: 'project-docs/tutorials/external-desktop.md' },
  ] },
  { id: 'building', title: '构建与移植', icon: icon(buildIcon), links: [
    { title: '源码同步与 OTA 构建', file: 'building/index.md' },
    { title: '设备移植', file: 'building/bringup.md' },
    { title: 'Soong-only', file: 'building/soong-only.md' },
  ] },
  { id: 'kernel', title: 'uwu_kernel', icon: icon(kernelIcon), links: [
    { title: '概览', file: 'building/kernel/index.md' },
    { title: '内核迁移', file: 'building/kernel/migration.md' },
    { title: '配置参考', file: 'building/kernel/configuration.md' },
    { title: '故障排查', file: 'building/kernel/troubleshooting.md' },
  ] },
]
const docsIcon = icon(bookIcon)
const englishIcon = icon(languageIcon)

function href(file: string) {
  return withBase(`/${file.replace(/\/index\.md$/, '/').replace(/\.md$/, '.html')}`)
}
</script>

<template>
  <MNavigationDrawer
    :key="page.relativePath"
    class="docs-navigation"
    aria-label="文档目录"
    width="100%"
    :value="page.relativePath"
    open
    @change="emit('navigate')"
  >
    <MNavigationDrawerItem
      value="project-docs/index.md"
      label="项目文档"
      :href="href('project-docs/index.md')"
      :icon="docsIcon"
    />
    <MNavigationDrawerItem
      v-for="group in groups"
      :key="group.id"
      :value="group.id"
      :label="group.title"
      :icon="group.icon"
    >
      <MNavigationDrawerItem
        v-for="link in group.links"
        :key="link.file"
        :value="link.file"
        :label="link.title"
        :href="href(link.file)"
      />
    </MNavigationDrawerItem>
    <MNavigationDrawerItem
      value="project-docs/en/background.md"
      label="Background management"
      :href="href('project-docs/en/background.md')"
      :icon="englishIcon"
    />
  </MNavigationDrawer>
</template>
