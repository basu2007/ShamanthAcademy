
# Shamanth Academy - Verbose AWS Backend Setup (Windows)

Write-Host "`n🚀 Initializing Shamanth Academy Setup Script..." -ForegroundColor Cyan

# 0. Check AWS Configuration
Write-Host "👤 Checking AWS Identity..." -ForegroundColor Gray
$identity = aws sts get-caller-identity
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: AWS CLI is not configured or credentials expired." -ForegroundColor Red
    Write-Host "👉 Run 'aws configure' to set your access keys." -ForegroundColor Yellow
    exit
}

$region = aws configure get region
Write-Host "🌍 Target Region: $region" -ForegroundColor Cyan

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
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

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

aws iam create-role --role-name ShamanthLambdaRole --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 3. Zip and Deploy Lambda
Write-Host "⚡ Zipping Lambda function..." -ForegroundColor Yellow
if (Test-Path function.zip) { Remove-Item function.zip }
Compress-Archive -Path AWS_LAMBDA_PROXY.js -DestinationPath function.zip

Write-Host "🚀 Deploying Lambda: Shamanth_Backend..." -ForegroundColor Yellow
$accountId = aws sts get-caller-identity --query Account --output text

Write-Host "⏳ Waiting for IAM permissions to propagate (15s)..." -ForegroundColor Gray
Start-Sleep -Seconds 15

$exists = aws lambda get-function --function-name Shamanth_Backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "✨ Creating new function..." -ForegroundColor Gray
    aws lambda create-function `
        --function-name Shamanth_Backend `
        --runtime nodejs18.x `
        --role "arn:aws:iam::$accountId:role/ShamanthLambdaRole" `
        --handler AWS_LAMBDA_PROXY.handler `
        --zip-file fileb://function.zip
} else {
    Write-Host "🔄 Updating existing function..." -ForegroundColor Gray
    aws lambda update-function-code `
        --function-name Shamanth_Backend `
        --zip-file fileb://function.zip
}

Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "✅ Setup Attempt Finished!" -ForegroundColor Green
Write-Host "Check your Lambda Console in region: $region" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Green
