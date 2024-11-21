import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ endpoint: "http://localhost:8000" }); // Uncomment for local testing
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const table = process.env.TABLE_GAS_STATIONS;

export const lambdaHandler = async (event, context) => {
    const { body, pathParameters, queryStringParameters, requestContext } = event;

    const stationId = pathParameters?.stationId || queryStringParameters?.Station_ID;

    if (!stationId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Station ID is required" }),
        };
    }

    const userId = requestContext?.authorizer?.claims?.sub; // Get user ID from Cognito claims

    console.log('Station ID:', stationId);
    console.log('User ID:', userId);

    try {
        if (event.httpMethod === "GET") {
            // Fetch the station's rating info
            const params = {
                TableName: table,
                Key: { Station_ID: stationId },
                ProjectionExpression: "RatingCount, UserRatings",
            };
            const result = await docClient.send(new GetCommand(params));

            const { RatingCount = 0, UserRatings = {} } = result.Item || {};
            const totalRating = Object.values(UserRatings).reduce((sum, rating) => sum + rating, 0);
            const averageRating = RatingCount > 0 ? totalRating / RatingCount : 0;

            return {
                statusCode: 200,
                body: JSON.stringify({ RatingCount, AverageRating: averageRating }),
            };
        }

        if (event.httpMethod === "POST") {
            // Update the station's rating
            const { rating } = JSON.parse(body);

            if (!rating || rating < 1 || rating > 5) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: "Invalid rating value. Must be between 1 and 5." }),
                };
            }

            const updateParams = {
                TableName: table,
                Key: { Station_ID: stationId },
                UpdateExpression: `
          SET #userRatings.#userId = :rating, 
              RatingCount = if_not_exists(RatingCount, :zero) + :increment,
              UserRatings = if_not_exists(UserRatings, :emptyMap)
        `,
                ExpressionAttributeNames: {
                    "#userRatings": "UserRatings",
                    "#userId": userId,
                },
                ExpressionAttributeValues: {
                    ":rating": rating,
                    ":zero": 0,
                    ":increment": 1,
                    ":emptyMap": {},
                },
                ReturnValues: "UPDATED_NEW",
            };

            const result = await docClient.send(new UpdateCommand(updateParams));
            console.log('Update Result:', result);

            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Rating updated successfully" }),
            };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method not allowed" }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing request", error: error.message }),
        };
    }
};


