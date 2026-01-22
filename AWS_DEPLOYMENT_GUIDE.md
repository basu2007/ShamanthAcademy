# Shamanth Academy: Windows Deployment Fix

If you are seeing `'cp' is not recognized`, it means your local Amplify configuration is stuck on an old command. Follow these exact steps:

### 1. Force Reset Amplify Config
Run this command in your VSCode terminal:
```bash
amplify configure project
```

**During the prompts, you MUST type exactly these values:**
1. **Build Command**: `node build.js`
2. **Start Command**: `npm run start`
3. **Distribution Directory Path**: `dist`

---

### 2. Verify the Build Script
Run this command to make sure the Windows-friendly script works:
```bash
npm run build
```
You should see output starting with `--- 🚀 Starting Build Process ---`. If you see `rm` or `cp` errors here, check that your `package.json` file was saved correctly.

---

### 3. Final Publish
Now run:
```bash
amplify publish
```

---

### 4. Why this works
Windows doesn't have `cp` or `rm`. The `build.js` file uses Node.js "built-in" functions that work on all operating systems. By setting the Amplify build command to `node build.js`, we bypass the Windows command prompt limitations entirely.