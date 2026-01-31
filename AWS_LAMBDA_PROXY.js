
/**
 * AWS LAMBDA BACKEND (Node.js 18+)
 * Updated to support Platform Settings persistence.
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  PutCommand, 
  GetCommand, 
  UpdateCommand 
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "Shamanth_Users";
const SETTINGS_ID = "PLATFORM_CONFIG_GLOBAL";

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return response(200, { message: "CORS Preflight OK" });
    }

    try {
        const body = JSON.parse(event.body || "{}");
        const { action } = body;
        
        switch (action) {
            case 'getSettings': {
                const { Item } = await docClient.send(new GetCommand({ 
                    TableName: TABLE_NAME, 
                    Key: { id: SETTINGS_ID } 
                }));
                return response(200, Item || {
                    id: SETTINGS_ID,
                    paymentQrCode: null,
                    upiId: 'shamanth@okaxis',
                    contactNumber: '+91 999 000 1234'
                });
            }

            case 'saveSettings': {
                const settingsItem = {
                    ...body.settings,
                    id: SETTINGS_ID,
                    updatedAt: new Date().toISOString()
                };
                await docClient.send(new PutCommand({ 
                    TableName: TABLE_NAME, 
                    Item: settingsItem 
                }));
                return response(200, { success: true });
            }

            case 'getAllUsers': {
                const data = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
                // Filter out the settings item from the user list
                const usersOnly = data.Items.filter(item => item.id !== SETTINGS_ID);
                return response(200, usersOnly);
            }
                
            case 'register': {
                const newUser = {
                    id: Date.now().toString(),
                    email: body.email,
                    pin: body.pin,
                    role: 'USER',
                    enrolledCourses: [],
                    pendingUnlocks: [],
                    lastActive: new Date().toISOString()
                };
                await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: newUser }));
                return response(200, newUser);
            }

            case 'login': {
                const scanData = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
                const user = scanData.Items.find(u => u.email === body.email && u.pin === body.pin && u.id !== SETTINGS_ID);
                if (user) {
                    user.lastActive = new Date().toISOString();
                    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
                    return response(200, user);
                }
                return response(401, { error: "Invalid credentials" });
            }

            case 'requestUnlock': {
                const { Item: user } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id: body.userId } }));
                if (user && !user.pendingUnlocks.includes(body.courseId)) {
                    user.pendingUnlocks.push(body.courseId);
                    user.lastActive = new Date().toISOString();
                    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
                }
                return response(200, { success: true });
            }

            case 'approveUnlock': {
                const { Item: seeker } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id: body.userId } }));
                if (seeker) {
                    seeker.enrolledCourses = [...new Set([...seeker.enrolledCourses, body.courseId])];
                    seeker.pendingUnlocks = seeker.pendingUnlocks.filter(id => id !== body.courseId);
                    seeker.lastActive = new Date().toISOString();
                    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: seeker }));
                }
                return response(200, { success: true });
            }

            case 'lockCourse': {
                const { Item: seeker } = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { id: body.userId } }));
                if (seeker) {
                    seeker.enrolledCourses = seeker.enrolledCourses.filter(id => id !== body.courseId);
                    seeker.lastActive = new Date().toISOString();
                    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: seeker }));
                }
                return response(200, { success: true });
            }

            default:
                return response(400, { error: `Action '${action}' not supported` });
        }
    } catch (err) {
        console.error("Lambda Error:", err);
        return response(500, { error: err.message });
    }
};

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    };
}
