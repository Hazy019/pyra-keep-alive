// scripts/verify-contrast.mjs — verifies WCAG contrast ratios for Pyra design tokens

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

function srgbToLinear(c) {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const checks = [
  {
    name: 'Text Dim on Light Background',
    bg: '#FBF9F6',
    fg: '#6F6862',
    minRatio: 4.5,
  },
  {
    name: 'Text Muted on Light Background',
    bg: '#FBF9F6',
    fg: '#6B6460',
    minRatio: 4.5,
  },
  {
    name: 'Primary Text on Light Background',
    bg: '#FBF9F6',
    fg: '#211D1A',
    minRatio: 7.0,
  },
  {
    name: 'White Text on Filled Button Accent',
    bg: '#C2410C',
    fg: '#FFFFFF',
    minRatio: 4.5,
  },
  {
    name: 'White Text on Filled Button Accent Hover',
    bg: '#9A3412',
    fg: '#FFFFFF',
    minRatio: 4.5,
  },
]

console.log('=== Pyra WCAG Contrast Verification ===\n')
let allPassed = true

for (const check of checks) {
  const ratio = contrastRatio(check.bg, check.fg)
  const passed = ratio >= check.minRatio
  if (!passed) allPassed = false

  console.log(
    `${passed ? '✓' : '✗'} ${check.name}:`,
    `${ratio.toFixed(2)}:1`,
    `(Target: >= ${check.minRatio}:1)`,
    `[${check.bg} vs ${check.fg}]`,
  )
}

console.log('\nResult:', allPassed ? 'All contrast checks PASSED (WCAG AA/AAA compliant).' : 'Some checks FAILED.')
if (!allPassed) process.exit(1)
