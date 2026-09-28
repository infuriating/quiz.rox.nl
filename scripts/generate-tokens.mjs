// Generates src/styles/tokens.css from design/tokens.json (the ROX Design System export).
// Run: npm run tokens
import { readFileSync, writeFileSync } from 'node:fs'

const t = JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url), 'utf8'))
const ref = (v) => String(v).replace(/\{([a-z0-9-]+)\}/g, 'var(--$1)')

const out = [
  '/* ROX design system tokens, generated 1:1 from the ROX Design System tokens.json.',
  '   Do not edit by hand: change the design system and regenerate. */',
  ':root {',
]
const section = (name) => out.push(`\n  /* ${name} */`)

section('colour')
for (const x of t.color.tokens) out.push(`  --${x.name}: ${ref(x.value)};`)

section('type')
out.push(`  --font-display: ${t.type.families.display};`)
out.push(`  --font-body: ${t.type.families.body};`)
for (const g of t.type.groups) {
  for (const s of g.styles) if (s.name.startsWith('text-')) out.push(`  --${s.name}: ${s.fontSize};`)
}

for (const group of ['spacing', 'radius', 'shadow', 'motion', 'other', 'fontWeight', 'lineHeight', 'letterSpacing']) {
  section(group)
  for (const x of t[group].tokens) out.push(`  --${x.name}: ${ref(x.value)};`)
}
out.push('}\n')

writeFileSync(new URL('../src/styles/tokens.css', import.meta.url), out.join('\n'))
console.log('Wrote src/styles/tokens.css')
