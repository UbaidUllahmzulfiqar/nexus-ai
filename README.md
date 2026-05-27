# Nexus AI

Nexus AI is a Next.js App Router SaaS for authenticated document upload, processing, chat, and workspace-scoped document management.

## Overview

- App Router + TypeScript frontend and server components
- Prisma v7 with PostgreSQL (Supabase pooler)
- NextAuth-based authentication with dev JWT bootstrap support
- Document upload, text extraction, persisted summaries, and document chat
- Workspace-scoped dashboard and document access controls

## Architecture

- `src/app` contains routes, layouts, API handlers, loading, and error states.
- `src/components/dashboard` contains reusable dashboard UI pieces.
- `src/lib` contains auth, Prisma, workspace resolution, document processing, and document chat helpers.
- `prisma/schema.prisma` defines users, workspaces, documents, conversations, and messages.

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL access

### Environment

Create a `.env` file with the required values:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
APP_JWT_SECRET=
ALLOW_DEV_BOOTSTRAP_CONTEXT=
GITHUB_ID=
GITHUB_SECRET=
DEFAULT_APP_USER_EMAIL=
DEFAULT_WORKSPACE_SLUG=
DEFAULT_WORKSPACE_NAME=
MAX_STORED_CONTENT_CHARS=
INTERNAL_AUTH_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
```

### Install and Run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Validation

```bash
npm run build
npm test
```

## Auth Notes

- `GET/POST /api/auth/[...nextauth]` handles NextAuth sessions.
- `POST /api/auth/login` is a dev-only JWT bootstrap route when `ALLOW_DEV_BOOTSTRAP_CONTEXT=true`.
- `src/lib/actor-context.ts` prefers NextAuth session tokens and falls back to bearer JWT or trusted headers for local workflows.

## Document Workflow

1. Upload a PDF at `/dashboard/upload`.
2. The upload API creates a document row and moves it through `UPLOADED -> PROCESSING -> COMPLETE` or `FAILED`.
3. Extracted content and summaries are stored in the database.
4. The dashboard lists workspace-scoped documents.
5. The document detail page shows metadata, extracted text, summary, and chat history.
6. The document chat API streams grounded answers using stored content.

## Deployment Notes

- Set production environment variables in Vercel or your host.
- Keep `ALLOW_DEV_BOOTSTRAP_CONTEXT=false` in production.
- Run `npx prisma db push` only against the intended PostgreSQL database.

## Release Notes

### Current Product State

- Authentication scaffold implemented
- Protected dashboard implemented
- Document processing and summaries implemented
- Document chat implemented
- Build and tests pass locally

### Remaining Production Work

- Billing / subscriptions
- Monitoring and rate limiting hardening
- Final UX polish
- Production deployment and release automation
