# 🚀 Shamanth Academy: Windows Deployment Guide

Since you are on **Windows**, please follow these exact steps. **Ignore any commands starting with `chmod` or `./scripts/aws-setup.sh`** as those are for Mac/Linux only.

---

## 🏁 Phase 1: The Foundation (Backend)
Run these commands in your **PowerShell** window:

1.  **Allow scripts to run** (Copy and paste this):
    ```powershell
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
    ```
2.  **Run the Windows Setup Script**:
    ```powershell
    .\scripts\aws-setup.ps1
    ```
    *If successful, you will see green text saying "Backend Base Setup Complete!"*

---

## 🌉 Phase 2: The Bridge (API Gateway)
1. Log in to [AWS API Gateway](https://console.aws.amazon.com/apigateway).
2. Click **Create API** -> **REST API** (Build).
3. **Name**: `Shamanth_API`.
4. **Create Resource**: Actions -> Create Resource. Name it `proxy`.
5. **Create Method**: Select `/proxy`. Actions -> Create Method -> **POST**.
   - **Integration**: Lambda Function.
   - **Lambda Proxy integration**: ✅ **CHECK THIS BOX**.
   - **Lambda Function**: `Shamanth_Backend`.
6. **Enable CORS**: Select `/proxy`. Actions -> **Enable CORS**.
7. **Deploy API**: Actions -> **Deploy API**. Stage: `prod`.
8. **SAVE THE URL**: Copy the "Invoke URL" from the top of the screen.

---

## 🎨 Phase 3: The Face (AWS Amplify)
1. Push your code to GitHub.
2. Connect the repo to [AWS Amplify](https://console.aws.amazon.com/amplify).
3. **Add Environment Variables**:
   - `BACKEND_API_URL`: Your URL from Phase 2 + `/proxy` (e.g., `https://xyz.execute-api.us-east-1.amazonaws.com/prod/proxy`)
   - `API_KEY`: Your Google Gemini API Key.
4. Deploy.
