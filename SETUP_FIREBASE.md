# Cross-device sign in (Firebase) — one-time setup

1. https://console.firebase.google.com → **Add project** (Analytics not needed).
2. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database** (production mode, any region).
   Then open the **Rules** tab, paste the contents of `firestore.rules`, and **Publish**.
4. **Project settings (gear) → General → Your apps → Web (`</>`)** → register an app.
   Copy `apiKey`, `authDomain`, `projectId`, `appId`.
5. **Vercel → your project → Settings → Environment Variables**: add
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
   (apply to Production, Preview and Development), then **Redeploy**.
6. **Firebase → Authentication → Settings → Authorized domains → Add domain**:
   your Vercel domain, e.g. `paletteai-xxxx.vercel.app`.

For local testing copy `.env.example` to `.env` and fill in the same 4 values.
Without these values the app falls back to browser-only accounts.
