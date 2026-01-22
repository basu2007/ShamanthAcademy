# Shamanth Academy: Production AWS Deployment

Follow these 4 phases to move your local app to a global AWS infrastructure.

---

### Phase 1: The Database (DynamoDB)
1. Go to **AWS Console** > **DynamoDB** > **Create Table**.
2. **Table Name**: `Shamanth_Users`.
3. **Partition Key**: `id` (String).
4. Click **Create**.

### Phase 2: The Backend (Lambda & IAM)
1. Go to **Lambda** > **Create Function** > **Author from scratch**.
2. **Name**: `ShamanthBackend`. **Runtime**: `Node.js 18.x`.
3. Copy the code from `AWS_LAMBDA_PROXY.js` into the `index.mjs` (or index.js) editor.
4. **Deploy** the code.
5. **Permissions**: Go to the **Configuration** tab > **Permissions** > Click the Role name.
   - Click **Add permissions** > **Attach policies**.
   - Search for `AmazonDynamoDBFullAccess` and attach it. (In production, use a more restricted policy).

### Phase 3: The API (Gateway)
1. Go to **API Gateway** > **Create API** > **REST API** (Build).
2. **Name**: `ShamanthAPI`.
3. Click **Actions** > **Create Method** > **POST**.
4. Set **Integration Type** to `Lambda Function` and select `ShamanthBackend`.
5. **CORS (Crucial)**: Click **Actions** > **Enable CORS**.
   - Ensure "Access-Control-Allow-Origin" is `'*'`. 
   - Click **Enable CORS and replace existing headers**.
6. **Deploy**: Click **Actions** > **Deploy API**.
   - **Stage**: `New Stage`, Name: `prod`.
7. **Copy the Invoke URL**: It looks like `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`.

### Phase 4: The Frontend (Amplify)
1. Push your code to **GitHub**.
2. Go to **AWS Amplify** > **New App** > **Host web app**.
3. Connect your GitHub repository.
4. **Environment Variables (The "Connection Change")**:
   - During the wizard, go to **Advanced settings**.
   - Add a variable: `AWS_API_URL`.
   - Paste your **Invoke URL** from Phase 3 as the value.
5. **Save and Deploy**.

---

### How it Works
When Amplify builds your app, it reads the `amplify.yml` file. This file runs a command that replaces the string `"INSERT_AWS_API_URL_HERE"` inside `services/db.ts` with your actual API URL. 

The app then detects this change at runtime and starts sending all login, registration, and course unlock requests to your AWS Lambda function instead of saving them only on your computer!