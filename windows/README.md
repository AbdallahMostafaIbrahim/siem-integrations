# Opensearch and Windows Logs Integration

## Overview

- Install Ingestion Pipelines in Opensearch
- Install Logstash on a machine and install opensearch plugin [(Installation)](https://opensearch.org/docs/latest/tools/logstash/index/#install-logstash)
- Install and configure WinlogBeat to send to logstash [(Installation)](https://www.elastic.co/downloads/beats/winlogbeat)

## Ingestion Pipelines

Install each file in the `pipelines/` folder to opensearch using this request.
Make sure the pipeline-name is the same as the file name.

```HTTP
PUT _ingest/pipeline/pipline-name

{
  "description": "This pipeline processes student data",
  // The pipeline processors
  "processors": []
}
```

Or use the `pipeline.js` script to them. Just change the `USER` and `PASSWORD` to your settings.

```
npm install # to install the packages
node pipeline.js # to start the script
```

## Logstash Configuration

After installing Logstash and the opensearch plugin, create the file `/etc/logstash/conf.d/fortigate.conf`

```logstash
input {
  beats {
    port => 5044
  }
}

output {
  opensearch {
          hosts => ["https://hostname:9200"]
          auth_type => {
              type => 'basic'
              user => 'admin'
              password => 'password'
          }
          index  => "winlogbeat-%{+YYYY.MM.dd}"
          pipeline => "winlogbeat-8.11.3-routing"
          ssl_certificate_verification => false
   }
}
```

## Winlogbeat

After installing, move the folder to `C:\Program Files` and edit the `winlogbeat.yml` file. Comment out any outputs like elastic search and make sure you have logstash enabled.

```yaml
output.logstash:
  # The Logstash hosts
  hosts: ["68.168.208.118:5044"]
```

Install the service and start it.

```powershell
.\install-service-winlogbeat.ps1
Start-Service winlogbeat
```

This should work
