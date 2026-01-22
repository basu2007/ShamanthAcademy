# Shamanth Academy: How to Deploy

### Option 1: Deploy via GitHub (The Best Way)

This method ensures that every time you save and "Push" your code in VSCode, your website updates automatically.

1.  **Create a Repo**: Go to [GitHub](https://github.com/new) and create a private repository named `shamanth-academy`.
2.  **Run these commands in VSCode Terminal** (Ctrl + `):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M dev
    git remote add origin https://github.com/YOUR_GITHUB_USERNAME/shamanth-academy.git
    git push -u origin dev
    ```
3.  **Connect to Amplify**:
    - Open your [AWS Amplify Console](https://console.aws.amazon.com/amplify/home).
    - Select your app `d30vctrrd6dday`.
    - Go to **App Settings** > **General**.
    - Click **Reconnect repository**.
    - Select **GitHub**, find your `shamanth-academy` repo, and select the `dev` branch.
    - **Crucial**: Ensure you check the box for "Monorepo" **only if** your code is in a subfolder. If your files are in the root, leave it unchecked.

---

### Option 2: Deploy via VSCode Terminal (Zip Method)

If you don't want to use GitHub, you can use the AWS CLI to push the code directly.

1.  **Install AWS CLI** and run `aws configure`.
2.  **Zip and Deploy Command**:
    ```bash
    # Windows (PowerShell)
    Compress-Archive -Path * -DestinationPath deploy.zip -Force
    aws amplify start-deployment --app-id d30vctrrd6dday --branch-name dev --source-url deploy.zip
    ```
    *Note: The CLI deployment is more complex for beginners. The GitHub method is highly recommended.*

---

### How to Fix the "Welcome" Screen

If you still see the "Welcome" screen after a successful deploy:
1.  **Build Phase Check**: In the Amplify Console, click on your `dev` branch. Look at the **"Build"** log. If it says "Succeeded" but the site is blank, check the "Artifacts" tab to ensure `index.html` and `index.js` are listed.
2.  **Environment Variables**:
    - Go to **App Settings** > **Environment variables**.
    - Add a variable with Key: `AWS_API_URL` and Value: `(Your API Gateway URL)`.
    - You **must** trigger a new build for this variable to take effect.

### Local Testing
To see your app before deploying:
```bash
npm install
npm run build
# Then open index.html in your browser using "Live Server" extension
```
