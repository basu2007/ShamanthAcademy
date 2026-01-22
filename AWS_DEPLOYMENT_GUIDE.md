# Shamanth Academy: Final Deployment Fixes

### 1. Fix the "Zipping artifacts failed" Error
Your Amplify CLI is looking for a folder that isn't there. Run this command in your VSCode terminal to tell it to look at the new `dist` folder:

```bash
# Update the local configuration to use the 'dist' folder
amplify configure project
```
*When prompted:*
- Distribution Directory Path: Type `dist` and press Enter.
- Build Command: `npm run build`
- Start Command: `npm run start`

Now, `amplify publish` will work perfectly.

---

### 2. Command to Trigger GitHub Build Manually
If you have pushed to GitHub but the build hasn't started, you can "force" it from your terminal using the AWS CLI:

```bash
aws amplify start-job --app-id d30vctrrd6dday --branch-name dev --job-type RELEASE
```

---

### 3. The "Standard" Routine
From now on, use this simple 1-2-3 routine in VSCode:

**Step 1: Build locally to check for errors**
```bash
npm run build
```

**Step 2: Push to GitHub (This triggers the AWS Cloud Build)**
```bash
git add .
git commit -m "Fixed deployment structure"
git push origin dev
```

**Step 3: Monitor (Optional)**
Check the progress here: [Amplify Console - dev branch](https://console.aws.amazon.com/amplify/home#/d30vctrrd6dday/dev)