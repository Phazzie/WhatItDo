export type PollMode = 'normal' | 'dubious'
export type VoteOption = 'yes' | 'no' | 'maybe' | 'yolo'

export interface Poll {
  id: string
  title: string
  suggestions: string[]
  creatorEmail: string
  createdAt: number
  responses: PollResponse[]
  mode: PollMode
}

export interface PollResponse {
  id: string
  voterName: string
  votes: {
    text: string
    vote: VoteOption
    comment: string
  }[]
  counterProposal?: string
  submittedAt: number
}
