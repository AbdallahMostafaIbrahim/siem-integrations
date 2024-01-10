import axios from "axios";
import { readFileSync, readdirSync } from "fs";
import { Agent } from "https";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const instance = axios.create({
  httpsAgent: new Agent({
    rejectUnauthorized: false,
  }),
});

const settings = JSON.parse(readFileSync("./settings.json").toString());

if (!settings.host) {
  console.log("Please add host to settings.json");
  process.exit(1);
} else if (!settings.username) {
  console.log("Please add username to settings.json");
  process.exit(1);
} else if (!settings.password) {
  console.log("Please add password to settings.json");
  process.exit(1);
}

const USER = settings.username;
const PASSWORD = settings.password;
const HOST = settings.host;

const createPipelineInOpenSearch = async (name, body) => {
  const response = await instance.put(
    `${HOST}/_ingest/pipeline/${name}`,
    body,
    {
      auth: {
        username: USER,
        password: PASSWORD,
      },
    }
  );
  return response.data;
};

const main = async () => {
  const folder = "./pipelines";

  const files = readdirSync(folder);

  for (const file of files) {
    const pipeline = JSON.parse(readFileSync(`${folder}/${file}`));
    try {
      // remove .json from file name
      const pipelineName = file.slice(0, -5);
      console.log(`Creating pipeline ${pipelineName}`);
      await createPipelineInOpenSearch(pipelineName, pipeline);
      console.log("Done");
    } catch (error) {
      if (error.response) {
        console.dir(error.response.data, { depth: null });
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log("Error", error.message);
      }
    }
  }
};

main();
