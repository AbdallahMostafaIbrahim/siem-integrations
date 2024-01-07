# Opensearch and Fortigate Logs Integration

## Overview

- Install Ingestion Pipelines in Opensearch
- Install Logstash on a machine and install opensearch plugin [(Installation)](https://opensearch.org/docs/latest/tools/logstash/index/#install-logstash)
- Configure Fortigate Firewall to send syslog to Logstash server

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
  udp {
    port => 5144
    host => "fortigate-ip"
  }
}

filter {
  mutate { remove_field => [ "@timestamp", "event", "@version" ] }
}

output {
 opensearch {
          hosts => ["https://opensearch-ip:9200"]
          auth_type => {
              type => 'basic'
	          user => 'user'
              password => 'password'
          }
          index  => "logs-fortigate-%{+YYYY.MM.dd}"
          pipeline => "logs-fortinet_fortigate.log-1.23.0" # or name of pipeline configured
	      ssl_certificate_verification => false
   }
}
```

## Fortigate Configuration

In the fortigate cli, you have to enable syslog forwarding and set the ip and port for the configuration

```fortigate
config log syslogd setting
    set status enable
    set server "logstash-ip"
    set port 5144
    set facility local7
    set source-ip "fortigate-ip"
    set format default
    set priority default
    set mode	udp
end
```

With this setup fortigate should be able to send logs to logstash, and logstash sends them over to opensearch.
