import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

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
    ProjectionExpression: "Station_ID, Station_City, Station_Gas_Price, Station_Latitude, Station_Longitude, Station_Name",
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

    return response;

  } catch (err) {
    const errResponse = {
      statusCode: 400,
      body: "Failed to retrieve data from Gas Station table. Error: " + err,
    };

    return errResponse;
  }
};
