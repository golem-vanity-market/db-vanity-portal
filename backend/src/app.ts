import jsLogger, { type ILogger } from "js-logger";
import { getAddress, getBytes, Wallet } from "ethers";
import {
  type AccountData,
  Annotation,
  createClient,
  type GolemBaseClient,
  type GolemBaseCreate,
  type GolemBaseUpdate,
  type Hex,
  Tagged,
} from "golem-base-sdk";
import { startStatusServer } from "./server.ts";
import { operations } from "./queries.ts";
import {
  ProviderData,
  type ProviderDataEntry,
} from "../../shared/src/provider.ts";
import dotenv from "dotenv";
import { serializeProvider } from "../../shared/src/provider.ts";
import { fetchAllEntitiesRaw } from "../../shared/src/query.ts";

dotenv.config();

// Configure logger for convenience
jsLogger.useDefaults();
// @ts-ignore
jsLogger.setLevel(jsLogger.DEBUG);
jsLogger.setHandler(
  jsLogger.createDefaultHandler({
    formatter: function (messages, context) {
      // prefix each log message with a timestamp.
      messages.unshift(`[${new Date().toISOString()} ${context.level.name}]`);
    },
  }),
);

export const log: ILogger = jsLogger.get("myLogger");

function uint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const BTL = parseInt(process.env.GOLEM_DB_TTL || "120") / 2; // default 2 minutes

function numberToSortableString(
  num: number,
  {
    intWidth = 10, // max digits for integer part
    fracWidth = 8, // digits after decimal
    unit = "",
  } = {},
) {
  //const sign = num < 0 ? "-" : "+";
  const abs = Math.abs(num);
  const [intPart, fracPart = ""] = abs.toString().split(".");

  if (num == Infinity) {
    return `${"".padStart(intWidth, "9")}.${"".padEnd(fracWidth, "9")}${unit}`;
  }

  const intPadded = intPart.padStart(intWidth, "_");
  const fracPadded = fracPart.padEnd(fracWidth, "0").slice(0, fracWidth);

  return `${intPadded}.${fracPadded}${unit}`;
}

