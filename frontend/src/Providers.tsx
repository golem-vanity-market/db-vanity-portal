import React, { useCallback, useEffect } from "react";
import { backendUrl, displayDifficulty, displayHours } from "./utils";
import { ProviderData, ProviderDataEntry } from "../../shared/src/provider";

const CACHE_KEY = "providerDataCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface FilterCriteria {
  minWork: number | null;
  maxWork: number | null;
  minWork24h: number | null;
  maxWork24h: number | null;
  minSpeed: number | null;
  maxSpeed: number | null;
  minSpeed24h: number | null;
  maxSpeed24h: number | null;
  minEfficiency: number | null;
  maxEfficiency: number | null;
  minEfficiency24h: number | null;
  maxEfficiency24h: number | null;
  minWorkHours: number | null;
  maxWorkHours: number | null;
  minWorkHours24h: number | null;
  maxWorkHours24h: number | null;
  minTotalCost: number | null;
  maxTotalCost: number | null;
  minTotalCost24h: number | null;
  maxTotalCost24h: number | null;
  minNumberOfJobs: number | null;
  maxNumberOfJobs: number | null;
  minNumberOfJobs24h: number | null;
  maxNumberOfJobs24h: number | null;
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
    | "speed"
    | "speed24h"
    | "efficiency"
    | "efficiency24h"
    | "lastJobDate"
    | "longestJob";
  sortOrder: "asc" | "desc";
}

const defaultFilterCriteria = (): FilterCriteria => {
  return {
    minWork: null,
    maxWork: null,
    minWork24h: null,
    maxWork24h: null,
    minSpeed: null,
    maxSpeed: null,
    minSpeed24h: null,
    maxSpeed24h: null,
    minEfficiency: null,
    maxEfficiency: null,
    minEfficiency24h: null,
    maxEfficiency24h: null,
    minWorkHours: 0.1,
    maxWorkHours: null,
    minWorkHours24h: null,
    maxWorkHours24h: null,
    minTotalCost: null,
    maxTotalCost: null,
    minTotalCost24h: null,
    maxTotalCost24h: null,
    minNumberOfJobs: null,
    maxNumberOfJobs: null,
    minNumberOfJobs24h: null,
    maxNumberOfJobs24h: null,
    providerNameSearch: null,
    sortBy: "providerName",
    sortOrder: "asc",
  };
};

