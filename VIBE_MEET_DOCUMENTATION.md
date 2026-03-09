# 🎥 VibeMeet — Project Documentation
### A Minimalist, High-Quality Video Conferencing App
> Built with React · LiveKit Cloud · Vercel · GitHub Pages · Zero Cost · No Signup

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [How The Magic Works](#4-how-the-magic-works)
5. [Adaptive Video Quality System](#5-adaptive-video-quality-system)
6. [File & Folder Structure](#6-file--folder-structure)
7. [UI & Design System](#7-ui--design-system)
8. [Screen-by-Screen Breakdown](#8-screen-by-screen-breakdown)
9. [Features Specification](#9-features-specification)
10. [LiveKit Cloud Setup](#10-livekit-cloud-setup)
11. [Token Architecture](#11-token-architecture)
12. [Deployment Guide](#12-deployment-guide)
13. [Free Tier Limits & Monitoring](#13-free-tier-limits--monitoring)
14. [Performance Optimisations](#14-performance-optimisations)
15. [Accessibility & Responsiveness](#15-accessibility--responsiveness)
16. [Environment Variables](#16-environment-variables)
17. [Development Workflow](#17-development-workflow)
18. [Known Constraints & Mitigations](#18-known-constraints--mitigations)

---

## 1. Project Overview

**VibeMeet** is a zero-signup, code-based video conferencing web application. A host generates a 6-character room code, shares it, and all participants join instantly. No accounts, no downloads, no credit card.

### Goals

| Goal | Detail |
|------|--------|
| Zero friction | No signup, no install, share a 6-char code |
| Google Meet-level quality | Adaptive bitrate, simulcast, SFU architecture |
| Minimal & beautiful UI | Art-inspired design, not generic AI-generated look |
| Max 5 participants per room | Keeps bandwidth manageable within free tier |
| Fully free | LiveKit Cloud free tier + Vercel free tier |
| Fully responsive | Mobile, tablet, desktop — all screen sizes |
| Smooth network handling | Auto-degrade to audio, auto-recover video |

---

## 2. Technology Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool (fast HMR, optimised bundles) |
| `@livekit/components-react` | Latest | LiveKit React component library |
| `livekit-client` | Latest | Core WebRTC SDK |
| CSS Modules + CSS Variables | — | Styling (zero external CSS library) |
| React Router | v6 | Client-side routing |

### Backend (Serverless — Vercel Functions)
| Tool | Purpose |
|------|---------|
| Vercel Serverless Functions | Token generation endpoint |
| `livekit-server-sdk` (Node) | JWT token creation |

### Infrastructure
| Service | Role | Cost |
|---------|------|------|
| LiveKit Cloud (Build Plan) | SFU media server | Free |
| Vercel | Frontend hosting + token API | Free |
| GitHub | Source control + CI/CD | Free |

### Total monthly cost: **$0.00**

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                       │
│                                                         │
│   React App (Vite)                                      │
│   ┌────────────┐    ┌─────────────┐   ┌─────────────┐  │
│   │ Landing    │    │ Setup Panel │   │ Conference  │  │
│   │ (Start /   │───▶│ (Mic + Cam  │──▶│ Room        │  │
│   │  Join)     │    │  preview)   │   │ (LiveKit)   │  │
│   └────────────┘    └─────────────┘   └──────┬──────┘  │
└──────────────────────────────────────────────┼──────────┘
                                               │ WebRTC
                    ┌──────────────────────────┼──────────┐
                    │   VERCEL SERVERLESS       │          │
                    │                          │          │
                    │   /api/token  ◀──────────┘          │
                    │   (livekit-server-sdk)               │
                    │   Generates JWT token                │
                    └──────────────┬───────────────────────┘
                                   │ HTTPS token request
                    ┌──────────────▼───────────────────────┐
                    │   LIVEKIT CLOUD (Free Tier SFU)      │
                    │                                      │
                    │   • Receives all video streams       │
                    │   • Intelligently routes per user    │
                    │   • Simulcast layer selection        │
                    │   • Adaptive bitrate per subscriber  │
                    │   • No STUN/TURN required            │
                    └──────────────────────────────────────┘
```

### Why This Architecture Is Optimal

- **No STUN/TURN needed** — LiveKit Cloud has public IPs, all browsers connect directly to it
- **SFU not P2P** — each browser uploads once to LiveKit, LiveKit routes to all others; peer-to-peer mesh falls apart at 3+ participants
- **Token on serverless** — API keys never exposed to the browser; Vercel functions are free and cold-start in ~100ms
- **Room codes only** — no database required; LiveKit rooms are created on-demand by room name

---

## 4. How The Magic Works

### Room Code Flow

```
HOST                        VERCEL API              LIVEKIT CLOUD
  │                              │                        │
  │─── POST /api/token ─────────▶│                        │
  │    { room: "XK92PL",         │                        │
  │      identity: "user_abc" }  │                        │
  │                              │── creates JWT token ──▶│
  │◀── { token, wsUrl } ────────│                        │
  │                              │                        │
  │─── WebSocket connect ───────────────────────────────▶│
  │    (using token)             │                        │
  │                              │                        │
  │  [Room "XK92PL" is now live] │                        │
  │                              │                        │

GUEST
  │─── POST /api/token ─────────▶│
  │    { room: "XK92PL",         │
  │      identity: "user_xyz" }  │
  │                              │── JWT for same room ──▶│
  │◀── { token, wsUrl } ────────│                        │
  │                              │                        │
  │─── WebSocket connect ───────────────────────────────▶│
  │    LiveKit notifies host     │                        │
  │    Both can see each other   │                        │
```

### Room Code Generation

```javascript
// Generate a memorable 6-character alphanumeric code
// Uses only unambiguous characters (no 0/O, 1/I/l confusion)
const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};
```

---

## 5. Adaptive Video Quality System

This is the most critical feature. Here is exactly how it works under the hood.

### LiveKit's Three-Layer System

When a participant publishes video, LiveKit automatically sends **three simultaneous streams (Simulcast)**:

| Layer | Resolution | Bitrate | Use Case |
|-------|------------|---------|----------|
| High | 720p | ~1200 kbps | Full screen / good network |
| Medium | 360p | ~500 kbps | Normal tile view |
| Low | 180p | ~150 kbps | Thumbnail / poor network |

### AdaptiveStream (Client-Side Intelligence)

```javascript
// Enable in RoomOptions — this is the key setting
const room = new Room({
  adaptiveStream: true,   // Auto-selects layer based on element size + bandwidth
  dynacast: true,         // Pauses layers nobody is watching (saves bandwidth)
  publishDefaults: {
    simulcast: true,      // Publish all 3 layers simultaneously
    videoSimulcastLayers: [
      VideoPresets.h720,  // High
      VideoPresets.h360,  // Medium
      VideoPresets.h180,  // Low
    ],
  },
});
```

**What AdaptiveStream does automatically:**
- If a video element is small (thumbnail), it requests the Low layer
- If a video element is large (speaker view), it requests the High layer
- If network degrades, it downgrades to a lower layer seamlessly
- If the element is hidden or off-screen, it **pauses the stream entirely** (saves bandwidth)

### Network Quality Detection & Audio-Only Fallback

```javascript
// Monitor connection quality every 2 seconds
room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
  if (quality === ConnectionQuality.Poor) {
    // Step 1: Drop to lowest video layer (automatic via AdaptiveStream)
    // Step 2: If still poor after 5 seconds, disable video entirely
    scheduleVideoDisable(participant, 5000);
  }

  if (quality === ConnectionQuality.Excellent || 
      quality === ConnectionQuality.Good) {
    // Auto re-enable video when network recovers
    cancelVideoDisable(participant);
    restoreVideo(participant);
  }
});
```

### Network Degradation Ladder

```
NETWORK STATE          ACTION
─────────────────────────────────────────────────────────
Excellent (>2 Mbps)  → 720p HD video, all participants
Good (500kbps-2Mbps) → 360p video, normal experience  
Poor (150-500kbps)   → 180p low-res, audio prioritised
Very Poor (<150kbps) → Audio only, video track paused
Reconnecting         → Show spinner, keep audio alive
Recovered            → Auto-resume video, no user action
```

### Dynacast — The Bandwidth Saver

- If 3 people are in a room and 2 are showing as thumbnails, the High layer for those 2 is **automatically paused at the source**
- The publisher doesn't even upload 720p if nobody needs it
- This alone reduces bandwidth by 40-60% in multi-person calls

---

## 6. File & Folder Structure

```
vibemeet/
├── public/
│   ├── favicon.svg              # Custom logo mark
│   └── og-image.png             # Social share preview
│
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Router setup
│   │
│   ├── pages/
│   │   ├── Landing.jsx          # Start / Join screen
│   │   └── Room.jsx             # Conference room screen
│   │
│   ├── components/
│   │   ├── SetupPanel/
│   │   │   ├── SetupPanel.jsx   # Pre-join permissions + preview
│   │   │   └── SetupPanel.module.css
│   │   │
│   │   ├── Conference/
│   │   │   ├── VideoGrid.jsx    # Auto-layout video tiles
│   │   │   ├── VideoTile.jsx    # Single participant tile
│   │   │   ├── ControlBar.jsx   # Mic/Cam/Screen/Leave controls
│   │   │   ├── NetworkBadge.jsx # Quality indicator per tile
│   │   │   └── ViewToggle.jsx   # Grid / Speaker / Sidebar views
│   │   │
│   │   └── UI/
│   │       ├── Button.jsx       # Reusable button component
│   │       ├── CodeDisplay.jsx  # Styled room code display
│   │       └── Spinner.jsx      # Loading state
│   │
│   ├── hooks/
│   │   ├── useRoom.js           # LiveKit room connection logic
│   │   ├── useNetworkQuality.js # Network monitoring + fallback
│   │   └── useParticipants.js   # Participant list management
│   │
│   ├── utils/
│   │   ├── roomCode.js          # Code generation + validation
│   │   └── token.js             # Token fetch from API
│   │
│   └── styles/
│       ├── global.css           # CSS reset + variables
│       └── tokens.css           # Design tokens (colours, spacing)
│
├── api/
│   └── token.js                 # Vercel serverless function
│
├── .env.local                   # Local secrets (gitignored)
├── .env.example                 # Template for environment vars
├── vercel.json                  # Vercel config + API routes
├── vite.config.js               # Vite build config
├── package.json
└── README.md
```

---

## 7. UI & Design System

### Design Philosophy

The visual identity is inspired by **brutalist minimalism meets spatial computing** — think Figma's dark mode meets an art gallery. No rounded-corner card soup, no gradient buttons everywhere, no Material Design clones.

### Colour Palette

```css
:root {
  /* Backgrounds — near-black with warm undertone */
  --bg-base:        #0A0A0B;   /* Page background */
  --bg-surface:     #111114;   /* Card / panel backgrounds */
  --bg-elevated:    #1A1A1F;   /* Hover states, active controls */

  /* Foregrounds */
  --fg-primary:     #F2F2F0;   /* Primary text — warm white */
  --fg-secondary:   #8A8A8E;   /* Muted text, labels */
  --fg-disabled:    #3A3A3F;   /* Inactive elements */

  /* Accent — a single, restrained accent colour */
  --accent:         #5B6EF5;   /* Indigo — used sparingly */
  --accent-hover:   #7080FF;

  /* Semantic */
  --red:            #E05454;   /* Mic off, leave, errors */
  --green:          #52C97C;   /* Network good indicator */
  --amber:          #F5A623;   /* Network warning */

  /* Video tile */
  --tile-bg:        #16161A;
  --tile-border:    #252530;
}
```

### Typography

```css
/* Single font family — variable weight for elegance */
font-family: 'Inter Variable', system-ui, -apple-system, sans-serif;

--text-xs:    11px;   /* Labels, badges */
--text-sm:    13px;   /* Secondary info */
--text-base:  15px;   /* Body text */
--text-lg:    18px;   /* Section headings */
--text-xl:    28px;   /* Room code display */
--text-hero:  52px;   /* Landing page headline */
```

### Spacing System

```css
/* 4px base unit */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-6:  24px;
--space-8:  32px;
--space-12: 48px;
--space-16: 64px;
```

### Motion

```css
/* Subtle, purposeful animation only */
--transition-fast:   120ms ease;
--transition-base:   220ms ease;
--transition-slow:   400ms cubic-bezier(0.16, 1, 0.3, 1);

/* Spring easing for tiles entering/leaving */
--spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 8. Screen-by-Screen Breakdown

### Screen 1 — Landing Page

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                    [ Logo mark ]                     │
│                                                      │
│              VibeMeet                                │
│       Meet without the noise.                        │
│                                                      │
│                                                      │
│         ┌─────────────────────┐                     │
│         │   Start a meeting   │  ← Primary button   │
│         └─────────────────────┘                     │
│                                                      │
│         ┌─────────────────────┐                     │
│         │   [ Enter code  ]   │  ← Input + Join btn │
│         └─────────────────────┘                     │
│                                                      │
│   No account. No download. Just the meeting.         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Behaviour:**
- Start → generates a 6-char code + navigates to `/room/XK92PL?host=true`
- Join → validates the code format → navigates to `/room/XK92PL`
- Code input: auto-uppercase, auto-format with hyphen after 3 chars (XK9-2PL)

---

### Screen 2 — Setup Panel (Pre-join)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌─────────────────────┐   ┌──────────────────────┐ │
│  │                     │   │  Check your setup    │ │
│  │   [Camera preview]  │   │                      │ │
│  │   Live self-view    │   │  Name                │ │
│  │                     │   │  ┌────────────────┐  │ │
│  └─────────────────────┘   │  │ Anonymous_7291 │  │ │
│                             │  └────────────────┘  │ │
│  🎤 Microphone: On          │                      │ │
│  📷 Camera:     On          │  Room: XK9-2PL       │ │
│                             │                      │ │
│  [  🎤  ]  [  📷  ]         │  ┌────────────────┐  │ │
│                             │  │  Join meeting  │  │ │
│                             │  └────────────────┘  │ │
│                             └──────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Behaviour:**
- Immediately requests camera and mic permissions
- If denied, shows a helpful guide with browser-specific instructions
- Camera preview uses local stream (no LiveKit connection yet — zero API cost)
- Name field: auto-generates anonymous name, user can edit
- Only connects to LiveKit when "Join meeting" is pressed

---

### Screen 3 — Conference Room

#### Grid View (default, 2–5 participants)

```
┌──────────────────────────────────────────────────────┐
│  VibeMeet    XK9-2PL  [Copy]           [⚙]  [Leave] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │            │  │            │  │            │    │
│  │  Alice     │  │  Bob       │  │  Carol     │    │
│  │            │  │            │  │            │    │
│  │   🟢 good  │  │   🟡 fair  │  │   🔴 poor  │    │
│  └────────────┘  └────────────┘  └────────────┘    │
│                                                      │
│       ┌────────────┐  ┌────────────┐               │
│       │            │  │            │               │
│       │  Dave      │  │  You       │               │
│       │            │  │            │               │
│       └────────────┘  └────────────┘               │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [🎤 Mute]  [📷 Stop]  [🖥 Share]  [⊞ View]        │
└──────────────────────────────────────────────────────┘
```

#### Speaker View (active speaker highlighted)

```
┌──────────────────────────────────────────────────────┐
│  VibeMeet    XK9-2PL  [Copy]           [⚙]  [Leave] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │              ALICE  (speaking)               │   │
│  │              Large primary tile              │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ Bob  │  │Carol │  │ Dave │  │ You  │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [🎤 Mute]  [📷 Stop]  [🖥 Share]  [⊞ View]        │
└──────────────────────────────────────────────────────┘
```

---

## 9. Features Specification

### Core Features

#### 9.1 Room Management
- `generateRoomCode()` — produces a 6-char unambiguous alphanumeric code
- Rooms exist only while participants are in them — no database needed
- Maximum 5 participants enforced client-side (LiveKit can hold more but we cap at 5)
- Room code displayed in header with one-click copy

#### 9.2 Camera & Microphone Controls

| Control | Button State | Behaviour |
|---------|-------------|-----------|
| Mic ON | Active (default) | Publishing audio |
| Mic OFF | Red / muted icon | Track muted (not unpublished — faster to re-enable) |
| Camera ON | Active (default) | Publishing video |
| Camera OFF | Red / camera-slash icon | Track muted + shows avatar/initials |
| Keyboard shortcut | `M` = mic, `V` = camera | Standard meeting shortcuts |

#### 9.3 Screen Sharing
- Uses `getDisplayMedia()` — native browser API
- Screen share replaces camera tile for the sharing participant
- Other participants see a full-width screen share tile automatically
- Only one person can share at a time (enforced)
- "You are sharing your screen" indicator shown to sharer

#### 9.4 View Modes
Three layouts toggled by the View button:

| Mode | Layout | Best For |
|------|--------|---------|
| **Grid** | Equal tiles, CSS Grid auto-fill | 2–5 participants, casual meetings |
| **Speaker** | 1 large + small strip | Presentations, lectures |
| **Sidebar** | Large main + vertical sidebar | Screen share sessions |

Auto-switches to Speaker view when screen sharing is active.

#### 9.5 Network Quality Indicator
Small coloured dot on each video tile:
- 🟢 Green = Excellent
- 🟡 Amber = Good/Fair
- 🔴 Red = Poor (audio-only mode activating)
- ⚪ Grey = Unknown/Connecting

#### 9.6 Auto Audio-Only Mode
```
When ConnectionQuality = Poor for > 5 seconds:
  1. Video track is muted (not destroyed — reconnects faster)
  2. Tile shows a pulsing audio waveform visualiser instead
  3. Small "📶 Audio only" badge appears on the tile
  4. When quality improves → video resumes automatically
  5. No user action required at any point
```

#### 9.7 Permissions & Setup Panel
- Camera and mic permissions requested on setup panel (before joining room)
- If permission denied: friendly modal with step-by-step browser guide
- Device selection: if multiple cameras/mics, user can choose from dropdown
- Preview: live camera feed shown before joining so user checks their appearance

---

## 10. LiveKit Cloud Setup

### Step 1 — Create Free Account
1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Sign up with GitHub or email — **no credit card required**
3. Create a new project (free Build plan)

### Step 2 — Get Credentials
From the LiveKit Cloud dashboard:
```
LIVEKIT_API_KEY=     APInXXXXXXXXXXXX
LIVEKIT_API_SECRET=  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
LIVEKIT_WS_URL=      wss://your-project.livekit.cloud
```

### Step 3 — Configure Room Settings (Dashboard)
Recommended settings for this project:
```
Max participants per room: 5
Empty room timeout: 5 minutes
Video codec: VP8 (broadest compatibility) 
Simulcast: Enabled
Adaptive stream: Enabled
```

---

## 11. Token Architecture

Tokens are JWTs signed with your LiveKit API secret. They must be generated server-side — never in the browser.

### Vercel Serverless Function (`/api/token.js`)

```javascript
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomName, participantName } = req.body;

  // Basic validation
  if (!roomName || !participantName) {
    return res.status(400).json({ error: 'Missing roomName or participantName' });
  }

  // Validate room code format (6 alphanumeric chars)
  if (!/^[A-Z0-9]{6}$/.test(roomName)) {
    return res.status(400).json({ error: 'Invalid room code' });
  }

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: participantName,
      ttl: '2h', // Token expires in 2 hours
    }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return res.status(200).json({
    token: await token.toJwt(),
    wsUrl: process.env.LIVEKIT_WS_URL,
  });
}
```

### Why This Is Secure
- API secret **never leaves the server**
- Token is scoped to a specific room
- Token expires in 2 hours
- No room is "created" in advance — LiveKit creates rooms on first join

---

## 12. Deployment Guide

### Prerequisites
- Node.js 18+
- A GitHub account
- A Vercel account (free, no card)
- A LiveKit Cloud account (free, no card)

### Step 1 — Clone & Install

```bash
git clone https://github.com/yourusername/vibemeet
cd vibemeet
npm install
```

### Step 2 — Environment Variables

Create `.env.local`:
```bash
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
VITE_LIVEKIT_WS_URL=wss://your-project.livekit.cloud
```

The `VITE_` prefix exposes the WS URL to the frontend (it's public — just a WebSocket endpoint, not a secret).

### Step 3 — Run Locally

```bash
npm run dev
# App runs at http://localhost:5173
# Vercel functions need: npx vercel dev (runs at http://localhost:3000)
```

### Step 4 — Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables via Vercel dashboard:
# Settings → Environment Variables → Add:
#   LIVEKIT_API_KEY
#   LIVEKIT_API_SECRET
#   VITE_LIVEKIT_WS_URL
```

Or connect GitHub repo to Vercel for automatic deployments on every push.

### Step 5 — Vercel Configuration (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/token.js": {
      "maxDuration": 10
    }
  }
}
```

### Step 6 — Custom Domain (Optional, Free)
Vercel gives you `vibemeet.vercel.app` for free. You can also connect a custom domain if you have one.

---

## 13. Free Tier Limits & Monitoring

### LiveKit Cloud Free Tier Summary

| Resource | Free Allowance | Your Usage Estimate |
|----------|---------------|-------------------|
| WebRTC participant-minutes | 5,000 / month | ~20 × 1hr × 5-person calls |
| Concurrent connections | 100 | Max 5 per room |
| Downstream data | 50 GB / month | ~1 GB per hour of 5-person HD call |
| Overage behaviour | Stops (no billing) | Cannot be charged |

### How To Monitor Usage
- LiveKit Cloud dashboard → Usage tab
- Shows real-time participant-minutes consumed
- Email alert when approaching 80% (set this up in dashboard)

### What Happens At Limit
- New participants cannot join rooms
- Existing calls continue until participant disconnects
- Resets on the 1st of the following month
- You are never charged automatically

### Vercel Free Tier
- 100 GB bandwidth/month
- 100,000 serverless function invocations/month
- Each token request = 1 invocation (so 100,000 room joins before any limit)

---

## 14. Performance Optimisations

### Bundle Size
- Vite tree-shakes LiveKit SDK — only used components bundled
- CSS Modules prevent style bloat
- No external UI library (Tailwind, MUI, etc.) — custom minimal CSS only
- Total estimated bundle size: ~180KB gzipped

### API Call Minimisation
- Token fetched **once** per room join — cached in component state
- No polling or periodic API calls
- LiveKit uses WebSocket (persistent connection) — not HTTP requests
- Room participant list managed via LiveKit's `RoomEvent` listeners (push, not pull)

### Rendering Optimisation
- `React.memo` on `VideoTile` — only re-renders when track or quality changes
- `useCallback` on all event handlers in conference room
- Video elements use `srcObject` not `src` — no blob URL overhead
- Tiles animate in/out with CSS transitions (not JS)

### Lazy Loading
```javascript
// Room page loaded only when navigating to /room/*
const Room = React.lazy(() => import('./pages/Room'));
// Setup panel loaded only after permissions check
const SetupPanel = React.lazy(() => import('./components/SetupPanel/SetupPanel'));
```

---

## 15. Accessibility & Responsiveness

### Keyboard Navigation
| Key | Action |
|-----|--------|
| `M` | Toggle microphone |
| `V` | Toggle camera |
| `S` | Start/stop screen share |
| `G` / `P` / `B` | Switch to Grid / sPeaker / sideBar view |
| `Escape` | Leave meeting (with confirmation) |

### Screen Sizes

| Breakpoint | Layout Adjustment |
|------------|------------------|
| `< 480px` (mobile) | Single column tiles, controls become icon-only |
| `480–768px` (tablet) | 2-column grid, compact controls |
| `768–1200px` (laptop) | Full grid, all labels visible |
| `> 1200px` (desktop) | Spacious grid, full feature labels |

### Responsive Video Grid Algorithm
```javascript
// Automatically chooses columns based on participant count + screen width
const getGridColumns = (count, width) => {
  if (width < 480) return 1;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return width < 768 ? 1 : 2;
  return width < 768 ? 2 : 3;
};
```

### Accessibility
- All interactive controls have `aria-label` and `aria-pressed` attributes
- Network quality badge has screen-reader text ("Connection: Good")
- Muted microphone indicated by both icon change AND red colour (not colour alone)
- Focus indicators visible for keyboard navigation

---

## 16. Environment Variables

| Variable | Where Set | Exposed To Browser | Purpose |
|----------|-----------|-------------------|---------|
| `LIVEKIT_API_KEY` | Vercel (server only) | ❌ No | Signs tokens |
| `LIVEKIT_API_SECRET` | Vercel (server only) | ❌ No | Signs tokens |
| `VITE_LIVEKIT_WS_URL` | Vercel + `.env.local` | ✅ Yes (safe) | WebSocket endpoint |

The WS URL is safe to expose — it's just a server address. Without a valid token, nobody can connect.

---

## 17. Development Workflow

### Local Development

```bash
# Terminal 1 — Vite dev server
npm run dev

# Terminal 2 — Vercel functions (for /api/token)
npx vercel dev --listen 3001

# Frontend proxies /api/* to localhost:3001 via vite.config.js
```

### Vite Config for Local Proxy

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
};
```

### Testing Locally With Multiple Participants
1. Open `http://localhost:5173` in Chrome
2. Start a meeting → note the room code
3. Open a second tab in Firefox (or Chrome incognito)
4. Join with the same code
5. You'll see both participants in the room

### Git Workflow
```bash
# Feature branches
git checkout -b feature/setup-panel
git commit -m "feat: add device selection to setup panel"
git push origin feature/setup-panel
# Vercel automatically deploys preview URL for each PR
```

---

## 18. Known Constraints & Mitigations

| Constraint | Detail | Mitigation |
|------------|--------|-----------|
| 5,000 free minutes/month | At 5 people × 1hr = 240 min, that's ~20 calls | Show usage indicator; sufficient for personal/small use |
| No chat | Out of scope for v1 | Can add LiveKit DataChannel text chat in v2 |
| No recording | LiveKit recording is paid | Not needed for v1 |
| No waiting room | Anyone with code can join | Code is the access control — share carefully |
| Firefox simulcast | Slightly less optimised than Chrome | Still works; lower quality on poor networks |
| Mobile background | iOS/Android may pause tabs | Works in foreground; known browser limitation |
| Max 5 participants | By design choice | Code-enforced; LiveKit supports more if plan upgraded |

---

## Quick Reference Commands

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Deploy
vercel --prod

# Check types
npm run typecheck
```

---

## Checklist Before Launch

- [ ] LiveKit Cloud project created, credentials saved
- [ ] `.env.local` populated with all three variables
- [ ] Vercel environment variables set in dashboard
- [ ] Test with 2 participants (different devices or browsers)
- [ ] Test with 5 participants simultaneously  
- [ ] Test network degradation (Chrome DevTools → Network throttling)
- [ ] Test screen share on Chrome and Firefox
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Verify token API returns 200 with valid room code
- [ ] Verify room code copy button works on mobile

---

*Documentation version 1.0 — VibeMeet*
*Stack: React 18 + Vite + LiveKit Cloud + Vercel*
*Total infrastructure cost: $0.00/month*
