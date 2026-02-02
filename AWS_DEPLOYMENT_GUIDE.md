# 🚀 Shamanth Academy: Step 1 (Detailed Windows Guide)

If you saw an error saying "term is not recognized," follow these exact sub-steps.

---

## 🛠️ Step 1: The Backend Setup

### 1.1 Verify your location
Run this command to see if the script is where we think it is:
```powershell
ls scripts/aws-setup.ps1
```
- **If you see an error**: The `scripts` folder doesn't exist. Run this to fix it:
  ```powershell
  mkdir scripts; mv aws-setup.ps1 scripts/
  ```
- **If you see the file listed**: Proceed to 1.2.

### 1.2 Unblock PowerShell (The "Key" to the Lock)
Windows blocks scripts by default for security. You must run this command **once per session**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```
- When it asks `[Y] Yes [N] No`, type **`Y`** and press **Enter**.

### 1.3 Run the Script
Now, run the script using its relative path. If the first one fails, try the second:
```powershell
# Option A (Standard)
.\scripts\aws-setup.ps1

# Option B (If Option A fails)
powershell -ExecutionPolicy Bypass -File .\scripts\aws-setup.ps1
```

### 1.4 What this script does (The Details)
When this script runs successfully, it performs 4 critical tasks:
1.  **Database**: Creates a `Shamanth_Users` table in AWS DynamoDB.
2.  **Security**: Creates an IAM Role (`ShamanthLambdaRole`) so the code has permission to talk to the database.
3.  **Packaging**: Compresses your `AWS_LAMBDA_PROXY.js` into a `.zip` file.
4.  **Deployment**: Uploads that zip to **AWS Lambda** and names it `Shamanth_Backend`.

---

## 🌉 Moving to Step 2?
Only move to Step 2 (API Gateway) once you see the green message: **"✅ Backend Base Setup Complete!"**
