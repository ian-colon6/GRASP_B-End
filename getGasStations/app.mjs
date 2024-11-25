import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({endpoint: "http://10.34.41.166:8000"}) 
const client = new DynamoDBClient()
const docClient = DynamoDBDocumentClient.from(client)
var table = process.env.TABLE_GAS_STATIONS


function toGeoJSONFeatureCollection(data) {
  return {
    type: "FeatureCollection",
    features: data.map(station => ({
      type: "Feature",
      properties: {
        Station_City: station.Station_City,
        Station_Gas_Price: station.Station_Gas_Price,
        Station_Diesel_Price: station.Station_Diesel_Price,
        Station_Premium_Price: station.Station_Premium_Price,
        Station_ID: station.Station_ID,
        Station_Name: station.Station_Name,
      },
      geometry: {
        type: "Point",
        coordinates: [station.Station_Longitude, station.Station_Lattitude]
      }
    }))
  };
}


export const lambdaHandler = async (event, context) => {
  let tableData = {};

  const params = {
    ProjectionExpression: "Station_ID, Station_City, Station_Gas_Price, Station_Lattitude, Station_Longitude, Station_Name, Station_Premium_Price,Station_Diesel_Price, RatingCount, UserRatings",
    TableName: table,
  };

  try {
    // Fetch all gas stations
    const command = new ScanCommand(params);
    const data = await docClient.send(command);
    tableData = data.Items;

    // Construct response with updated table data
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
      },
      body: JSON.stringify(toGeoJSONFeatureCollection(tableData))
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
