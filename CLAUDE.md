# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PSUWorship is a worship team management app built with Next.js 16, featuring two main modules:
- **Harmony Trainer** (`/harmony`) - Real-time pitch detection for vocal harmony practice
- **Setlist Manager** (`/setlist`) - Import, manage, transpose, and export chord charts for worship services

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test framework is currently configured.

## Architecture

### Data Layer

**Local Storage (Dexie.js/IndexedDB):**
- `src/lib/db/index.ts` - Database schema with `songs` and `setlists` tables, CRUD helpers
- `src/lib/db/sync.ts` - Bidirectional Airtable sync service

**Cloud Sync (Airtable):**
- `src/lib/airtable/index.ts` - REST API client for Songs and Setlists tables
- Sync metadata stored in localStorage maps local IDs to Airtable record IDs
- Changes sync to Airtable in background after local writes

### Song Import Pipeline

1. User pastes Ultimate Guitar URL
2. `src/app/api/fetch-tab/route.ts` - Server-side scraper extracts JSON from UG page HTML
3. `src/lib/ultimateGuitar/parser.ts` - Parses `[ch]...[/ch]` chord markers into structured sections
4. Song stored in IndexedDB, synced to Airtable

### Chord Processing

- `src/lib/chords/transposition.ts` - Chord parsing and transposition (handles sharps/flats based on key)
- `src/lib/chords/nashville.ts` - Nashville number notation conversion
- Section types: intro, verse, chorus, bridge, pre-chorus, outro, instrumental, tag

### Key Data Models

```typescript
// Song sections contain lyrics with chord positions
interface ChordLine {
  lyrics: string;
  chords: ChordPosition[];  // { chord: "G", position: 12 }
}

// Setlists reference songs by ID with optional transposition
interface SetlistSong {
  songId: number;
  transposedKey?: string;
  order: number;
}
```

### PDF Export

`src/components/setlist/ExportModal.tsx` generates pamphlet-style PDFs using jsPDF with:
- Cover page with setlist info and optional Bible verse
- Chord charts with transposition applied
- Page layout optimized for folded pamphlet printing

## Environment Setup

Copy `.env.local.example` to `.env.local` and configure:

```
NEXT_PUBLIC_AIRTABLE_API_KEY=pat_your_api_key_here
NEXT_PUBLIC_AIRTABLE_BASE_ID=appKBJGb5ftWBZOH3
```

The Airtable base should have `Songs` and `Setlists` tables matching the field schemas in `src/lib/airtable/index.ts`.

## Key Patterns

- All pages use `'use client'` directive for client-side interactivity
- Sync module is lazy-loaded in `db/index.ts` to avoid circular dependencies
- Theme colors: cream (#fff7eb), navy (#003049), rust (#b45741), blue-grey (#7fa0af)
- Mobile-first responsive design with iOS Safari viewport fixes
