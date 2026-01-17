# Add Data Flow Architecture Content to MongoDB
# This script adds the animated Data Flow Architecture content entry

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Adding Data Flow Architecture Content" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set Azure Cosmos DB MongoDB connection string
# Set DATABASE_URL environment variable before running this script
# Example: $env:DATABASE_URL = "mongodb://your-connection-string"
if (-not $env:DATABASE_URL) {
    Write-Host "[ERROR] DATABASE_URL environment variable is not set" -ForegroundColor Red
    exit 1
}
$env:DATABASE_NAME = "bsg_demo"
$env:ENVIRONMENT = "development"
$env:DEBUG = "True"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Database: Azure Cosmos DB MongoDB" -ForegroundColor Gray
Write-Host "  Database Name: $env:DATABASE_NAME" -ForegroundColor Gray
Write-Host ""

# Run the script
py scripts\add_data_flow_content.py
