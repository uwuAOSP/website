/*
 * SPDX-FileCopyrightText: The uwuAOSP Project
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import '@fontsource-variable/google-sans'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource-variable/outfit'
import 'material/styles/base-elements'
import 'material/styles/typography'
import 'material/elements/preupgrade.css'
import './style.css'

export default {
  Layout,
} satisfies Theme
