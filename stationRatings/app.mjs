import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ endpoint: "http://localhost:8000" }); // Uncomment for local testing
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const table = process.env.TABLE_GAS_STATIONS;

export const lambdaHandler = async (event, context) => {
    try {
        // Log the incoming event for debugging
        console.log("Received event:", JSON.stringify(event, null, 2));

        // Parse the body and extract the rating
        const { rating } = JSON.parse(event.body);
        const stationId = event.pathParameters?.stationId;
        const userId = event.requestContext?.authorizer?.claims?.sub; // Get user ID from Cognito claims

        // Validate inputs
        if (!stationId) {
            console.log("Station_ID is missing");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Station_ID is required" }),
            };
        }

        if (!rating || rating < 1 || rating > 5) {
            console.log("Invalid rating:", rating);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "A valid rating (1-5) must be provided" }),
            };
        }

        // Update parameters for DynamoDB
        const updateParams = {
            TableName: table,
            Key: { Station_ID: stationId },
            UpdateExpression: `
        SET UserRatings.#userId = :rating,
            RatingCount = if_not_exists(RatingCount, :zero) + :increment
      `,
            ExpressionAttributeNames: {
                "#userId": userId,  // Maps dynamic user ID under UserRatings
            },
            ExpressionAttributeValues: {
                ":rating": rating,
                ":zero": 0,
                ":increment": 1,
            },
            ReturnValues: "UPDATED_NEW",
        };

        // Execute the update command
        const result = await docClient.send(new UpdateCommand(updateParams));
        console.log("Update Result:", result);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Rating updated successfully", updatedAttributes: result.Attributes }),
        };
    } catch (error) {
        // Handle errors gracefully and log details
        console.error("Error processing request:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Error processing request", error: error.message }),
        };
    }
};
