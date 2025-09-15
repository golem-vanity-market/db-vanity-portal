import jsLogger, { type ILogger } from "js-logger";
import { getAddress, getBytes, Wallet } from "ethers";
import {
  type AccountData,
  Annotation,
  createClient,
  GolemBaseClient,
  type GolemBaseCreate,
  GolemBaseUpdate,
  Tagged,
} from "golem-base-sdk";
import { startStatusServer } from "./server.ts";
import { operations } from "./queries.ts";
import { ProviderData } from "../../shared/src/provider.ts";
import dotenv from "dotenv";
import { serializeProvider } from "../../shared/src/provider.ts";

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

async function tryCreateEntitiesWithRetry(
  client: GolemBaseClient,
  entitiesToInsert: GolemBaseCreate[],
): Promise<number> {
  const maxRetries = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      await client.createEntities(entitiesToInsert);
      entitiesToInsert.length = 0;
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
      entitiesToUpdate.length = 0;
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
          const res = await tryCreateEntitiesWithRetry(
            client,
            entitiesToInsert,
          );
          if (res >= 1) {
            return res;
          }
        }
        if (
          (no == noProv && entitiesToUpdate.length > 0) ||
          entitiesToUpdate.length >= 50
        ) {
          const res = await updateEntitiesWithRetry(client, entitiesToUpdate);
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
        const existing = await client.queryEntities(
          `provId="${getAddress(prov.providerId).toLowerCase()}"`,
        );

        const newData = serializeProvider(prov);

        if (existing.length > 0) {
          if (uint8ArraysEqual(existing[0].storageValue, newData)) {
            log.info(
              `Entity for provider ${prov.providerId} is up to date, skipping...`,
            );
            continue;
          }
          log.info("Updating entity for provider", prov.providerId, "...");

          entitiesToUpdate.push({
            entityKey: existing[0].entityKey,
            data: newData,
            btl: BTL,
            stringAnnotations: [
              new Annotation(
                "provId",
                getAddress(prov.providerId).toLowerCase(),
              ),
            ],
            numericAnnotations: [],
          });

          continue;
        } else {
          log.info(`Creating entity for provider ${prov.providerId}...`);
        }
        const entity: GolemBaseCreate = {
          data: newData,
          btl: BTL,
          stringAnnotations: [
            new Annotation("provId", getAddress(prov.providerId).toLowerCase()),
          ],
          numericAnnotations: [],
        };
        entitiesToInsert.push(entity);
        //const receipts = await client.createEntities([entity])
        //log.info("Created entities:", receipts.map((r) => r.entityKey.toString()));
      }

      console.log(
        "Entities to insert:",
        entitiesToInsert.length,
        "to update:",
        entitiesToUpdate.length,
      );
    } catch (e) {
      log.error("Failed to create entities:", e);
      continue;
    }
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
