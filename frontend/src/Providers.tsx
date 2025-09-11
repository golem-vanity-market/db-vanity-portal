import React, { useCallback, useEffect } from "react";
import { backendUrl } from "./utils";
import { ProviderData, ProviderDataEntry } from "../../shared/src/provider";

const CACHE_KEY = "providerDataCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface FilterCriteria {
  minWorkHours: number | null;
  minWorkHours24h: number | null;
  minTotalCost: number | null;
  minTotalCost24h: number | null;
  minNumberOfJobs: number | null;
  minNumberOfJobs24h: number | null;
  providerNameSearch: string | null;

  sortBy:
    | "providerName"
    | "totalWork"
    | "totalWork24h"
    | "totalCost"
    | "totalCost24h"
    | "numberOfJobs"
    | "numberOfJobs24h"
    | "totalWorkHours"
    | "totalWorkHours24h"
    | "lastJobDate"
    | "longestJob";
  sortOrder: "asc" | "desc";
}

const defaultFilterCriteria = (): FilterCriteria => {
  return {
    minWorkHours: 0.1,
    minWorkHours24h: 0.0,
    minTotalCost: null,
    minTotalCost24h: null,
    minNumberOfJobs: null,
    minNumberOfJobs24h: null,
    providerNameSearch: null,
    sortBy: "providerName",
    sortOrder: "asc",
  };
};

