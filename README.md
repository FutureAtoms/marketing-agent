# Marketing Hub

A comprehensive React Native marketing automation app with AI-powered content generation, CRM, email campaigns, and social media management.

## Features

### AI Content Generation
- Multi-provider AI support (Hugging Face, OpenAI, Anthropic)
- Social media captions for Twitter, LinkedIn, Facebook, Instagram
- Blog post generation with keyword optimization
- Email subject line suggestions
- Ad copy for Google, Facebook, Instagram
- Landing page copy generation
- Content strategy planning

### CRM (Customer Relationship Management)
- Contact management
- Deal tracking and pipeline management
- Customer segmentation

### Email Marketing
- Email template builder
- Audience segmentation
- Campaign management

### Social Media Management
- Post scheduling and queue
- Multi-platform posting
- Social authentication (OAuth)
- Real-time updates

### Analytics & Testing
- Marketing analytics dashboard
- A/B testing capabilities
- Performance tracking

## Tech Stack

- **Framework**: Expo / React Native
- **UI**: Tamagui
- **State Management**: Zustand, TanStack Query
- **Backend**: Supabase
- **AI Providers**: Hugging Face, OpenAI, Anthropic
- **Testing**: Jest, Playwright

## Getting Started

### Prerequisites
- Node.js
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FutureAtoms/marketing-agent.git
cd marketing-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` from `.env.example` and configure:
- Supabase credentials
- AI provider API keys (optional - supports multiple providers)

4. Start the development server:
```bash
npm run dev
```

## Scripts

- `npm start` - Start Expo development server
- `npm run dev` - Start web development
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests
- `npm run test:coverage` - Run tests with coverage

## License

Private
