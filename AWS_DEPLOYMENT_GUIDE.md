# 🚀 Shamanth Academy: Windows Deployment Guide

Follow these steps exactly. If one step fails, do not proceed to the next.

---

## 🏁 Phase 0: Verification (Do this first!)
Before running the setup, let's make sure you are in the right folder and the file exists.
In your PowerShell, run this:
```powershell
Test-Path "scripts/aws-setup.ps1"
```
- If it says **True**: Proceed to Phase 1.
- If it says **False**: You are in the wrong folder. Run `ls` to see where you are, then `cd` into the correct `ShamanthAcademy` folder.

---

## 🏁 Phase 1: The Foundation (Backend)
1. **Unblock Scripts**: Copy and paste this, then **Press Enter**:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
   ```
   - **IMPORTANT**: If it asks `Do you want to change the execution policy? [Y/N]`, type `Y` and press **Enter**.

2. **Run the Setup**:
   ```powershell
   .\scripts\aws-setup.ps1
   ```
   - *Note: If this still fails, try running it without the subfolder if you moved it: `.\aws-setup.ps1`*

---

## 🌉 Phase 2: The Bridge (API Gateway)
1. Log in to [AWS API Gateway](https://console.aws.amazon.com/apigateway).
2. Click **Create API** -> **REST API** (Find the "REST API" box and click **Build**).
3. **Settings**:
   - **Name**: `Shamanth_API`
   - **Endpoint**: Regional
4. **Create the Proxy**:
   - Click **Actions** -> **Create Resource**.
   - **Resource Name**: `proxy`
   - Click **Create Resource**.
5. **Create the Method**:
   - Select the `/proxy` folder.
   - Click **Actions** -> **Create Method**.
   - Select **POST** and click the checkmark.
   - **Integration**: Lambda Function.
   - **Lambda Proxy integration**: ✅ **CRITICAL: CHECK THIS BOX**.
   - **Lambda Function**: `Shamanth_Backend`.
6. **Enable CORS**: Select `/proxy` -> **Actions** -> **Enable CORS** -> Click the blue "Enable..." button.
7. **Deploy**: **Actions** -> **Deploy API**. Stage: `prod`.
8. **URL**: Copy the "Invoke URL" from the top. It looks like `https://xxx.execute-api.us-east-1.amazonaws.com/prod`.

---

## 🎨 Phase 3: The Face (AWS Amplify)
1. Push your code to GitHub.
2. Connect to [AWS Amplify](https://console.aws.amazon.com/amplify).
3. **Environment Variables**:
   - `BACKEND_API_URL`: Paste your URL + `/proxy` (e.g. `https://xyz.../prod/proxy`)
   - `API_KEY`: Your Gemini API Key.
4. Deploy.
