import { describe, expect, it } from 'vitest'
import { getVoteEmoji, getVoteColor, getVoteBgColor } from './voteDisplay'

describe('getVoteEmoji', () => {
  it('returns the correct emoji for each vote value', () => {
    expect(getVoteEmoji('yes')).toBe('✅')
    expect(getVoteEmoji('no')).toBe('❌')
    expect(getVoteEmoji('maybe')).toBe('🤔')
    expect(getVoteEmoji('yolo')).toBe('🎲')
  })

  it('returns an empty string for unknown/null/undefined values', () => {
    expect(getVoteEmoji('unknown')).toBe('')
    expect(getVoteEmoji(null)).toBe('')
    expect(getVoteEmoji(undefined)).toBe('')
    expect(getVoteEmoji('')).toBe('')
  })
})

describe('getVoteColor', () => {
  it('returns the correct text color class for each vote value', () => {
    expect(getVoteColor('yes')).toBe('text-green-400')
    expect(getVoteColor('no')).toBe('text-red-400')
    expect(getVoteColor('maybe')).toBe('text-yellow-400')
    expect(getVoteColor('yolo')).toBe('text-violet-400')
  })

  it('returns an empty string for unknown/null/undefined values', () => {
    expect(getVoteColor('unknown')).toBe('')
    expect(getVoteColor(null)).toBe('')
    expect(getVoteColor(undefined)).toBe('')
    expect(getVoteColor('')).toBe('')
  })
})

describe('getVoteBgColor', () => {
  it('returns the correct background color class for each vote value', () => {
    expect(getVoteBgColor('yes')).toBe('bg-green-500')
    expect(getVoteBgColor('no')).toBe('bg-red-500')
    expect(getVoteBgColor('maybe')).toBe('bg-yellow-500')
    expect(getVoteBgColor('yolo')).toBe('bg-gradient-to-r from-violet-500 to-rose-500')
  })

  it('falls back to gray for unknown/null/undefined values', () => {
    expect(getVoteBgColor('unknown')).toBe('bg-gray-500')
    expect(getVoteBgColor(null)).toBe('bg-gray-500')
    expect(getVoteBgColor(undefined)).toBe('bg-gray-500')
    expect(getVoteBgColor('')).toBe('bg-gray-500')
  })
})
