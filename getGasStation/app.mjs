import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ endpoint: "http://10.34.11.6:8000" });
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const table = process.env.TABLE_GAS_STATIONS;

export const lambdaHandler = async (event, context) => {
  const stationId = event.queryStringParameters.Station_ID; // Extract Station_ID from query params

  const params = {
    TableName: table,
    Key: {
      Station_ID: stationId,
    },
    ProjectionExpression: "Station_ID, Station_City, Station_Gas_Price, Station_Latitude, Station_Longitude, Station_Name, RatingCount, UserRatings",
  };

  try {
    const command = new GetCommand(params);
    const data = await docClient.send(command);

    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
      },
      body: JSON.stringify(data.Item), // No need to wrap data.Item in another JSON.stringify
    };

    // If RatingCount or UserRatings do not exist, add them
    if (!data.Item.RatingCount || !data.Item.UserRatings) {
      const updateParams = {
        TableName: table,
        Key: { Station_ID: stationId },
        UpdateExpression: "SET RatingCount = if_not_exists(RatingCount, :initialCount), UserRatings = if_not_exists(UserRatings, :initialRatings)",
        ExpressionAttributeValues: {
          ":initialCount": 0,
          ":initialRatings": [],
        },
        ReturnValues: "UPDATED_NEW",
      };

      const updateCommand = new UpdateCommand(updateParams);
      await docClient.send(updateCommand);

      // Update the response to reflect the new attributes
      response.body = JSON.stringify({
        ...data.Item,
        RatingCount: 0,
        UserRatings: [],
      });
    }

    return response;

  } catch (err) {
    const errResponse = {
      statusCode: 400,
      body: "Failed to retrieve data from Gas Station table. Error: " + err,
    };

    return errResponse;
  }
};
