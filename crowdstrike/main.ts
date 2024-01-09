import fs from "fs";
import { Client } from "@opensearch-project/opensearch";
import Crowdstrike from "./lib/crowdstrike";

interface Settings {
  crowdstrike: {
    client_id: string;
    client_secret: string;
    region: string;
  };
  opensearch: {
    url: string;
    username: string;
    password: string;
    index: string;
    ignore_ssl: boolean;
    pipeline?: string;
  };
  // How often to run the script in seconds
  interval?: number;
  script_state_file?: string;
}

const settings: Settings = JSON.parse(
  fs.readFileSync("settings.json").toString()
);
const { region, client_id, client_secret } = settings.crowdstrike;
const { url, index, username, password, ignore_ssl, pipeline } =
  settings.opensearch;
const interval = settings.interval || 300;
const script_state_file = settings.script_state_file || "state.json";

// Make sure settings are valid
if (!region || !client_id || !client_secret) {
  throw new Error("Crowdstrike settings are invalid.");
}

if (!url || !index || !username || !password) {
  throw new Error("OpenSearch settings are invalid.");
}

if (isNaN(interval)) {
  throw new Error("Interval setting is invalid.");
}

function sleep(ms: number) {
  console.log(`Sleeping for ${ms / 1000} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Retrieve index name with logstash date format (e.g. "crowdstrike-2021.07")
function getIndexName() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.toLocaleString("default", { month: "2-digit" });
  return `${index}-${year}.${month}`;
}

async function main() {
  while (true) {
    try {
      if (!fs.existsSync(script_state_file)) {
        fs.writeFileSync(script_state_file, JSON.stringify({ last_id: "" }));
      }
      const { last_id }: { last_id: string } = JSON.parse(
        fs.readFileSync(script_state_file).toString()
      );

      const opensearch = new Client({
        node: url,
        auth: {
          username,
          password,
        },
        ssl: {
          rejectUnauthorized: !ignore_ssl,
        },
      });

      var { body: health } = await opensearch.cluster.health({});
      console.log("Cluster Status:", health.status);
      console.log("Cluster Name:", health.cluster_name);
      console.log("Cluster Nodes:", health.number_of_nodes);
      console.log("Cluster Data Nodes:", health.number_of_data_nodes);
      console.log("Cluster Active Shards:", health.active_shards);
      console.log(
        "Cluster Active Primary Shards:",
        health.active_primary_shards
      );

      const crowdstrike = new Crowdstrike(client_id, client_secret, region);
      console.log("Refreshing access token...");
      await crowdstrike.refreshAccessToken();
      console.log("Getting detection IDs...");
      const detectionIds = await crowdstrike.getDetections();

      if (detectionIds[0] === last_id) {
        console.log("No new detections found.");
        await sleep(interval * 1000);
        continue;
      }

      if (detectionIds.length === 0) {
        console.log("No detections found.");
        await sleep(interval * 1000);
        continue;
      } else {
        fs.writeFileSync(
          script_state_file,
          JSON.stringify({ last_id: detectionIds[0] })
        );
      }

      const lastIdIndex = detectionIds.findIndex((id) => id === last_id);
      const newDetectionIds = detectionIds.slice(0, lastIdIndex);

      // Cut it to chunks of 100 to avoid hitting the API limit
      const chunkSize = 999;
      const detectionIdsChunks = [];
      for (let i = 0; i < newDetectionIds.length; i += chunkSize) {
        detectionIdsChunks.push(newDetectionIds.slice(i, i + chunkSize));
      }

      // Get detection summaries in chunks and flatten the array
      console.log("Getting detection summaries...");
      const detectionSummaries = (
        await Promise.all(
          detectionIdsChunks.map((chunk) =>
            crowdstrike.getDetectionSummaries(chunk)
          )
        )
      ).flat();

      const explodedDetectionSummaries = detectionSummaries
        .map((summary) => {
          const { behaviors, ...rest } = summary;
          return behaviors.map((behavior: any) => ({ ...rest, behavior }));
        })
        .flat();

      const { body: indexExists } = await opensearch.indices.exists({
        index: getIndexName(),
      });
      if (!indexExists) {
        console.log("Creating index...", getIndexName());
        await opensearch.indices.create({
          index: getIndexName(),
        });
      }

      // Bulk insert detection summaries
      console.log("Inserting detection summaries...");
      const body = explodedDetectionSummaries.flatMap((doc) => [
        { index: { _index: getIndexName() } },
        doc,
      ]);

      await opensearch.bulk({ body, pipeline });
    } catch (error) {
      console.error("Error in main:", error);
    }
    await sleep(interval * 1000);
  }
}

main();