const Providers = () => {
  const [loading, setLoading] = React.useState(false);
  const [updateNo, setUpdateNo] = React.useState(0);

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
  const [filteredProviders, setFilteredProviders] = React.useState<
    ProviderDataEntry[]
  >([]);

  const getFilteredProviders = useCallback(() => {
    if (!providerData) return [];
    const filtered: ProviderDataEntry[] = [];
    const fc = filterCriteria;

    const cs = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val < limit;
    };
    const cb = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val > limit;
    };
    const cs9 = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val < limit * 1e9;
    };
    const cb9 = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val > limit * 1e9;
    };
    for (const providerId in providerData.byProviderId) {
      const p = providerData.byProviderId[providerId];

      if (cs9(p.totalWork, fc.minWork)) continue;
      if (cb9(p.totalWork, fc.maxWork)) continue;
      if (cs9(p.totalWork24h, fc.minWork24h)) continue;
      if (cb9(p.totalWork24h, fc.maxWork24h)) continue;
      if (cs9(p.speed, fc.minSpeed)) continue;
      if (cb9(p.speed, fc.maxSpeed)) continue;
      if (cs9(p.speed24h, fc.minSpeed24h)) continue;
      if (cb9(p.speed24h, fc.maxSpeed24h)) continue;
      if (cs9(p.efficiency, fc.minEfficiency)) continue;
      if (cb9(p.efficiency, fc.maxEfficiency)) continue;
      if (cs9(p.efficiency24h, fc.minEfficiency24h)) continue;
      if (cb9(p.efficiency24h, fc.maxEfficiency24h)) continue;
      if (cs(p.totalCost, fc.minTotalCost)) continue;
      if (cb(p.totalCost, fc.maxTotalCost)) continue;
      if (cs(p.totalCost24h, fc.minTotalCost24h)) continue;
      if (cb(p.totalCost24h, fc.maxTotalCost24h)) continue;
      if (cs(p.totalWorkHours, fc.minWorkHours)) continue;
      if (cb(p.totalWorkHours, fc.maxWorkHours)) continue;
      if (cs(p.totalWorkHours24h, fc.minWorkHours24h)) continue;
      if (cb(p.totalWorkHours24h, fc.maxWorkHours24h)) continue;
      if (cs(p.numberOfJobs, fc.minNumberOfJobs)) continue;
      if (cb(p.numberOfJobs, fc.maxNumberOfJobs)) continue;
      if (cs(p.numberOfJobs24h, fc.minNumberOfJobs24h)) continue;
      if (cb(p.numberOfJobs24h, fc.maxNumberOfJobs24h)) continue;
      if (
        fc.providerNameSearch &&
        !p.providerName
          .toLowerCase()
          .includes(fc.providerNameSearch.toLowerCase())
      )
        continue;
      filtered.push(p);
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

  useEffect(() => {
    const currentFiltered = filteredProviders;

    const newFiltered = getFilteredProviders();
    if (JSON.stringify(currentFiltered) === JSON.stringify(newFiltered)) {
      console.log("Filtered providers unchanged, not updating state.");
    } else {
      console.log("Filtered providers changed, updating state.");
      setFilteredProviders(getFilteredProviders());
    }
  }, [providerData, filterCriteria, getFilteredProviders, filteredProviders]);

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

  useEffect(() => {
    if (updateNo > 0) {
      check_backend().then(() => console.log("Provider data refreshed"));
    }
  }, [updateNo, check_backend]);

  const clear_data = useCallback(async () => {
    setFilterCriteria(defaultFilterCriteria());
  }, [setFilterCriteria]);

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
            <span className="font-mono">
              <a
                href={`https://stats.golem.network/network/provider/${provider.providerId}`}
              >
                {provider.providerId}
              </a>
            </span>
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <table>
              <thead>
                <tr>
                  <th className="px-2 text-left font-normal">Metric</th>
                  <th className="px-2 text-left font-normal">All Time</th>
                  <th className="px-2 text-left font-normal">Last 24h</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2">Total Work Hours</td>
                  <td className="px-2">
                    {displayHours(provider.totalWorkHours)}
                  </td>
                  <td className="px-2">
                    {displayHours(provider.totalWorkHours24h)}
                  </td>
                </tr>
                <tr>
                  <td className="px-2">Total Work</td>
                  <td className="px-2">
                    {displayDifficulty(provider.totalWork)}
                  </td>
                  <td className="px-2">
                    {displayDifficulty(provider.totalWork24h)}
                  </td>
                </tr>
                <tr>
                  <td className="px-2">Total Cost</td>
                  <td className="px-2">{provider.totalCost.toFixed(4)} GLM</td>
                  <td className="px-2">
                    {provider.totalCost24h.toFixed(4)} GLM
                  </td>
                </tr>
                <tr>
                  <td className="px-2">Speed</td>
                  <td className="px-2">
                    {displayDifficulty(provider.speed)}
                    /s
                  </td>
                  <td className="px-2">
                    {displayDifficulty(provider.speed24h)}
                    /s
                  </td>
                </tr>
                <tr>
                  <td className="px-2">Efficiency</td>
                  <td className="px-2">
                    {displayDifficulty(provider.efficiency)}
                    /s
                  </td>
                  <td className="px-2">
                    {displayDifficulty(provider.efficiency24h)}
                    /s
                  </td>
                </tr>
                <tr>
                  <td className="px-2">Number of Jobs</td>
                  <td className="px-2">{provider.numberOfJobs}</td>
                  <td className="px-2">{provider.numberOfJobs24h}</td>
                </tr>
                <tr>
                  <td className="px-2">Longest Job (hours)</td>
                  <td className="px-2">{displayHours(provider.longestJob)}</td>
                  <td className="px-2">
                    {displayHours(provider.longestJob24h)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </li>
      );
    },
    [maxDisplayRows],
  );

  const displayAll = useCallback(() => {
    return (
      <div className="rounded bg-blue-50 p-6 text-center shadow">
        <h1 className="mb-2 text-2xl font-bold">Providers</h1>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => clear_data()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Reset Filters
          </button>
          <button
            onClick={() => setUpdateNo(updateNo + 1)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Refresh Data
          </button>
          <button
            onClick={() => setUpdateNo(updateNo + 1)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            From Golem DB
          </button>
        </div>

        {loading && <p className="mt-4 text-gray-600">Loading...</p>}

        {/* ✅ Filter input */}
        <table className="mt-4 w-full table-auto border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2 font-medium text-gray-700">Filter</th>
              <th className="p-2 font-medium text-gray-700">Min</th>
              <th className="p-2 font-medium text-gray-700">Max</th>
              <th className="p-2 font-medium text-gray-700">Cancel</th>
            </tr>
          </thead>
          <tbody>
            {/* Minimum Work */}
            <tr className="border-b">
              <td className="p-2">Work</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minWork ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWork: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxWork ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxWork: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWork: null,
                      maxWork: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>
            {/* Minimum Work 24h */}
            <tr className="border-b">
              <td className="p-2">Work (24h)</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minWork24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWork24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxWork24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxWork24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWork24h: null,
                      maxWork24h: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>
            {/* Minimum speed */}
            <tr className="border-b">
              <td className="p-2">Speed</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minSpeed ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minSpeed: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxSpeed ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxSpeed: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minSpeed: null,
                      maxSpeed: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>
            {/* Minimum speed 24h */}
            <tr className="border-b">
              <td className="p-2">Speed (24h)</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minSpeed24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minSpeed24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxSpeed24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxSpeed24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minSpeed24h: null,
                      maxSpeed24h: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>
            {/* Minimum efficiency */}
            <tr className="border-b">
              <td className="p-2">Efficiency</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minEfficiency ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minEfficiency: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxEfficiency ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxEfficiency: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minEfficiency: null,
                      maxEfficiency: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>
            {/* Minimum efficiency 24h */}
            <tr className="border-b">
              <td className="p-2">Efficiency (24h)</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minEfficiency24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minEfficiency24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxEfficiency24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxEfficiency24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minEfficiency24h: null,
                      maxEfficiency24h: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>
            {/* Minimum Work Hours */}
            <tr className="border-b">
              <td className="p-2">Work Hours</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minWorkHours ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWorkHours: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxWorkHours ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxWorkHours: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWorkHours: null,
                      maxWorkHours: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>

            {/* Work Hours (24h) */}
            <tr className="border-b">
              <td className="p-2">Work Hours (24h)</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minWorkHours24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWorkHours24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxWorkHours24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxWorkHours24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minWorkHours24h: null,
                      maxWorkHours24h: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>

            {/* Total Cost */}
            <tr className="border-b">
              <td className="p-2">Total Cost</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minTotalCost ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minTotalCost: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxTotalCost ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxTotalCost: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minTotalCost: null,
                      maxTotalCost: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>

            {/* Total Cost (24h) */}
            <tr className="border-b">
              <td className="p-2">Total Cost (24h)</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minTotalCost24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minTotalCost24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxTotalCost24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxTotalCost24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minTotalCost24h: null,
                      maxTotalCost24h: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>

            {/* Number of Jobs */}
            <tr className="border-b">
              <td className="p-2">Number of Jobs</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minNumberOfJobs ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minNumberOfJobs: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxNumberOfJobs ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxNumberOfJobs: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minNumberOfJobs: null,
                      maxNumberOfJobs: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>

            {/* Number of Jobs (24h) */}
            <tr className="border-b">
              <td className="p-2">Number of Jobs (24h)</td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.minNumberOfJobs24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minNumberOfJobs24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  step="0.1"
                  value={filterCriteria.maxNumberOfJobs24h ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      maxNumberOfJobs24h: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-24 rounded border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="p-2">
                <button
                  onClick={() =>
                    setFilterCriteria({
                      ...filterCriteria,
                      minNumberOfJobs24h: null,
                      maxNumberOfJobs24h: null,
                    })
                  }
                  className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
                >
                  ✕
                </button>
              </td>
            </tr>

            <tr className="border-b">
              <td className="p-2">Provider Name Search</td>
              <td className="p-2" colSpan={3}>
                <input
                  type="text"
                  value={filterCriteria.providerNameSearch ?? ""}
                  onChange={(e) =>
                    setFilterCriteria({
                      ...filterCriteria,
                      providerNameSearch: e.target.value || null,
                    })
                  }
                  className="w-48 rounded border border-gray-300 px-2 py-1"
                  placeholder="Type a name fragment"
                />
              </td>
            </tr>
          </tbody>
        </table>

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
              <option value="providerName">Provider Name</option>

              <option value="totalCost">Total Cost</option>
              <option value="totalCost24h">Total Cost 24h</option>
              <option value="totalSpeed">Total Speed</option>
              <option value="totalSpeed24h">Total Speed 24h</option>
              <option value="totalEfficiency">Total Efficiency</option>
              <option value="totalEfficiency24h">Total Efficiency 24h</option>
              <option value="totalWork">Total Work</option>
              <option value="totalWork24h">Total Work 24h</option>
              <option value="totalWorkHours">Total Work Hours</option>
              <option value="totalWorkHours24h">Total Work Hours 24h</option>
              <option value="numberOfJobs">Number of Jobs</option>
              <option value="numberOfJobs24h">Number of Jobs 24h</option>
              <option value="lastJobDate">Last Job Date</option>
              <option value="longestJob">Longest Job</option>
              <option value="longestJob24h">Longest Job 24h</option>
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
    loading,
    filterCriteria,
    providerData?.byProviderId,
    filteredProviders,
    totalProviderCount,
    maxDisplayRows,
    clear_data,
    setFilterCriteria,
    displayProvider,
    updateNo,
  ]);

  return displayAll();
};

export default Providers;
