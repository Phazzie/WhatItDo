export type PollMode = 'normal' | 'dubious'
export type VoteOption = 'yes' | 'no' | 'maybe' | 'yolo'

/** The complete public voting contract. Do not add metadata to this DTO. */
export interface PublicPoll {
  title: string
  mode: PollMode
  suggestions: string[]
}

/** Stored poll metadata. Responses live in a separate bounded Redis list. */
export interface StoredPoll extends PublicPoll {
  id: string
  createdAt: number
  expiresAt: number
  resultsTokenHash: string
}

export interface PollVote {
  text: string
  vote: VoteOption
  comment: string
}

/** Internal response representation. The id is never included in results DTOs. */
export interface StoredPollResponse {
  id: string
  voterName: string
  votes: PollVote[]
  counterProposal?: string
  submittedAt: number
}

export type PollResponse = Omit<StoredPollResponse, 'id'>

/** Owner-only result data. It intentionally contains no poll/response ids or credentials. */
export interface PollResults extends PublicPoll {
  createdAt: number
  expiresAt: number
  responses: PollResponse[]
}

export type NotificationStatus = 'sent' | 'not_configured' | 'failed' | 'duplicate'

// Temporary source compatibility for UI code while it migrates to the exact DTOs.
export type Poll = PollResults
