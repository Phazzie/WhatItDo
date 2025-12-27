# What It Do?

An elegant, modern polling application that lets you create intriguing suggestions and gather votes from friends. Built with Next.js 14, TypeScript, and a sophisticated design aesthetic.

## Features

### 🎭 Dual Polling Modes

**Classic Mode** - Standard polling for everyday suggestions
- Traditional Yes/No/Maybe voting options
- Perfect for group decisions and planning
- Clean, straightforward interface

**Adventurous Mode** - For more daring propositions
- Includes a special "BOLD" voting option for the courageous
- Anonymous voting with enigmatic presence names
- Enhanced visual styling with rose and violet accents
- Perfect for spontaneous adventures and intriguing suggestions

### ✨ Core Capabilities

- **Multiple Suggestions**: Create polls with up to 3 different options
- **Anonymous Voting**: Voters can remain anonymous or use custom names
- **Mystery Identities**: In Adventurous Mode, anonymous voters receive alluring mystery names like "A Whisper in the Dark" or "The Midnight Wanderer"
- **Comment System**: Add thoughts and context to each vote
- **Counter Proposals**: Voters can suggest their own alternatives
- **Real-time Results**: Live vote counting with visual progress bars
- **Email Notifications**: Poll creators receive notifications when votes are submitted
- **Auto-refresh**: Results page updates every 30 seconds
- **Share Options**: Easily share via link, SMS, or email

### 🎨 Design Philosophy

The application features an elegant, sophisticated aesthetic with:
- **Jewel-tone Color Palette**: Deep amethysts, velvet roses, sapphire blues, and champagne gold accents
- **Subtle Animations**: Floating headers, gentle pulses, tasteful glows
- **Glass-morphism Effects**: Frosted glass cards with elegant backdrops
- **Iridescent Accents**: Sophisticated gradient bars and borders
- **Responsive Design**: Beautiful on all device sizes

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom CSS
- **Database**: [Upstash Redis](https://upstash.com/) (REST API)
- **Email**: [Resend](https://resend.com/)
- **ID Generation**: [nanoid](https://github.com/ai/nanoid)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Upstash Redis account
- Resend account for email notifications

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd WhatItDo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Upstash Redis REST API
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

# Resend Email API
RESEND_API_KEY=your_resend_api_key

# Email address for poll notifications
POLL_CREATOR_EMAIL=your_email@example.com
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Guide

### Creating a Poll

1. **Choose Your Mode**: Select between Classic or Adventurous mode
2. **Add a Title** (optional): Give your poll a descriptive name
3. **Enter Suggestions**: Add 1-3 options for voting (at least one required)
4. **Create & Share**: Click the button to generate your unique poll link

### Voting on a Poll

1. **Open the Poll Link**: Navigate to the shared voting URL
2. **Add Your Name** (optional): Enter a name or remain anonymous
3. **Vote on Each Option**: Choose Yes, No, Maybe (or BOLD in Adventurous Mode)
4. **Add Comments** (optional): Share your thoughts on each suggestion
5. **Counter Proposal** (optional): Suggest your own alternative
6. **Submit**: Send your votes to the poll creator

### Viewing Results

- Access the results page from the link provided after poll creation
- See vote summaries with visual progress bars
- View individual responses with names and comments
- Check alternative suggestions from voters
- Page auto-refreshes every 30 seconds for live updates

## Project Structure

```
WhatItDo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── poll/route.ts      # Poll creation & retrieval
│   │   │   └── vote/route.ts      # Vote submission & email notifications
│   │   ├── results/[id]/
│   │   │   └── page.tsx           # Results viewing page
│   │   ├── vote/[id]/
│   │   │   └── page.tsx           # Voting interface
│   │   ├── page.tsx               # Home/poll creation
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css            # Global styles & theme
│   └── lib/
│       ├── redis.ts               # Redis client configuration
│       └── types.ts               # TypeScript type definitions
├── .env.example                   # Environment variables template
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

## Color Palette

The application uses an elegant, sophisticated color scheme:

### CSS Variables
```css
--velvet-rose: #d4526e        /* Warm, elegant rose */
--deep-sapphire: #2c3e95      /* Rich, deep blue */
--rich-amethyst: #8b5cf6      /* Vibrant purple */
--champagne-gold: #f4e4c1     /* Soft, luxurious gold */
--midnight-plum: #1a0f2e      /* Deep background purple */
--soft-pearl: #e8e0f5         /* Subtle light accent */
```

### Mode-Specific Colors

**Classic Mode**:
- Primary gradient: Violet → Purple → Cyan
- Accent: Violet tones

**Adventurous Mode**:
- Primary gradient: Rose → Purple → Violet
- Accent: Rose and violet tones

### Vote Colors
- **YES**: Green (#4ade80)
- **NO**: Red (#f87171)
- **MAYBE**: Yellow (#facc15)
- **BOLD**: Violet (#a78bfa)

## API Routes

### `POST /api/poll`
Create a new poll
```typescript
Request: {
  title: string
  suggestions: string[]
  mode: 'normal' | 'dubious'
}

Response: {
  id: string
}
```

### `GET /api/poll?id={pollId}`
Retrieve poll data
```typescript
Response: {
  poll: {
    id: string
    title: string
    suggestions: string[]
    mode: 'normal' | 'dubious'
    responses: Response[]
  }
}
```

### `POST /api/vote`
Submit votes for a poll
```typescript
Request: {
  pollId: string
  voterName: string
  votes: {
    text: string
    vote: 'yes' | 'no' | 'maybe' | 'yolo'
    comment: string
  }[]
  counterProposal?: string
}

Response: {
  success: boolean
}
```

## Data Models

### Poll Type
```typescript
type PollMode = 'normal' | 'dubious'

interface Poll {
  id: string
  title: string
  suggestions: string[]
  mode: PollMode
  responses: Response[]
  createdAt: string
}
```

### Response Type
```typescript
type VoteOption = 'yes' | 'no' | 'maybe' | 'yolo'

interface Vote {
  text: string
  vote: VoteOption
  comment: string
}

interface Response {
  id: string
  voterName: string
  votes: Vote[]
  counterProposal?: string
  submittedAt: string
}
```

## Email Notifications

When a vote is submitted, the poll creator receives an email containing:
- Voter's name (or mystery identity)
- All votes with comments
- Counter proposal (if provided)
- Special indicator if any BOLD votes were cast

## Customization

### Modifying Colors

Edit `src/app/globals.css` to change the color scheme:
```css
:root {
  --velvet-rose: #your-color;
  --deep-sapphire: #your-color;
  /* etc. */
}
```

### Adding Mystery Names

Edit the `MYSTERIOUS_NAMES` array in `src/app/vote/[id]/page.tsx`:
```typescript
const MYSTERIOUS_NAMES = [
  'Your Custom Name 1',
  'Your Custom Name 2',
  // Add more...
]
```

### Email Templates

Customize email content in `src/app/api/vote/route.ts`

## Performance Optimizations

- Server-side rendering for SEO and fast initial loads
- Automatic code splitting via Next.js
- Image optimization (if images are added)
- Redis for fast data storage and retrieval
- Auto-refresh with efficient polling intervals

## Browser Support

The application works best on modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

[Add your license here]

## Acknowledgments

- Design inspiration from modern glass-morphism and elegant UI trends
- Color palette inspired by jewel tones and sophisticated aesthetics
- Built with love for creating intriguing connections

---

Made with elegance and a touch of mystery ✨
