/*
 * SPDX-FileCopyrightText: The uwuAOSP Project
 * SPDX-License-Identifier: Apache-2.0
 */

import { createScheme, Hct } from 'material/theme'

// Shared with uwuCLI/meow/view.go. The website interpolates the stops continuously.
export const logoColors = [
  '#8DE3FD', '#92D8FC', '#97CEFB', '#9BC3FB', '#A6CBFC', '#B1D3FC', '#BCDBFD',
]
export const brandSeed = logoColors[2]

const hex = (color: number) => `#${((color >>> 0) & 0xffffff).toString(16).padStart(6, '0')}`
const gradient = (colors: string[]) => `linear-gradient(100deg, ${colors.join(', ')})`

// Retain the source hues and chroma, with darker tones for a readable light-mode mark.
const lightLogo = logoColors.map((color, index) => {
  const source = Hct.fromInt(0xff000000 + Number.parseInt(color.slice(1), 16))
  return hex(Hct.from(source.hue, source.chroma, 30 + index * 1.5).toInt())
})

function tokens(mode: 'light' | 'dark') {
  const scheme = createScheme(brandSeed, { mode })
  const success = createScheme('#24784c', { mode })
  const caution = createScheme('#aa6b00', { mode })
  const roles = {
    primary: scheme.primary,
    onPrimary: scheme.onPrimary,
    primaryContainer: scheme.primaryContainer,
    onPrimaryContainer: scheme.onPrimaryContainer,
    primaryFixed: scheme.primaryFixed,
    primaryFixedDim: scheme.primaryFixedDim,
    onPrimaryFixed: scheme.onPrimaryFixed,
    onPrimaryFixedVariant: scheme.onPrimaryFixedVariant,
    secondary: scheme.secondary,
    onSecondary: scheme.onSecondary,
    secondaryContainer: scheme.secondaryContainer,
    onSecondaryContainer: scheme.onSecondaryContainer,
    tertiary: scheme.tertiary,
    onTertiary: scheme.onTertiary,
    tertiaryContainer: scheme.tertiaryContainer,
    onTertiaryContainer: scheme.onTertiaryContainer,
    error: scheme.error,
    onError: scheme.onError,
    errorContainer: scheme.errorContainer,
    onErrorContainer: scheme.onErrorContainer,
    successContainer: success.primaryContainer,
    onSuccessContainer: success.onPrimaryContainer,
    warningContainer: caution.primaryContainer,
    onWarningContainer: caution.onPrimaryContainer,
    surface: scheme.surface,
    surfaceDim: scheme.surfaceDim,
    surfaceBright: scheme.surfaceBright,
    surfaceContainerLowest: scheme.surfaceContainerLowest,
    surfaceContainerLow: scheme.surfaceContainerLow,
    surfaceContainer: scheme.surfaceContainer,
    surfaceContainerHigh: scheme.surfaceContainerHigh,
    surfaceContainerHighest: scheme.surfaceContainerHighest,
    surfaceVariant: scheme.surfaceVariant,
    onSurface: scheme.onSurface,
    onSurfaceVariant: scheme.onSurfaceVariant,
    outline: scheme.outline,
    outlineVariant: scheme.outlineVariant,
    shadow: scheme.shadow,
    scrim: scheme.scrim,
    inverseSurface: scheme.inverseSurface,
    inverseOnSurface: scheme.inverseOnSurface,
    inversePrimary: scheme.inversePrimary,
  }
  const colors = Object.entries(roles).map(([role, value]) =>
    `--mtrl-sys-color-${role.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}:${hex(value)};`,
  ).join('')
  return `${colors}--home-logo-gradient:${gradient(mode === 'dark' ? logoColors : lightLogo)};`
}

const light = tokens('light')
const dark = tokens('dark')

// Generate at build time: first paint has the palette, without client-side color generation.
export const brandThemeCss = `
:root { ${light} }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme-mode="light"]) { ${dark} }
}
:root[data-theme-mode="light"] { ${light} }
:root[data-theme-mode="dark"] { ${dark} }
`
export const lightSurface = hex(createScheme(brandSeed).surface)
