# 🚀 Shamanth Academy: AWS Deployment Guide

This guide provides the exact steps and commands to set up your backend infrastructure.

## 💻 Choose Your Platform

### Option A: Windows (PowerShell)
1. Open **PowerShell** as Administrator in the project folder.
2. Run the automation script:
   ```powershell
   .\scripts\aws-setup.ps1
   ```
   *Note: If you get a script execution error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` first.*

### Option B: Linux / Mac / Git Bash
1. Open your terminal.
2. Make the script executable and run it:
   ```bash
   chmod +x scripts/aws-setup.sh
   ./scripts/aws-setup.sh
   ```

---

## 🛠️ Manual Step: API Gateway (Required)
The automation script handles the Database and Lambda. You must now expose the Lambda to the internet:

1. **Go to AWS Console** > **API Gateway**.
2. Click **Create API** > **REST API** (Build).
3. **API Name**: `Shamanth_API`.
4. **Create Resource**: Actions > Create Resource. Name: `proxy`.
5. **Create Method**: Select `/proxy`. Actions > Create Method > **POST**.
   - Integration: **Lambda Function**.
   - **Lambda Proxy integration**: CHECKED (CRITICAL).
   - Lambda Function: `Shamanth_Backend`.
6. **Enable CORS**: Select `/proxy`. Actions > **Enable CORS**.
   - Click "Enable CORS and replace existing CORS headers".
7. **Deploy API**: Actions > **Deploy API**.
   - Deployment stage: `[New Stage]` named `prod`.
8. **COPY THE INVOKE URL**: (e.g., `https://xyz.execute-api.region.amazonaws.com/prod/proxy`).

---

## 🌐 Final Step: Frontend (Amplify)
1. Go to **AWS Amplify Console**.
2. Connect your repository (GitHub/GitLab).
3. **Environment Variables**:
   - Add `BACKEND_API_URL`.
   - Value: Paste your **Invoke URL** from the API Gateway step.
4. **Deploy**: The build process will automatically link your frontend to your new AWS backend.

---

## 🧹 Quick Cleanup (Remove Resources)
To stop all AWS charges:
```bash
# Delete DB
aws dynamodb delete-table --table-name Shamanth_Users
# Delete Lambda
aws lambda delete-function --function-name Shamanth_Backend
# Delete Role
aws iam detach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam delete-role --role-name ShamanthLambdaRole
```
