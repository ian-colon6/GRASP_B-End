import csv
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from decimal import Decimal

# Initialize the DynamoDB resource pointing to local instance
dynamodb = boto3.resource('dynamodb', endpoint_url="http://localhost:8000")

table_name = 'GasStationsTable'
csv_file_path = 'gas_stations_data.csv'

def delete_table_if_exists(table_name):
    try:
        table = dynamodb.Table(table_name)
        table.delete()
        table.wait_until_not_exists()
        print(f"Deleted existing table: {table_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"Table {table_name} does not exist, proceeding with creation.")
        else:
            print(f"Error deleting table: {e.response['Error']['Message']}")

# Should be the same as the table schema in the yaml template
def create_table():
    table = dynamodb.create_table(
        TableName=table_name,
        AttributeDefinitions=[
            {
                'AttributeName': 'Station_ID',
                'AttributeType': 'S'
            }
        ],
        KeySchema=[
            {
                'AttributeName': 'Station_ID',
                'KeyType': 'HASH'  # Partition key
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )
    table.wait_until_exists()
    print(f"Created table: {table_name}")
    return table

# Function to import data from CSV into DynamoDB
def import_csv_to_dynamodb(csv_file_path):
    table = dynamodb.Table(table_name)
    with open(csv_file_path, 'r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            # Prepare item to match DynamoDB data types
            item = {
                "Station_ID": row["Station_ID"],
                "Station_Name": row["Station_Name"],
                "Station_City": row["Station_City"],
                "Station_Lattitude": Decimal(row["Station_Lattitude"]),
                "Station_Longitude": Decimal(row["Station_Longitude"]),
                "Station_Gas_Price": Decimal(row["Station_Gas_Price"]),
                "Station_Premium_Price": Decimal(row["Station_Premium_Price"]),
                "Station_Diesel_Price": Decimal(row["Station_Diesel_Price"]),
                "RatingCount": Decimal(row["RatingCount"]),
                "UserRatings": Decimal(row["UserRatings"])
            }

            # Insert item into DynamoDB
            try:
                table.put_item(Item=item)
                print(f"Inserted item: {item}")
            except ClientError as e:
                print(f"Error inserting item: {e.response['Error']['Message']}")


delete_table_if_exists(table_name)
create_table()
import_csv_to_dynamodb(csv_file_path)
