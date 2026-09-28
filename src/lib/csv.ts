function cell(v: string | number | boolean | null | undefined): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: Array<Array<string | number | boolean | null | undefined>>): string {
  // BOM so Excel opens UTF-8 (accents in names) correctly.
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
