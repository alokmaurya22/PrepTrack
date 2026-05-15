# PrepTrack

A comprehensive web application for UPSC Civil Services aspirants to plan, track, and manage their entire preparation journey in one place.

## What it does

PrepTrack replaces the scattered tools (paper diaries, Google Drive, Excel sheets, sticky notes) that aspirants juggle. It provides:

- **Syllabus Tracker** — Map the full UPSC syllabus, mark topics as studied/revised
- **Study Planner** — Daily, weekly, and monthly planning with calendar view
- **Notes & Resources** — Rich text notes with TipTap editor, PDF viewer, resource storage
- **Test Tracker** — Log Prelims/Mains mock test scores and analyze performance
- **Current Affairs** — Track current affairs with tagging and revision cycles
- **Progress Dashboard** — Data-driven charts showing whether you're on track
- **PWA Support** — Installable as a desktop/mobile app, works offline

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui components |
| State | Zustand (global), TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Rich Text | TipTap editor |
| Backend | Supabase (Postgres, Auth, Storage) |
| Charts | Recharts |
| Routing | React Router v6 |
| Error Tracking | Sentry |

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your Supabase credentials before running.

## Build

```bash
npm run build      # production build
npm run preview    # preview production build locally
```

## Project Structure

```
src/
├── components/    # Reusable UI components
├── pages/         # Route-level page components
├── hooks/         # Custom React hooks
├── store/         # Zustand stores
├── lib/           # Supabase client, utilities
└── styles/        # Global styles
```
