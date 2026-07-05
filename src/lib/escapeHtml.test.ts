import { describe, expect, it } from 'vitest'
import { escapeHtml } from './escapeHtml'

describe('escapeHtml', () => {
  it('escapes an XSS payload so it cannot execute as markup', () => {
    const input = '<img src=x onerror=alert(1)>'
    const result = escapeHtml(input)

    expect(result).not.toContain('<img')
    expect(result).toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('escapes ampersands, quotes, and apostrophes', () => {
    expect(escapeHtml(`Tom & Jerry's "great" day`)).toBe(
      'Tom &amp; Jerry&#39;s &quot;great&quot; day'
    )
  })

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Pizza night')).toBe('Pizza night')
  })
})