const Providers = () => {
  const [loading, setLoading] = React.useState(false);

  const loadCachedCriteria = (): FilterCriteria => {
    const cachedCriteria = localStorage.getItem("providerFilterCriteria");
    if (cachedCriteria) {
      try {
        return JSON.parse(cachedCriteria);
      } catch {
        return defaultFilterCriteria();
      }
    }
    return defaultFilterCriteria();
  };

  const [maxDisplayRows] = React.useState<number>(1000);
  const [filterCriteria, setFilterCriteriaInt] =
    React.useState<FilterCriteria>(loadCachedCriteria());

  const saveCriteriaToCache = (criteria: FilterCriteria) => {
    localStorage.setItem("providerFilterCriteria", JSON.stringify(criteria));
  };

  const setFilterCriteria = useCallback((criteria: FilterCriteria) => {
    setFilterCriteriaInt(criteria);
    saveCriteriaToCache(criteria);
  }, []);

  useEffect(() => {
    const cachedCriteria = localStorage.getItem("providerFilterCriteria");
    if (cachedCriteria) {
      try {
        const parsed = JSON.parse(cachedCriteria);
        setFilterCriteria(parsed);
      } catch {
        // ignore
      }
    }
  }, [setFilterCriteria]);

  const saveCache = (data: ProviderData) => {
    const cache = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  };

  const loadCache = (): ProviderData | null => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.data;
      } else {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
    } catch {
      return null;
    }
  };

  const [providerData, setProviderData] = React.useState<ProviderData | null>(
    loadCache(),
  );

  const getFilteredProviders = useCallback(() => {
    if (!providerData) return [];
    const filtered: ProviderDataEntry[] = [];

    for (const providerId in providerData.byProviderId) {
      const provider = providerData.byProviderId[providerId];

      // ✅ fix filtering bug: use && not ||
      if (
        filterCriteria.minWorkHours !== null &&
        provider.totalWorkHours < filterCriteria.minWorkHours
      ) {
        continue;
      }
      if (
        filterCriteria.minWorkHours24h !== null &&
        provider.totalWorkHours24h < filterCriteria.minWorkHours24h
      ) {
        continue;
      }

      filtered.push(provider);
    }

    // ✅ apply sorting
    const { sortBy, sortOrder } = filterCriteria;
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortBy === "providerName") {
        aVal = a.providerName?.toLowerCase() || "";
        bVal = b.providerName?.toLowerCase() || "";
      } else {
        aVal = (a as any)[sortBy] ?? 0;
        bVal = (b as any)[sortBy] ?? 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [providerData, filterCriteria]);

  const totalProviderCount = useCallback(() => {
    return providerData ? Object.keys(providerData.byProviderId).length : 0;
  }, [providerData]);

  const check_backend = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl()}/providers`);
      if (response.ok) {
        const data = await response.json();
        const providers = data.providers || null;
        if (providers) {
          setProviderData(providers);
          saveCache(providers);
        }
      } else {
        alert("Backend is not reachable");
      }
    } catch (error) {
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  }, []);

  const onLoad = useCallback(async () => {
    const cachedData = loadCache();
    if (cachedData) {
      setProviderData(cachedData);
      setLoading(false);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await check_backend();
  }, [check_backend]);

  useEffect(() => {
    onLoad().then(() => console.log("Provider data loaded (cache or backend)"));
  }, [onLoad]);

  const displayProvider = useCallback(
    (row: number, provider: ProviderDataEntry) => {
      if (row > maxDisplayRows) return null;
      return (
        <li
          key={provider.providerId}
          className="rounded-lg border bg-white p-4 shadow"
        >
          <h2 className="text-lg font-semibold text-blue-700">
            {row + 1} - {provider.providerName}
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
      );
    },
    [maxDisplayRows],
  );

  const displayAll = useCallback(() => {
    const filteredProviders = getFilteredProviders();
    return (
      <div className="rounded bg-blue-50 p-6 text-center shadow">
        <h1 className="mb-2 text-2xl font-bold">Providers</h1>

        <button
          onClick={() => check_backend()}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Refresh Data
        </button>

        {loading && <p className="mt-4 text-gray-600">Loading...</p>}

        {/* ✅ Filter input */}
        <div>
          <label className="mt-4 block text-left font-medium text-gray-700">
            Minimum Work Hours:
            <input
              type="number"
              step="0.1"
              min="0"
              value={filterCriteria.minWorkHours ?? ""}
              onChange={(e) =>
                setFilterCriteria({
                  ...filterCriteria,
                  minWorkHours: e.target.value
                    ? parseFloat(e.target.value)
                    : null,
                })
              }
              className="ml-2 mt-1 w-20 rounded border border-gray-300 px-2 py-1"
            />
          </label>
        </div>

        {/* ✅ Sort controls */}
        <div className="mt-4 flex items-center gap-4">
          <label className="font-medium text-gray-700">
            Sort By:
            <select
              value={filterCriteria.sortBy}
              onChange={(e) =>
                setFilterCriteria({
                  ...filterCriteria,
                  sortBy: e.target.value as FilterCriteria["sortBy"],
                })
              }
              className="ml-2 rounded border border-gray-300 px-2 py-1"
            >
              <option value="providerName">Provider Name (Descr asc)</option>
              <option value="totalCost">Total Cost</option>
              <option value="totalWork">Total Work</option>
              <option value="totalWorkHours">Total Work Hours</option>
            </select>
          </label>

          <label className="font-medium text-gray-700">
            Order:
            <select
              value={filterCriteria.sortOrder}
              onChange={(e) =>
                setFilterCriteria({
                  ...filterCriteria,
                  sortOrder: e.target.value as "asc" | "desc",
                })
              }
              className="ml-2 rounded border border-gray-300 px-2 py-1"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>
        </div>

        <div className="mt-6 text-left">
          {providerData?.byProviderId ? (
            <>
              <div className="mb-4 font-medium text-gray-800">
                Found {filteredProviders.length}/{totalProviderCount()}{" "}
                providers matching criteria. Displaying{" "}
                {Math.min(filteredProviders.length, maxDisplayRows)} providers.
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredProviders.map((provider, row) =>
                  displayProvider(row, provider),
                )}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-gray-600">
              No provider data available. Click the button above to fetch data.
            </p>
          )}
        </div>
      </div>
    );
  }, [
    getFilteredProviders,
    check_backend,
    displayProvider,
    filterCriteria,
    loading,
    maxDisplayRows,
    providerData,
    setFilterCriteria,
    totalProviderCount,
  ]);

  return displayAll();
};

export default Providers;
