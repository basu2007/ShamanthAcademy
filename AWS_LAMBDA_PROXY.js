
/**
 * AWS LAMBDA BACKEND (Node.js 18+)
 * Use this code to create a Lambda function and connect it to an API Gateway.
 * Ensure your Lambda Role has "AmazonDynamoDBFullAccess" permission.
 */

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "Shamanth_Users";

exports.handler = async (event) => {
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

            case 'approveUnlock':
                const seeker = (await docClient.get({ TableName: TABLE_NAME, Key: { id: body.userId } }).promise()).Item;
                seeker.enrolledCourses = [...new Set([...seeker.enrolledCourses, body.courseId])];
                seeker.pendingUnlocks = seeker.pendingUnlocks.filter(id => id !== body.courseId);
                await docClient.put({ TableName: TABLE_NAME, Item: seeker }).promise();
                return response(200, { success: true });

            case 'lockCourse':
                const seekerToLock = (await docClient.get({ TableName: TABLE_NAME, Key: { id: body.userId } }).promise()).Item;
                seekerToLock.enrolledCourses = seekerToLock.enrolledCourses.filter(id => id !== body.courseId);
                await docClient.put({ TableName: TABLE_NAME, Item: seekerToLock }).promise();
                return response(200, { success: true });

            default:
                return response(400, { error: "Action not supported" });
        }
    } catch (err) {
        return response(500, { error: err.message });
    }
};

const response = (statusCode, body) => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST"
    },
    body: JSON.stringify(body)
});
