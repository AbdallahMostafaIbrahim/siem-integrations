# Helper Script

This script is used to migrate pipelines from elastic to opensearch

## Usage

Create a `settings.json` file and enter the fields

```json
{
  "elasticUsername": "admin",
  "elasticPassword": "admin",
  "elasticHost": "http://localhost:9200",
  "openSearchPassword": "admin",
  "openSearchUsername": "admin",
  "openSearchHost": "http://localhost:9200",
  "pipelinesStartsWith": "logs-"
}
```

Run the script

```bash
npm install
node index.js
```
