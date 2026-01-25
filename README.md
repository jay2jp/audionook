# AudioNook - Offline Audiobook Player

AudioNook is a Progressive Web App (PWA) designed for listening to audiobooks locally on your device. It features offline support, listening history tracking, and bookmarking.

## Features

- 🎧 Plays MP3, M4B, WAV files.
- 💾 **Offline Ready**: Works without internet once installed.
- 📍 **Auto-Resume**: Remembers exactly where you left off.
- 📱 **PWA**: Installable on iOS and Android home screens.
- 📚 Local Library management (data stored in browser IndexedDB).

## Prerequisites

To run this project locally, you need:

- **Node.js** (Version 16 or higher recommended)
- **npm** (Included with Node.js)

## Installation

1.  Download or clone this repository.
2.  Open your terminal/command prompt in the project folder.
3.  Install dependencies:

    ```bash
    npm install
    ```

## Development

To start the local development server:

```bash
npm run dev
```

This will start the app at `http://localhost:3000`. Any changes you make to the code will automatically reload the page.

## Building for Production

To create a production-ready build:

```bash
npm run build
```

The output will be in the `dist` folder. You can serve this folder using any static file server.

## PWA & Offline Note

The Service Worker (`sw.js`) is configured to cache files for offline use. In development mode (`npm run dev`), the Service Worker might log errors or behave inconsistently because of hot-reloading. It works best when running a production build or when tested in a secure context (HTTPS or localhost).

## Tech Stack

- **React** (UI Framework)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Styling - currently loaded via CDN for simplicity)
- **Vite** (Build tool)
- **IndexedDB** (Local database for large file storage)
