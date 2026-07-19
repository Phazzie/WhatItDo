import { describe, expect, it } from 'vitest'
import type { PollResponse } from './types'
import { countVotes, summarizeVotes } from './results'

function response(vote: PollResponse['votes'][number]['vote']): PollResponse {
  return {
    voterName: 'Voter',
    submittedAt: 1,
    votes: [{ text: 'Plan', vote, comment: '' }],
  }
}

describe('result summaries', () => {
  it('counts each response without treating response order as rank', () => {
    expect(countVotes([response('no'), response('yes'), response('yes')], 0)).toEqual({
      yes: 2,
      maybe: 0,
      no: 1,
      yolo: 0,
    })
  })

  it('reports a real tie and proportional percentages', () => {
    const summary = summarizeVotes({ yes: 1, maybe: 1, no: 0, yolo: 0 }, false)
    expect(summary.verdict).toBe('Tie: YES + MAYBE')
    expect(summary.leaders).toEqual(['yes', 'maybe'])
    expect(summary.percentages.yes).toBe(50)
    expect(summary.percentages.maybe).toBe(50)
    expect(summary.percentages.no).toBe(0)
  })

  it('uses zero-width values and no invented leader when there are no responses', () => {
    const summary = summarizeVotes({ yes: 0, maybe: 0, no: 0, yolo: 0 }, true)
    expect(summary.verdict).toBe('Awaiting evidence')
    expect(summary.leaders).toEqual([])
    expect(Object.values(summary.percentages)).toEqual([0, 0, 0, 0])
  })

  it('excludes impossible YOLO values from a Classic denominator', () => {
    const summary = summarizeVotes({ yes: 1, maybe: 0, no: 1, yolo: 9 }, false)
    expect(summary.total).toBe(2)
    expect(summary.choices).toEqual(['yes', 'maybe', 'no'])
    expect(summary.percentages.yes).toBe(50)
  })
})
