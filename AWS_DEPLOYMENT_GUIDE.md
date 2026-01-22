
# Shamanth Tutorials AWS Deployment Guide

### 1. Database Setup (DynamoDB)
- Go to the **AWS Console** -> **DynamoDB**.
- Create a Table named `Shamanth_Users`.
- Set the **Partition Key** as `id` (String).
- Use Default Settings.

### 2. Backend Setup (Lambda + API Gateway)
- Go to **AWS Lambda** -> Create Function.
- Name: `Shamanth_Backend`, Runtime: `Node.js 18.x`.
- In **Configuration** -> **Permissions**, click the Role name and attach the `AmazonDynamoDBFullAccess` policy.
- Paste the code from `AWS_LAMBDA_PROXY.js` into the code editor.
- Click **Add Trigger** -> **API Gateway**.
- Choose "Create a new API" -> "REST API" -> "Open Security".
- **IMPORTANT**: Copy the "API Endpoint" URL once created.

### 3. Frontend Deployment (Amplify)
- Push your code to a GitHub repository.
- Go to **AWS Amplify** -> **New App** -> **Host Web App**.
- Connect your GitHub repo.
- In the "Build Settings" step, click "Advanced Settings".
- Add an **Environment Variable**: 
  - Key: `AWS_API_URL`
  - Value: [Your API Gateway URL from Step 2]
- Click "Save and Deploy".

### 4. Admin Access
- Log in with `admin@shamanth.com` and PIN `1234`.
- The **Admin Console** will now show real-time users stored in your AWS DynamoDB table.
