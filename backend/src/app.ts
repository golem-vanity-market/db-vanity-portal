import jsLogger, { type ILogger } from "js-logger";
import { getBytes, Wallet } from "ethers";
import { type AccountData, createClient, Tagged } from "golem-base-sdk";
import { startStatusServer } from "./server.ts";
import { operations } from "./queries.ts";
import dotenv from "dotenv";
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

async function init() {
  log.info("Connecting to Golem DB client...");

  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "");
  log.info("Successfully decrypted wallet for account", wallet.address);

  const key: AccountData = new Tagged(
    "privatekey",
    getBytes(wallet.privateKey),
  );

  const client = await createClient(
    parseInt(process.env.GOLEM_DB_CHAIN_ID || "60138453033"),
    key,
    process.env.GOLEM_DB_RPC || "https://ethwarsaw.holesky.golemdb.io/rpc",
      process.env.GOLEM_DB_RPC_WS || "wss://ethwarsaw.holesky.golemdb.io/rpc/ws",
  );

  const port = process.env.PORT || 5555;
  log.info(`Starting server at http://localhost:${port}`);
  startStatusServer(`http://localhost:${port}`);

  while (true) {
    const block = await client.getRawClient().httpClient.getBlockNumber();
    log.info("Current Ethereum block number is", block);
    log.info("Connected to Golem DB as", wallet.address);

    operations.updateBlockInfo({
        number: block,
        date: new Date().toISOString(),
    })
    await new Promise((resolve) => setTimeout(resolve, 5000));



  }

  // Fill your initialization code here
}

init()
  .then(() => {})
  .catch((e) => {
    log.error(e);
    process.exit(1);
  });
