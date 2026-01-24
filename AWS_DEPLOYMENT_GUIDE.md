# Shamanth Academy: Deployment Fixes

If you see `× Zipping artifacts failed`, follow these steps to force Amplify to use the correct settings.

### 1. Fix Configuration (Command Line)
Run this command in your terminal:
```bash
amplify configure project
```
**Respond to the prompts as follows:**
- **Build Command**: `node build.js`
- **Start Command**: `npm run start`
- **Distribution Directory Path**: `dist`

### 2. Manual Fix (If Step 1 Fails)
If the command above doesn't work, edit the configuration file directly:
1. Open the file: `amplify/.config/project-config.json`
2. Ensure the `javascript` section looks exactly like this:
```json
"javascript": {
  "framework": "none",
  "config": {
    "BuildCommand": "node build.js",
    "StartCommand": "npm run start",
    "DistributionDir": "dist"
  }
}
```

### 3. Clear Cache & Rebuild
Run these commands to ensure a clean state:
```bash
# Delete existing dist
rmdir /s /q dist 
# Run the custom build
npm run build
# Publish to AWS
amplify publish
```

### 4. About the Network Timeout
The `connect ETIMEDOUT` error happens because your network (or a VPN/Firewall) is blocking `github.com` IPs used by Amplify to send debug reports. This **does not** stop your app from deploying; it only stops the error report from being sent. Focus on fixing the "Zipping" error above first.