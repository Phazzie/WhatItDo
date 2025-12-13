export interface Comment {
  id: string
  text: string
  author: string
  timestamp: number
}

export interface Suggestion {
  id: string
  text: string
  category: string
  votes: {
    yes: number
    no: number
    maybe: number
  }
  comments: Comment[]
}

export const defaultSuggestions: Suggestion[] = [
  {
    id: '1',
    text: "Text your ex at 2am to tell them you've 'grown as a person'",
    category: "Relationship Advice",
    votes: { yes: 12, no: 45, maybe: 23 },
    comments: []
  },
  {
    id: '2',
    text: "Quit your job to become a professional hot dog eating contestant",
    category: "Career Moves",
    votes: { yes: 34, no: 28, maybe: 18 },
    comments: []
  },
  {
    id: '3',
    text: "Adopt 17 cats and refer to yourself as their 'regional manager'",
    category: "Life Goals",
    votes: { yes: 67, no: 12, maybe: 31 },
    comments: []
  },
  {
    id: '4',
    text: "Start every meeting by standing up and saying 'Let's get this bread'",
    category: "Professional Development",
    votes: { yes: 89, no: 5, maybe: 16 },
    comments: []
  },
  {
    id: '5',
    text: "Respond to all work emails with only GIFs for an entire week",
    category: "Career Moves",
    votes: { yes: 45, no: 38, maybe: 27 },
    comments: []
  },
  {
    id: '6',
    text: "Tell everyone you're 'finding yourself' while binge-watching reality TV",
    category: "Self-Improvement",
    votes: { yes: 72, no: 15, maybe: 33 },
    comments: []
  },
  {
    id: '7',
    text: "Add 'CEO of My Couch' to your LinkedIn profile",
    category: "Professional Development",
    votes: { yes: 56, no: 22, maybe: 42 },
    comments: []
  },
  {
    id: '8',
    text: "Learn to play the recorder and perform unsolicited concerts for neighbors",
    category: "Hobbies",
    votes: { yes: 23, no: 67, maybe: 20 },
    comments: []
  },
  {
    id: '9',
    text: "Start a podcast about your hot takes on minor inconveniences",
    category: "Creative Pursuits",
    votes: { yes: 41, no: 35, maybe: 34 },
    comments: []
  },
  {
    id: '10',
    text: "Wear a cape to the grocery store 'just to see what happens'",
    category: "Life Goals",
    votes: { yes: 78, no: 8, maybe: 24 },
    comments: []
  }
]
