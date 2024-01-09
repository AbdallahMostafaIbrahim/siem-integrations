# Opensearch and Crowdstrike Detections Integration Script

This javascript script will pull data from the Crowdstrike API and ingest it into Opensearch.
To use this script, you will need to have a Crowdstrike API Client Secret and Client ID that has permission to read detections.

## Installation

1. Clone this repository
2. Install dependencies with `npm install`
3. Copy the `settings.example.json` file to `settings.json` and fill in your correct values

```json
{
  "$schema": "./schema.json",
  "crowdstrike": {
    "client_id": "client_id",
    "client_secret": "client_secret",
    "region": "us-2"
  },
  "opensearch": {
    "url": "https://opensearch:9200",
    "username": "admin",
    "password": "password",
    "index": "crowdstrike",
    "ignore_ssl": true,
    "pipeline": ""
  },
  "interval": 300,
  "script_state_file": "./state.json"
}
```

4. Build the script with `npm run build`
5. Run the script with `node dist/index.js`

After running the script, you should see data in your Opensearch index.

## Run as a service (Optional + Not sure if this works)

1. Install pm2 with `npm install -g pm2`
2. Start the script with `pm2 start dist/index.js --name crowdstrike`
3. Save the process list with `pm2 save`
4. Generate the startup script with `pm2 startup`
5. Copy the output of the previous command and run it as root
6. Save the process list again with `pm2 save`

## Todo

Create pipeline to parse the data into the correct format for the index.
