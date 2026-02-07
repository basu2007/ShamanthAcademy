
# Shamanth Academy - Professional AWS Backend Setup (Windows)

Write-Host "`n🚀 Initializing Shamanth Academy Setup Script..." -ForegroundColor Cyan

# 0. Check AWS Identity and Region
Write-Host "👤 Fetching AWS Account Identity..." -ForegroundColor Gray
$accountId = aws sts get-caller-identity --query "Account" --output text
$region = aws configure get region

# Verify account ID is exactly 12 digits (standard AWS Account ID)
if ($accountId -match '^\d{12}$') {
    Write-Host "🆔 Account ID: $accountId" -ForegroundColor Green
    Write-Host "🌍 Target Region: $region" -ForegroundColor Cyan
} else {
    Write-Host "❌ ERROR: Could not retrieve a valid 12-digit AWS Account ID." -ForegroundColor Red
    Write-Host "Raw ID detected: '$accountId'" -ForegroundColor Yellow
    Write-Host "👉 Please ensure 'aws configure' is complete and you have internet access." -ForegroundColor Yellow
    exit
}

if (!(Test-Path "AWS_LAMBDA_PROXY.js")) {
    Write-Host "❌ Error: Could not find 'AWS_LAMBDA_PROXY.js' in this folder." -ForegroundColor Red
    exit
}

Write-Host "------------------------------------------" -ForegroundColor Cyan
Write-Host "🛠️ Starting Shamanth Academy AWS Setup..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# 1. Create DynamoDB Table
Write-Host "📦 Creating DynamoDB Table: Shamanth_Users..." -ForegroundColor Yellow
aws dynamodb create-table `
    --table-name Shamanth_Users `
    --attribute-definitions AttributeName=id,AttributeType=S `
    --key-schema AttributeName=id,KeyType=HASH `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 2>$null

# 2. Setup IAM Role
Write-Host "🔐 Setting up IAM Roles..." -ForegroundColor Yellow
$trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@
$trustPolicy | Out-File -FilePath trust-policy.json -Encoding ascii

aws iam create-role --role-name ShamanthLambdaRole --assume-role-policy-document file://trust-policy.json 2>$null
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 3. Zip and Deploy Lambda
Write-Host "⚡ Zipping Lambda function..." -ForegroundColor Yellow
if (Test-Path function.zip) { Remove-Item function.zip }
Compress-Archive -Path AWS_LAMBDA_PROXY.js -DestinationPath function.zip

Write-Host "🚀 Deploying Lambda: Shamanth_Backend..." -ForegroundColor Yellow
Write-Host "⏳ Waiting for IAM permissions to propagate (15s)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Construct the ARN with the verified Account ID
$lambdaRoleArn = "arn:aws:iam::$accountId:role/ShamanthLambdaRole"
Write-Host "📍 Using Role: $lambdaRoleArn" -ForegroundColor Gray

# Check if function exists
aws lambda get-function --function-name Shamanth_Backend 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "✨ Creating new function..." -ForegroundColor Gray
    aws lambda create-function `
        --function-name Shamanth_Backend `
        --runtime nodejs18.x `
        --role "$lambdaRoleArn" `
        --handler AWS_LAMBDA_PROXY.handler `
        --zip-file fileb://function.zip
} else {
    Write-Host "🔄 Updating existing function..." -ForegroundColor Gray
    aws lambda update-function-code `
        --function-name Shamanth_Backend `
        --zip-file fileb://function.zip
}

Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "✅ Backend Base Setup Complete!" -ForegroundColor Green
Write-Host "Check your Lambda Console in region: $region" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Green
