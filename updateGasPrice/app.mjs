import {DynamoDBClient} from "@aws-sdk/client-dynamodb"
import {DynamoDBDocumentClient,ScanCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
var table = process.env.TABLE_GAS_STATIONS
export const lambdaHandler = async (event, context) => {
  try{
    
    const station = JSON.parse(event.body)
    console.log("Station for update",station)
    if(!station.Station_ID || !station.Station_Gas_Price || station.Station_ID === undefined || station.Station_Gas_Price === undefined){
      throw new Error("Station_ID and Station_Gas_Price must be provided")

    }
    const stationId = station.Station_ID
    const newPrice = station.Station_Gas_Price
    const upateParams = {
      TableName : table,
      Key: {
        Station_ID: stationId // Match the Partition Key
       },
      UpdateExpression: "SET Station_Gas_Price = :newPrice",
      ExpressionAttributeValues: {
        ":newPrice": newPrice,
      }
    }
    await docClient.send(new UpdateCommand(upateParams));
    const response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Methods': 'OPTIONS,PUT'
        
      },
      body: "Price Updated",
    };

    return response;
    
  }
  catch(error){
    console.log(error)
    const errResponse = {
      statusCode: 400,
      body: ("Failed to update price, Error: "+error)
      
    };

    return errResponse;

  }



   
  };
  