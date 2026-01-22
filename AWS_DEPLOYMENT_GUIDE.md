# Shamanth Academy: Deployment Commands

### Why `amplify deploy` doesn't work
The `amplify` CLI is for a different type of project. For your website, you use **Amplify Hosting**.

---

### Option 1: The GitHub "Push" Command (Recommended)
This is the standard way. Every time you run these, AWS starts a new build automatically.
```bash
git add .
git commit -m "Update Shamanth Academy"
git push origin dev
```

**If this doesn't trigger a build:**
1. Go to **AWS Amplify Console**.
2. Go to **App Settings** > **Webhooks**.
3. If no webhook exists, go to **Hosting environments** and re-connect your GitHub.

---

### Option 2: The "Force Deploy" Terminal Command
If GitHub isn't working, you can manually upload your code using the **AWS CLI**. Run this in your VSCode terminal:

**Step A: Zip your code**
```bash
# Windows (PowerShell)
Compress-Archive -Path index.html, index.tsx, package.json, amplify.yml, metadata.json, components, services, constants.tsx, types.ts -DestinationPath site.zip -Force
```

**Step B: Push to AWS**
```bash
# Replace YOUR_APP_ID with d30vctrrd6dday
aws amplify start-deployment --app-id d30vctrrd6dday --branch-name dev --source-url site.zip
```

---

### Troubleshooting the "Welcome" Screen
If you see the AWS Welcome screen even after a "Success" message:
1. Your `index.html` must be in the **root** folder (it is).
2. Your `amplify.yml` must list `index.html` in the artifacts (I just updated this for you).
3. **Check the Build Logs**: In the Amplify Console, click on the "Build" step. If it shows an error in `npm run build`, your `index.js` was never created.

### Environment Variables
Don't forget to add your `AWS_API_URL` in **App Settings > Environment Variables** in the AWS UI!