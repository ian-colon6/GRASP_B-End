import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ endpoint: "http://10.34.41.166:8000" });
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);
const table = process.env.TABLE_GAS_STATIONS;

function toGeoJSONFeatureCollection(station) {
  return {
    type: "FeatureCollection",
    features: {
      type: "Feature",
      properties: {
        Station_City: station.Station_City,
        Station_Gas_Price: station.Station_Gas_Price,
        Station_Diesel_Price: station.Station_Diesel_Price,
        Station_Premium_Price: station.Station_Premium_Price,
        Station_ID: station.Station_ID,
        Station_Name: station.Station_Name,
        RatingCount: station.RatingCount,
        UserRatings: station.UserRatings
      },
      geometry: {
        type: "Point",
        coordinates: [station.Station_Longitude, station.Station_Lattitude]
      }
    }
  };
}

export const lambdaHandler = async (event, context) => {
  const stationId = event.queryStringParameters.Station_ID; // Extract Station_ID from query params  

  const params = {
    TableName: table,
    Key: {
      Station_ID: stationId,
    },
    ProjectionExpression: "Station_ID, Station_City, Station_Gas_Price, Station_Lattitude, Station_Longitude, Station_Name, Station_Premium_Price,Station_Diesel_Price, RatingCount, UserRatings",
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
      body: JSON.stringify(toGeoJSONFeatureCollection(data.Item)), // No need to wrap data.Item in another JSON.stringify
    };

    return response;

  } catch (err) {
    const errResponse = {
      statusCode: 400,
      body: "event"+ JSON.stringify(event) +"Failed to retrieve data from Gas Station table. Error: " + err,
    };

    return errResponse;
  }
};