
#!/bin/bash

# Shamanth Academy - Professional AWS Backend Setup
# This script creates DynamoDB and Lambda resources with robust error handling.

echo "------------------------------------------"
echo "🛠️ Starting Shamanth Academy AWS Setup..."
echo "------------------------------------------"

# Check AWS Identity
echo "👤 Fetching AWS Account Identity..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text | tr -d '\r')
REGION=$(aws configure get region)

if [[ ! $ACCOUNT_ID =~ ^[0-9]{12}$ ]]; then
    echo "❌ ERROR: Could not retrieve a valid 12-digit AWS Account ID."
    echo "Raw ID detected: '$ACCOUNT_ID'"
    exit 1
fi

echo "🆔 Account ID: $ACCOUNT_ID"
echo "🌍 Target Region: $REGION"

# 1. Create DynamoDB Table
echo "📦 Creating DynamoDB Table: Shamanth_Users..."
aws dynamodb create-table \
    --table-name Shamanth_Users \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 2>/dev/null || echo "ℹ️ Table might already exist, skipping..."

# 2. Setup IAM Role
echo "🔐 Setting up IAM Roles..."
cat > trust-policy.json << EOF
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
EOF

aws iam create-role --role-name ShamanthLambdaRole --assume-role-policy-document file://trust-policy.json 2>/dev/null || echo "ℹ️ Role might already exist..."
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 3. Zip and Deploy Lambda
echo "⚡ Zipping Lambda function..."
zip -r function.zip AWS_LAMBDA_PROXY.js

echo "🚀 Deploying Lambda: Shamanth_Backend..."
echo "⏳ Waiting for IAM permissions to propagate (15s)..."
sleep 15

# Try to create, if it exists, update it
LAMBDA_ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/ShamanthLambdaRole"
echo "📍 Using Role: $LAMBDA_ROLE_ARN"

aws lambda create-function \
    --function-name Shamanth_Backend \
    --runtime nodejs18.x \
    --role "$LAMBDA_ROLE_ARN" \
    --handler AWS_LAMBDA_PROXY.handler \
    --zip-file fileb://function.zip || \
aws lambda update-function-code \
    --function-name Shamanth_Backend \
    --zip-file fileb://function.zip

echo "------------------------------------------"
echo "✅ Backend Base Setup Complete!"
echo "Check your Lambda Console in region: $REGION"
echo "------------------------------------------"
