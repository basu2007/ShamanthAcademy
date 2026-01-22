# Shamanth Academy: Deployment Guide

### 1. Fix the Local CLI Config
Since we now have a proper `dist` folder, make sure Amplify knows where it is:

```bash
amplify configure project
```
*When prompted:*
- **Distribution Directory Path**: Type `dist` and press Enter.
- **Build Command**: `node build.js`
- **Start Command**: `npm run start` (or leave default)

---

### 2. Run Publish
Now that we have replaced Linux commands (`rm`/`cp`) with a cross-platform Node script (`build.js`), this command will work on Windows:

```bash
amplify publish
```

---

### 3. Using GitHub (Better for Teams)
If you prefer pushing to GitHub and letting the cloud do the building:

```bash
git add .
git commit -m "Switch to cross-platform build script"
git push origin dev
```

### 4. Troubleshooting
If you see the "Welcome" screen after publishing:
1. Go to the **Amplify Console** UI.
2. Check the **Rewrites and redirects** section.
3. Ensure there is a rule: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>` directed to `/index.html` (Type: 200 Rewrite).