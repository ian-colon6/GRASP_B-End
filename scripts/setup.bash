#!/bin/bash
# make sure your excecuting this script on this folder
# please make sure local dynamo db is running using this command:
#                   docker run -p 8000:8000 amazon/dynamodb-local

# Define paths
VENV_DIR=".temp_env"  # Temporary virtual environment directory
PYTHON_SCRIPT="import_csv_to_dynamo.py"  # Your Python script

# Check if Python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install Python3 to continue."
    exit 1
fi

# Create a temporary virtual environment
echo "Creating virtual environment..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# Install boto3 in the virtual environment
echo "Installing boto3..."
pip install boto3

# Run the Python script
echo "Running the Python script..."
python "$PYTHON_SCRIPT"

# Deactivate and remove the virtual environment
echo "Cleaning up..."
deactivate
rm -rf "$VENV_DIR"

echo "Done!"