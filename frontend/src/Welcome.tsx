import React, { useEffect, useMemo, useCallback } from "react";
import { createROClient } from "golem-base-sdk";

const Welcome = () => {
  const [current_block, setCurrentBlock] = React.useState<bigint | null>(null);
  const client = useMemo(
    () =>
      createROClient(
        parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID || ""),
        import.meta.env.VITE_GOLEM_DB_RPC || "",
        import.meta.env.VITE_GOLEM_DB_RPC_WS || "",
      ),
    [],
  );
  const update_current_block = useCallback(async () => {
    const blockNumber = await client.getRawClient().httpClient.getBlockNumber();
    console.log("Current block number:", blockNumber);
    setCurrentBlock(blockNumber);
  }, [client]);

  useEffect(() => {
    update_current_block();
    const interval = setInterval(() => {
      update_current_block();
    }, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [client, update_current_block]);
  return (
    <div className="w-full">
      <div className="rounded bg-blue-50 p-6 text-center shadow">
        <h1 className="mb-2 text-2xl font-bold">Welcome</h1>
        <p className="text-gray-700">
          This project displays provider estimations and is currently{" "}
          <span className="font-semibold text-orange-600">experimental</span>.
        </p>
        <p className="mt-2 text-gray-700">
          Data is presented based on the best available information, <br />
          but may not always be accurate or up-to-date.
        </p>

        {current_block === null ? (
          <p className="mt-4 text-gray-700">Checking connection to Golem:DB blockchain...</p>
        ) : (
          <p className="mt-4 text-gray-700">
            Current Ethereum Block: <span className="font-semibold text-green-600">{current_block.toString()}</span>
          </p>
        )}
      </div>
    </div>
  );
};
export default Welcome;
