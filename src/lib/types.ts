export interface Poll {
  id: string
  title: string
  suggestions: string[]
  creatorEmail: string
  createdAt: number
  responses: PollResponse[]
}

export interface PollResponse {
  id: string
  voterName: string
  votes: {
    text: string
    vote: 'yes' | 'no' | 'maybe'
    comment: string
  }[]
  submittedAt: number
}
