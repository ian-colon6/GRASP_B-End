import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ endpoint: "http://10.34.4.147:8000" }); // Uncomment for local testing
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const table = process.env.TABLE_GAS_STATIONS;

export const lambdaHandler = async (event, context) => {
  let tableData = [];

  const params = {
    ProjectionExpression: "Station_ID, Station_City, Station_Gas_Price, Station_Latitude, Station_Longitude, Station_Name, RatingCount, UserRatings",
    TableName: table,
  };

  try {
    // Fetch all gas stations
    const command = new ScanCommand(params);
    const data = await docClient.send(command);
    tableData = data.Items;

    // Iterate through each station and check if RatingCount and UserRatings exist
    for (let station of tableData) {
      // Explicit check for null or undefined attributes
      const isMissingRatingCount = station.RatingCount === undefined || station.RatingCount === null;
      const isMissingUserRatings = station.UserRatings === undefined || station.UserRatings === null;

      if (isMissingRatingCount || isMissingUserRatings) {
        const updateParams = {
          TableName: table,
          Key: { Station_ID: station.Station_ID }, // Use the Station_ID for each station
          UpdateExpression: "SET RatingCount = if_not_exists(RatingCount, :initialCount), UserRatings = if_not_exists(UserRatings, :initialRatings)",
          ExpressionAttributeValues: {
            ":initialCount": 0,
            ":initialRatings": [],
          },
          ReturnValues: "UPDATED_NEW",
        };

        // Update the station in the table
        const updateCommand = new UpdateCommand(updateParams);
        await docClient.send(updateCommand);

        // Logs the update for debugging
        console.log(`Updated Station_ID: ${station.Station_ID}`);
      }
    }

    // Construct response with updated table data
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
      },
      body: JSON.stringify(tableData), // Return the updated data
    };

    return response;

  } catch (err) {
    const errResponse = {
      statusCode: 400,
      body: "Failed to retrieve or update table data from Gas Station table. Error: " + err,
    };
    return errResponse;
  }
};
