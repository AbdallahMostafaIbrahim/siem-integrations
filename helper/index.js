import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { Agent } from "https";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const settings = JSON.parse(readFileSync("settings.json").toString());

const {
  elasticUsername,
  elasticPassword,
  elasticHost,
  openSearchPassword,
  openSearchUsername,
  openSearchHost,
  pipelinesStartsWith,
} = settings;

const instance = axios.create({
  httpsAgent: new Agent({
    rejectUnauthorized: false,
  }),
});

const getPipelineFromElastic = async () => {
  const response = await instance.get(`${elasticHost}/_ingest/pipeline`, {
    auth: {
      username: elasticUsername,
      password: elasticPassword,
    },
  });
  return response.data;
};

const createPipelineInOpenSearch = async (name, body) => {
  const response = await instance.put(
    `${openSearchHost}/_ingest/pipeline/${name}`,
    body,
    {
      auth: {
        username: openSearchUsername,
        password: openSearchPassword,
      },
    }
  );
  return response.data;
};

const writePipelineToFile = async (file) => {
  const pipelines = await getPipelineFromElastic();
  writeFileSync(file, JSON.stringify(pipelines, null, 2));
};

const fixPipeline = (pipeline) => {
  // 1. Remove _meta
  delete pipeline._meta;

  // 2. Remove all fingerprint and network_direction and registered_domain and community_id processors
  pipeline.processors = pipeline.processors.filter(
    (processor) =>
      processor.fingerprint == null &&
      processor.network_direction == null &&
      processor.registered_domain == null &&
      processor.community_id == null
  );

  // 3. Remove set processors with copy_from field
  pipeline.processors = pipeline.processors.filter(
    (processor) => processor.set == null || processor.set.copy_from == null
  );

  // 4. Remove convert processors with type: "ip"
  pipeline.processors = pipeline.processors.filter(
    (processor) => processor.convert == null || processor.convert.type !== "ip"
  );

  // Remove all processors under a foreach processor that is a convert processor with type: "ip"
  // Make sure processors exists
  // If that convert processor has type: "ip", Remove the whole foreach processor
  pipeline.processors = pipeline.processors.filter((processor) => {
    if (processor.foreach == null) {
      return true;
    }
    if (processor.foreach.processor?.convert != null) {
      if (processor.foreach.processor.convert.type === "ip") {
        return false;
      }
    }
    return true;
  });

  // 5. Remove pipeline processors with ignore_missing_pipelines: true
  pipeline.processors = pipeline.processors.filter(
    (processor) =>
      processor.pipeline == null ||
      processor.pipeline.ignore_missing_pipeline !== true
  );

  // 6. Remove any ecs_compatiblity field in processors
  pipeline.processors = pipeline.processors.map((processor) => {
    Object.keys(processor).forEach((key) => {
      delete processor[key].ecs_compatibility;
    });
    return processor;
  });

  // console.dir(pipeline, { depth: null });
  return pipeline;
};

const main = async () => {
  const file = "pipelines.json";
  await writePipelineToFile(file);
  // process.exit();
  // Read File and parse
  var pipelines = JSON.parse(readFileSync(file).toString());
  // Find all pipelines with name starting with winlogbeat
  const names = Object.keys(pipelines).filter((name) =>
    name.startsWith(pipelinesStartsWith)
  );

  // Loop through all pipelines
  for (const name of names) {
    const pipeline = pipelines[name];
    const newPipeline = fixPipeline(pipeline);

    try {
      console.log("Creating pipeline: ", name);
      const ok = await createPipelineInOpenSearch(name, newPipeline);
      console.log(ok);
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.dir(error.response.data, { depth: null });
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // error.request is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
    }
  }
};

main();
