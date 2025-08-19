# App Store Integration (Minimal Package)

This package contains ONLY the new App Store plugin and small patches.
Your existing dashboard wiring remains untouched unless you apply the patch.

## Contents
- `src/plugins/appstore/AppStorePlugin.tsx`
- `src/plugins/appstore/components/AppStorePage.tsx`
- `patches/add-appstore-plugin.patch` — minimal changes to `plugin.config.ts` to register the plugin
- `patches/.env.snippet` — optional env var to point to a specific registry index

## Install (safe & minimal)
1. Copy the **`src/plugins/appstore`** folder into your dashboard repo.
2. Apply the small patch to register the plugin:
   ```bash
   git apply patches/add-appstore-plugin.patch
   ```
   *(If the patch fails due to minor drift, just add:)*
   - `import { AppStorePlugin } from "./src/plugins/appstore/AppStorePlugin";`
   - Add `AppStorePlugin,` to the exported plugin list.
3. (Optional) Add the env line to `.env`:
   ```
   VITE_APPSTORE_INDEX=https://raw.githubusercontent.com/fabric-official/app-store/main/registry/index.json
   ```
4. Build/run your dashboard as usual.

## Usage
- Open the sidebar entry **App Store** (route: `/store`).
- Click **Install** to POST to `/api/plugins/install` (if your backend supports it).
  If not, the UI will open the artifact URL so you can install manually.

## Notes
- No other files are modified by this package.
- Remove this plugin by deleting `src/plugins/appstore` and removing it from `plugin.config.ts`.
