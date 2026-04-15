import { getVoteEmoji, getVoteColor, escapeHtml } from '@/lib/utils'

describe('getVoteEmoji', () => {
  it('returns ✅ for yes', () => {
    expect(getVoteEmoji('yes')).toBe('✅')
  })
  it('returns ❌ for no', () => {
    expect(getVoteEmoji('no')).toBe('❌')
  })
  it('returns 🤔 for maybe', () => {
    expect(getVoteEmoji('maybe')).toBe('🤔')
  })
  it('returns 🎲 for yolo', () => {
    expect(getVoteEmoji('yolo')).toBe('🎲')
  })
  it('returns empty string for unknown vote', () => {
    expect(getVoteEmoji('unknown')).toBe('')
  })
})

describe('getVoteColor', () => {
  it('returns green for yes', () => {
    expect(getVoteColor('yes')).toBe('text-green-400')
  })
  it('returns red for no', () => {
    expect(getVoteColor('no')).toBe('text-red-400')
  })
  it('returns yellow for maybe', () => {
    expect(getVoteColor('maybe')).toBe('text-yellow-400')
  })
  it('returns violet for yolo', () => {
    expect(getVoteColor('yolo')).toBe('text-violet-400')
  })
  it('returns empty string for unknown vote', () => {
    expect(getVoteColor('unknown')).toBe('')
  })
})

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })
  it('escapes less-than sign', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })
  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })
  it('escapes multiple entities in one string', () => {
    expect(escapeHtml('<b class="x">AT&T</b>')).toBe(
      '&lt;b class=&quot;x&quot;&gt;AT&amp;T&lt;/b&gt;'
    )
  })
  it('returns unchanged string when no special chars', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})
