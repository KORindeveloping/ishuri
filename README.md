# TVET Mastery Pro

A comprehensive learning platform for TVET students, featuring AI-powered tutors, course planners, and quiz generation.

## Project Structure

- `/` - Frontend (React + Vite + TypeScript)
- `/backend` - Backend (Node.js + Express + Prisma + PostgreSQL)
- `/public/Courselesson` - Library of official course documents (PDFs)

## Getting Started

### Prerequisites

- Node.js (>= 18.0.0)
- PostgreSQL (or any database supported by Prisma)

### Local Setup

1. **Install all dependencies** (Frontend & Backend):
   ```bash
   npm run install:all
   ```

2. **Environment Variables**:
   - Create a `.env` file in the **root** directory (see `.env.example`).
   - Create a `.env` file in the **backend** directory (see `backend/.env.example`).
   - Ensure you set `DATABASE_URL` and `GEMINI_API_KEY`.

3. **Database Setup**:
   ```bash
   cd backend
   npx prisma db push
   ```

4. **Run the application**:
   - To run both frontend and backend together:
     ```bash
     npm run dev:full
     ```
   - Or run them separately:
     - Frontend: `npm run dev`
     - Backend: `npm run dev:backend`

## Features

- **AI Academic Planner**: Generates personalized study roadmaps and syllabi.
- **AI Tutor (Copilot)**: Real-time assistance and deep dives into specific topics.
- **Dynamic Quiz Generation**: AI-generated MCQs based on trade and subject.
- **Portfolio Management**: Upload and manage evidence of learning.
- **Official Library**: Access to Level 1 course documents for various subjects.

## Technologies

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Prisma ORM, Socket.IO.
- **AI**: Google Gemini API, Anthropic Claude API (optional).
- **Database**: PostgreSQL.
