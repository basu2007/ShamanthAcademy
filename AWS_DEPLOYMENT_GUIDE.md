# Shamanth Academy: Deployment Fixes

If you see `× Zipping artifacts failed`, it means the Amplify CLI is looking for your build in the wrong folder (likely `build` instead of `dist`).

### 1. Fix Distribution Directory
Run this command to tell Amplify to look in the `dist` folder:
```bash
amplify configure project
```
**Follow these prompts exactly:**
- **Build Command**: `node build.js`
- **Start Command**: `npm run start` (or leave default)
- **Distribution Directory Path**: `dist`  <-- THIS MUST BE "dist"

---

### 2. Verify Local Build
Test the build locally before publishing. This will also collect your reports:
```bash
npm run build
```
Verify that a `dist` folder appeared in your project root and that it contains `index.html`, `index.js`, and a `reports` folder.

---

### 3. Deploy
```bash
amplify publish
```

### 4. Why you see "Vite" errors
If your terminal shows `vite v5.4.21`, you are running a Vite-based project instead of the custom `build.js`. To ensure my "Report Collector" works, make sure your `package.json` matches the one provided in this app.