import React, { useCallback, useEffect } from "react";
import { backendUrl } from "./utils";

interface ProviderData {
  grouped: string;
  byProviderId: Record<
    string,
    {
      providerName: string;
      providerId: string;
      numberOfJobs: number;
      totalWork: number;
      jobId: string;
      totalCost: number;
      totalWorkHours: number;
    }
  >;
}

const Providers = () => {
  const [providerData, setProviderData] = React.useState<ProviderData | null>(
    null,
  );
  const [loading, setLoading] = React.useState<boolean>(false);

  const check_backend = useCallback(async () => {
    try {
      const response = await fetch(`${backendUrl()}/providers`);
      if (response.ok) {
        const data = await response.json();
        const providers = data.providers || null;
        setProviderData(providers);
        setLoading(false);
      } else {
        alert("Backend is not reachable");
        setLoading(false);
      }
    } catch (error) {
      alert("Error connecting to backend");
      setLoading(false);
    }
  }, []);

  const onLoad = useCallback(async () => {
    //sleep for 1 second to allow backend to start
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await check_backend();
  }, [check_backend]);

  useEffect(() => {
    onLoad().then(() => console.log("Fetched provider data"));
  }, [onLoad]);

  return (
    <div className="rounded bg-blue-50 p-6 text-center shadow">
      <h1 className="mb-2 text-2xl font-bold">Providers</h1>
      <p className="text-gray-700">
        This project displays provider estimations and is currently{" "}
        <span className="font-semibold text-orange-600">experimental</span>.
      </p>
      <p className="mt-2 text-gray-700">
        Data is presented based on the best available information, <br />
        but may not always be accurate or up-to-date.
      </p>

      <button
        onClick={() => onLoad()}
        className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Refresh Data
      </button>

      {loading && <p className="mt-4 text-gray-600">Loading...</p>}

      <div className="mt-6 text-left">
        {providerData?.byProviderId ? (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Object.values(providerData.byProviderId).map((provider) => (
              <li
                key={provider.providerId}
                className="rounded-lg border bg-white p-4 shadow"
              >
                <h2 className="text-lg font-semibold text-blue-700">
                  {provider.providerName}
                </h2>
                <p className="text-sm text-gray-600">
                  Provider ID:{" "}
                  <span className="font-mono">{provider.providerId}</span>
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>Number of Jobs: {provider.numberOfJobs}</p>
                  <p>Total Work: {provider.totalWork}</p>
                  <p>Total Cost: ${provider.totalCost.toFixed(2)}</p>
                  <p>Total Work Hours: {provider.totalWorkHours}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-gray-600">
            No provider data available. Click the button above to fetch data.
          </p>
        )}
      </div>
    </div>
  );
};

export default Providers;
