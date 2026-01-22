
/**
 * AWS LAMBDA BACKEND (Node.js 18+)
 * Use this code to create a Lambda function and connect it to an API Gateway.
 * Ensure your Lambda Role has "AmazonDynamoDBFullAccess" permission.
 */

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Shamanth_Users";

exports.handler = async (event) => {
    // Handle preflight OPTIONS requests if not handled by API Gateway
    if (event.httpMethod === 'OPTIONS') {
        return response(200, { message: "OK" });
    }

    const body = JSON.parse(event.body);
    const { action } = body;
    
    let result;
    
    try {
        switch (action) {
            case 'getAllUsers':
                result = await docClient.scan({ TableName: TABLE_NAME }).promise();
                return response(200, result.Items);
                
            case 'register':
                const newUser = {
                    id: Date.now().toString(),
                    email: body.email,
                    pin: body.pin,
                    role: 'USER',
                    enrolledCourses: [],
                    pendingUnlocks: [],
                    lastActive: new Date().toISOString()
                };
                await docClient.put({ TableName: TABLE_NAME, Item: newUser }).promise();
                return response(200, newUser);

            case 'login':
                const users = await docClient.scan({ TableName: TABLE_NAME }).promise();
                const user = users.Items.find(u => u.email === body.email && u.pin === body.pin);
                if (user) {
                    user.lastActive = new Date().toISOString();
                    await docClient.put({ TableName: TABLE_NAME, Item: user }).promise();
                    return response(200, user);
                }
                return response(401, { error: "Invalid credentials" });

            case 'requestUnlock':
                const userToReq = (await docClient.get({ TableName: TABLE_NAME, Key: { id: body.userId } }).promise()).Item;
                if (userToReq && !userToReq.pendingUnlocks.includes(body.courseId)) {
                    userToReq.pendingUnlocks.push(body.courseId);
                    userToReq.lastActive = new Date().toISOString();
                    await docClient.put({ TableName: TABLE_NAME, Item: userToReq }).promise();
                }
                return response(200, { success: true });

            case 'approveUnlock':
                const seeker = (await docClient.get({ TableName: TABLE_NAME, Key: { id: body.userId } }).promise()).Item;
                if (seeker) {
                    seeker.enrolledCourses = [...new Set([...seeker.enrolledCourses, body.courseId])];
                    seeker.pendingUnlocks = seeker.pendingUnlocks.filter(id => id !== body.courseId);
                    seeker.lastActive = new Date().toISOString();
                    await docClient.put({ TableName: TABLE_NAME, Item: seeker }).promise();
                }
                return response(200, { success: true });

            case 'lockCourse':
                const seekerToLock = (await docClient.get({ TableName: TABLE_NAME, Key: { id: body.userId } }).promise()).Item;
                if (seekerToLock) {
                    seekerToLock.enrolledCourses = seekerToLock.enrolledCourses.filter(id => id !== body.courseId);
                    seekerToLock.lastActive = new Date().toISOString();
                    await docClient.put({ TableName: TABLE_NAME, Item: seekerToLock }).promise();
                }
                return response(200, { success: true });

            default:
                return response(400, { error: "Action not supported" });
        }
    } catch (err) {
        console.error("Lambda Error:", err);
        return response(500, { error: err.message });
    }
};

const response = (statusCode, body) => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    },
    body: JSON.stringify(body)
});
