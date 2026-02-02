#!/bin/bash

# Shamanth Academy - Automated AWS Backend Setup
# This script creates DynamoDB and Lambda resources.

echo "------------------------------------------"
echo "🛠️ Starting Shamanth Academy AWS Setup..."
echo "------------------------------------------"

# 1. Create DynamoDB Table
echo "📦 Creating DynamoDB Table: Shamanth_Users..."
aws dynamodb create-table \
    --table-name Shamanth_Users \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 2>/dev/null

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

aws iam create-role --role-name ShamanthLambdaRole --assume-role-policy-document file://trust-policy.json 2>/dev/null
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name ShamanthLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 3. Zip and Deploy Lambda
echo "⚡ Zipping Lambda function..."
zip -q function.zip AWS_LAMBDA_PROXY.js

echo "🚀 Deploying Lambda: Shamanth_Backend..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# IAM propagation delay
echo "⏳ Waiting for IAM permissions to propagate (10s)..."
sleep 10

aws lambda create-function \
    --function-name Shamanth_Backend \
    --runtime nodejs18.x \
    --role arn:aws:iam::$ACCOUNT_ID:role/ShamanthLambdaRole \
    --handler AWS_LAMBDA_PROXY.handler \
    --zip-file fileb://function.zip 2>/dev/null || \
aws lambda update-function-code \
    --function-name Shamanth_Backend \
    --zip-file fileb://function.zip

echo "------------------------------------------"
echo "✅ Backend Base Setup Complete!"
echo "Next Step: Manually create a REST API in API Gateway and point it to the 'Shamanth_Backend' Lambda."
echo "------------------------------------------"
