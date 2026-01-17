# BSG Demo Platform - Frontend

React-based frontend application for the BSG Demo Platform.

## Technology Stack

- **React 18+** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing (if needed)
- **Axios** - HTTP client
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ContentViewer.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── Chatbot.tsx
│   │   ├── DemoFrame.tsx
│   │   ├── SettingsModal.tsx
│   │   └── ComingSoonModal.tsx
│   ├── pages/           # Page components
│   │   ├── HomePage.tsx
│   │   └── ComponentPage.tsx
│   ├── services/        # API services
│   │   └── api.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Features

- **Component-based Navigation** - Browse 6 different demo components
- **Content Viewer** - View presentation slides and documentation
- **Video Player** - Watch demonstration videos
- **Interactive Demos** - Connect to external demo systems
- **AI Chatbot** - Get answers about components
- **Dark/Light Theme** - Toggle between themes
- **Responsive Design** - Works on desktop and mobile

## API Integration

The frontend communicates with the backend API through the `apiService` in `src/services/api.ts`. All API calls follow the patterns defined in `design/api-specifications.md`.

## Styling

The application uses Tailwind CSS with a custom color scheme matching the reference design:
- Primary color: `#283054`
- Background (dark): `#0f172a`
- Background (light): `#F8FAFC`

## Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Keep components small and focused
- Follow the component API patterns from the design docs
- Write meaningful commit messages

