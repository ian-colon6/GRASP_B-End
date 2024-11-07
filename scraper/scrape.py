import requests
from bs4 import BeautifulSoup
import boto3

table_name = 'GasStationsTable'

def scrape(event=None, context=None):
     # Initialize DynamoDB resource
    dynamodb = boto3.resource('dynamodb', endpoint_url="http://10.34.4.143:8000") #replace endpoint with your local ip
    table = dynamodb.Table(table_name)
    data = event['stations']

    for gas_station in data:
        # Search for stations with a similar name
        response = table.scan(
            FilterExpression="contains(Station_Name, :name)",
            ExpressionAttributeValues={':name': gas_station['name']}
        )
        print(gas_station['name'], len(response['Items']))
        for item in response['Items']:
            # Update the price for each matching station
            table.update_item(
                Key={'Station_ID': item['Station_ID']},
                UpdateExpression="set Station_Gas_Price = :price",
                ExpressionAttributeValues={':price': gas_station['prices']['regular']}
            )