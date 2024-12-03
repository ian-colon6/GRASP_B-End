import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ endpoint: "http://192.168.0.237:8000" }); // Uncomment for local testing
// const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

const table = process.env.TABLE_GAS_STATIONS;

export const lambdaHandler = async (event, context) => {
    try {
        // Log the incoming event for debugging
        console.log("Received event:", event);
        
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Request body is missing" }),
            };
        }

        const body = JSON.parse(event.body); // Parse request body
        const userRating = body.rating;
        const stationId = body.Station_ID; // Station ID from the body
        
        if (!userRating || userRating < 1 || userRating > 5) {
            console.log("Invalid rating:", userRating);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "A valid rating (1-5) must be provided" }),
            };
        }

        // Fetch the gas station record
        const getStationParams = {
            TableName: table,
            Key: { Station_ID: stationId },
        };
        const stationData = await docClient.send(new GetCommand(getStationParams));
        const stationItem = stationData.Item;

        if (!stationItem) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "Gas station not found" }),
            };
        }

        const currentRating = stationItem.UserRatings || 0; // Default to 0 if not set
        const currentRatingCount = stationItem.RatingCount || 0; // Default to 0 if not set

        const newRating = currentRating + userRating;
        const newRatingCount = currentRatingCount + 1;

        // Update the gas station record
        const updateStationParams = {
            TableName: table,
            Key: { Station_ID: stationId },
            UpdateExpression: "SET UserRatings = :userRatings, RatingCount = :ratingCount",
            ExpressionAttributeValues: {
                ":userRatings": newRating,
                ":ratingCount": newRatingCount,
            },
            ReturnValues: "UPDATED_NEW",
        };
        await docClient.send(new UpdateCommand(updateStationParams));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Review updated successfully" }),
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
