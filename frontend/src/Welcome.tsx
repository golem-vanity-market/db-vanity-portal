import React, { useEffect, useMemo, useCallback } from "react";
import { createROClient } from "golem-base-sdk";
import { Button } from "./components/ui/button";

const Welcome = () => {
  return (
    <div className="w-full">
      <div className="m-2 rounded bg-blue-50 p-6 text-center shadow">
        <h1 className="mb-2 text-2xl font-bold">Welcome</h1>
        <p className="text-gray-700">
          This project displays provider estimations and is currently{" "}
          <span className="font-semibold text-orange-600">experimental</span>.
          <Button variant="outline" className="mt-4">
            Learn More
          </Button>
        </p>
      </div>
      <div className="m-2 rounded bg-blue-50 p-6 text-center shadow">
        <p className="mt-2 text-gray-700">
          Data is presented based on the best available information, <br />
          but may not always be accurate or up-to-date.
        </p>
      </div>
      <div className="m-2 rounded bg-blue-50 p-6 text-center shadow">
        <p>
          Data is presented using aggregator on address{" "}
          <a
            className="ml-1 font-semibold text-blue-600"
            href={`https://explorer.ethwarsaw.holesky.golemdb.io/address/${
              import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS
            }`}
          >
            {import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS} &rarr;
          </a>
        </p>
      </div>
      <div className="m-2 rounded bg-blue-50 p-6 text-center shadow">
        <p>
          Go to the providers tab to see the list of providers and their estimations.
          <a href={`${import.meta.env.BASE_URL}/providers`} className="ml-1 font-semibold text-blue-600">
            Providers &rarr;
          </a>
        </p>
      </div>
    </div>
  );
};
export default Welcome;
