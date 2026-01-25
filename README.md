# AudioNook - Offline Audiobook Player

AudioNook is a Progressive Web App (PWA) designed for listening to audiobooks locally on your device. It features offline support, listening history tracking, and bookmarking.

## Features

- 🎧 Plays MP3, M4B, WAV files.
- 💾 **Offline Ready**: Works without internet once installed.
- 📍 **Auto-Resume**: Remembers exactly where you left off.
- 📱 **PWA**: Installable on iOS and Android home screens.
- 📚 Local Library management (data stored in browser IndexedDB).

## Deployment (Free on Vercel)

This project is configured to run on the **Vercel Hobby Plan** (Free).

1.  **Push to GitHub**: Create a repository on GitHub and push this code to it.
    *(Note: You can safely delete the `sw.js` and `manifest.json` files in the root folder, as they have been moved to the `public/` folder)*.

2.  **Import to Vercel**:
    *   Go to [Vercel.com](https://vercel.com) and log in.
    *   Click **"Add New"** > **"Project"**.
    *   Select your GitHub repository.

3.  **Configure Build**:
    *   **Framework Preset**: Vite (Vercel should detect this automatically).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
    *   Click **Deploy**.

Once deployed, open the URL on your phone. You can then use "Share" > "Add to Home Screen" to install it as an app.

## Local Development

To run this project locally:

```bash
npm install
npm run dev
```

This will start the app at `http://localhost:3000`.

## Tech Stack

- **React** (UI Framework)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Styling - currently loaded via CDN)
- **Vite** (Build tool)
- **IndexedDB** (Local database)
