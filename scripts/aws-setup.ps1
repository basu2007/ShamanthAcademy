# Shamanth Academy - Automated AWS Backend Setup (Windows PowerShell)
# This script creates DynamoDB and Lambda resources.

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
$accountId = aws sts get-caller-identity --query Account --output text

# IAM propagation delay
Write-Host "⏳ Waiting for IAM permissions to propagate (10s)..." -ForegroundColor Gray
Start-Sleep -Seconds 10

$exists = aws lambda get-function --function-name Shamanth_Backend 2>$null
if ($null -eq $exists) {
    aws lambda create-function `
        --function-name Shamanth_Backend `
        --runtime nodejs18.x `
        --role "arn:aws:iam::$accountId:role/ShamanthLambdaRole" `
        --handler AWS_LAMBDA_PROXY.handler `
        --zip-file fileb://function.zip
} else {
    aws lambda update-function-code `
        --function-name Shamanth_Backend `
        --zip-file fileb://function.zip
}

Write-Host "------------------------------------------" -ForegroundColor Green
Write-Host "✅ Backend Base Setup Complete!" -ForegroundColor Green
Write-Host "Next Step: Manually create a REST API in API Gateway and point it to the 'Shamanth_Backend' Lambda." -ForegroundColor Green
Write-Host "------------------------------------------" -ForegroundColor Green