async function createEntitiesWithRetry(
  client: GolemBaseClient,
  entitiesToInsert: GolemBaseCreate[],
): Promise<number> {
  const maxRetries = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      await client.createEntities(entitiesToInsert);
      log.info(`Inserted ${entitiesToInsert.length} entities, continuing...`);
      break;
    } catch (e) {
      log.error(
        `Failed to create entities on attempt ${attempt}/${maxRetries}:`,
        e,
      );
      if (attempt >= maxRetries) {
        log.error("Max retries reached, giving up ..., stopping process");
        return 1;
      } else {
        const backoffTime = attempt * 5000; // Exponential backoff
        log.info(`Retrying in ${backoffTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
  }
  return 0;
}

async function updateEntitiesWithRetry(
  client: GolemBaseClient,
  entitiesToUpdate: GolemBaseUpdate[],
): Promise<number> {
  const maxRetries = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      await client.updateEntities(entitiesToUpdate);
      log.info(`Updated ${entitiesToUpdate.length} entities, continuing...`);
      break;
    } catch (e) {
      log.error(
        `Failed to update entities on attempt ${attempt}/${maxRetries}:`,
        e,
      );
      if (attempt >= maxRetries) {
        log.error("Max retries reached, giving up ..., stopping process");
        return 1;
      } else {
        const backoffTime = attempt * 5000; // Exponential backoff
        log.info(`Retrying in ${backoffTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }
  }
  return 0;
}

function getMetadata(prov: ProviderDataEntry, groupNo: number) {
  return {
    stringAnnotations: [
      new Annotation("name", prov.providerName),
      new Annotation("provId", getAddress(prov.providerId).toLowerCase()),
      new Annotation(
        "totalWorkHours",
        numberToSortableString(prov.totalWorkHours, {
          intWidth: 3,
          fracWidth: 3,
          unit: "h",
        }),
      ),
      new Annotation(
        "totalWorkHours24h",
        numberToSortableString(prov.totalWorkHours24h, {
          intWidth: 3,
          fracWidth: 3,
          unit: "h",
        }),
      ),
      new Annotation(
        "totalWork",
        numberToSortableString(prov.totalWork / 1e9, {
          unit: "G",
          intWidth: 6,
          fracWidth: 2,
        }),
      ),
      new Annotation(
        "totalWork24h",
        numberToSortableString(prov.totalWork24h / 1e9, {
          unit: "G",
          intWidth: 6,
          fracWidth: 2,
        }),
      ),
      new Annotation(
        "totalCost",
        numberToSortableString(prov.totalCost, {
          intWidth: 5,
          fracWidth: 5,
          unit: "GLM",
        }),
      ),
      new Annotation(
        "totalCost24h",
        numberToSortableString(prov.totalCost, {
          intWidth: 5,
          fracWidth: 5,
          unit: "GLM",
        }),
      ),
      new Annotation(
        "longestJob",
        numberToSortableString(prov.longestJob, {
          intWidth: 2,
          fracWidth: 3,
          unit: "h",
        }),
      ),
      new Annotation(
        "longestJob24h",
        numberToSortableString(prov.longestJob24h, {
          intWidth: 2,
          fracWidth: 3,
          unit: "h",
        }),
      ),
      new Annotation(
        "speed",
        numberToSortableString(prov.speed / 1e9, {
          intWidth: 3,
          fracWidth: 2,
          unit: "G/s",
        }),
      ),
      new Annotation(
        "speed24h",
        numberToSortableString(prov.speed24h / 1e9, {
          intWidth: 3,
          fracWidth: 2,
          unit: "G/s",
        }),
      ),
      new Annotation(
        "efficiency",
        numberToSortableString(prov.efficiency / 1e12, {
          intWidth: 5,
          fracWidth: 2,
          unit: "TH/GLM",
        }),
      ),
      new Annotation(
        "efficiency24h",
        numberToSortableString(prov.efficiency24h / 1e12, {
          intWidth: 5,
          fracWidth: 2,
          unit: "TH/GLM",
        }),
      ),
      new Annotation(
        "lastJobDate",
        new Date(prov.lastJobDate).toISOString().slice(0, 19) + "Z",
      ),
    ],
    numericAnnotations: [
      new Annotation("group", groupNo),
      new Annotation("numberOfJobs", prov.numberOfJobs),
      new Annotation("numberOfJobs24h", prov.numberOfJobs24h),
    ],
  };
}

async function init() {
  log.info("Connecting to Golem DB client...");

  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "");
  log.info("Successfully decrypted wallet for account", wallet.address);

  const key: AccountData = new Tagged(
    "privatekey",
    getBytes(wallet.privateKey),
  );

  const client = await createClient(
    parseInt(process.env.GOLEM_DB_CHAIN_ID || ""),
    key,
    process.env.GOLEM_DB_RPC || "",
    process.env.GOLEM_DB_RPC_WS || "",
  );

  const port = process.env.PORT || 5555;
  log.info(`Starting server at http://localhost:${port}`);
  startStatusServer(`http://localhost:${port}`);

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    //download data

    try {
      const providerDataResp = await fetch(
        `${process.env.GROUPED_ESTIMATORS_DOWNLOAD_URL}`,
      );
      const providersJson = await providerDataResp.json();
      if (providerDataResp.status !== 200) {
        log.error("Failed to fetch provider data:", providersJson);
        continue;
      }
      operations.updateProviderData(new ProviderData(providersJson));
    } catch (e) {
      log.error(`Failed to fetch provider data ${e}`);
      operations.updateProviderData(null);
    }

    let rawEntities: Record<
      string,
      {
        entityKey: Hex;
        storageValue: Uint8Array;
      }
    > = {};
    try {
      rawEntities = await fetchAllEntitiesRaw(client, 10, wallet.address);
    } catch (ex) {
      log.error("Failed to fetch existing entities:", ex);
      continue;
    }
    try {
      const block = await client.getRawClient().httpClient.getBlockNumber();
      log.info("Current Ethereum block number is", block);
      log.info("Connected to Golem DB as", wallet.address);

      const ethBalance = await client.getRawClient().httpClient.getBalance({
        address: `0x${wallet.address.replace("0x", "").toLowerCase()}`,
      });
      log.info(`Current ETH balance is ${ethBalance.toString()}`);

      const entitiesToInsert = [];
      const entitiesToUpdate = [];

      const byProvId = operations.getProviderData()?.byProviderId ?? {};
      const noProv = Object.keys(byProvId).length;
      for (let no = 0; ; no++) {
        console.log(`Processing ${no}/${Object.keys(byProvId).length}`);
        if (
          (no == noProv && entitiesToInsert.length > 0) ||
          entitiesToInsert.length >= 50
        ) {
          const res = await createEntitiesWithRetry(client, entitiesToInsert);
          entitiesToInsert.length = 0;
          if (res >= 1) {
            return res;
          }
        }
        if (
          (no == noProv && entitiesToUpdate.length > 0) ||
          entitiesToUpdate.length >= 50
        ) {
          const res = await updateEntitiesWithRetry(client, entitiesToUpdate);
          entitiesToUpdate.length = 0;
          if (res >= 1) {
            return res;
          }
        }
        if (no >= noProv) {
          break;
        }

        const prov = byProvId[Object.keys(byProvId)[no]];
        if (!prov) {
          continue;
        }
        const existing = rawEntities[prov.providerId] ?? null;

        const newData = serializeProvider(prov);

        if (existing) {
          if (uint8ArraysEqual(existing.storageValue, newData)) {
            log.info(
              `Entity for provider ${prov.providerId} is up to date, skipping...`,
            );
            continue;
          }
          log.info("Updating entity for provider", prov.providerId, "...");
          entitiesToUpdate.push({
            entityKey: existing.entityKey,
            data: newData,
            btl: BTL,
            ...getMetadata(prov, (no % 10) + 1),
          });

          continue;
        } else {
          log.info(`Creating entity for provider ${prov.providerId}...`);
        }
        const entity: GolemBaseCreate = {
          data: newData,
          btl: BTL,
          ...getMetadata(prov, (no % 10) + 1),
        };
        entitiesToInsert.push(entity);
        //const receipts = await client.createEntities([entity])
        //log.info("Created entities:", receipts.map((r) => r.entityKey.toString()));
      }

      console.log(
        "Entities to insert (should be null):",
        entitiesToInsert.length,
        "to update also null:",
        entitiesToUpdate.length,
      );
    } catch (e) {
      log.error("Failed to create entities:", e);
      continue;
    }
    //code should never reach here

    console.log("Cycle complete, sleeping...");

    //wait 5 minutes before next update
    const waitSecs = 300;
    await new Promise((resolve) => setTimeout(resolve, waitSecs * 1000));
  }
  // Fill your initialization code here
}

init()
  .then((code) => {
    process.exit(code);
  })
  .catch((e) => {
    log.error(e);
    process.exit(1);
  });
