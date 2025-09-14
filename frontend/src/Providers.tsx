import React, { useCallback, useEffect, useMemo, useState } from "react";
import { displayDifficulty, displayHours } from "./utils";
import { ProviderData, ProviderDataEntry, ProviderDataType } from "../../shared/src/provider";
import RangeFilterRow from "./RangeFilterRow";
import { createROClient } from "golem-base-sdk";
import { deserializeProvider } from "../../shared/src/provider";

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
    minWorkHours: null,
    maxWorkHours: null,
    minWorkHours24h: 1,
    maxWorkHours24h: null,
    minTotalCost: null,
    maxTotalCost: null,
    minTotalCost24h: null,
    maxTotalCost24h: null,
    minNumberOfJobs: null,
    maxNumberOfJobs: null,
    minNumberOfJobs24h: 1,
    maxNumberOfJobs24h: null,
    providerNameSearch: null,
    sortBy: "providerName",
    sortOrder: "asc",
  };
};

const getProviderScore = (provider: ProviderDataEntry): number => {
  // Simple scoring algorithm based on efficiency and speed
  const speedScore = provider.speed ? provider.speed / 10.0e6 : 0;
  const efficiencyScore = provider.efficiency ? provider.efficiency / 1.0e12 : 0;
  const sp = Math.min(speedScore, 1.0);
  let ep = Math.min(efficiencyScore, 1.0);
  if (provider.totalCost === 0) ep = 1;
  return ((sp + ep) / 2.0) * 100;
};

const _getProviderScore24h = (provider: ProviderDataEntry) => {
  // Simple scoring algorithm based on efficiency and speed
  const speedScore = provider.speed24h ? provider.speed24h / 10.0e6 : 0;
  const efficiencyScore = provider.efficiency24h ? provider.efficiency24h / 1.0e12 : 0;
  const sp = Math.min(speedScore, 1.0);
  let ep = Math.min(efficiencyScore, 1.0);
  if (provider.totalCost24h === 0) ep = 1;
  return ((sp + ep) / 2.0) * 100;
};

const Providers = () => {
  const [loading, setLoading] = useState(false);
  const [updateNo, setUpdateNo] = useState(0);
  const client = useMemo(
    () =>
      createROClient(
        parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID || ""),
        import.meta.env.VITE_GOLEM_DB_RPC || "",
        import.meta.env.VITE_GOLEM_DB_RPC_WS || "",
      ),
    [],
  );

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
  const [showFilters, setShowFilters] = useState(false);

  const [maxDisplayRows] = useState<number>(100);
  const [filterCriteria, setFilterCriteriaInt] = useState<FilterCriteria>(loadCachedCriteria());

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

  const [providerData, setProviderData] = useState<ProviderData | null>(loadCache());
  const [filteredProviders, setFilteredProviders] = useState<ProviderDataEntry[]>([]);

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
    const cs6 = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val < limit * 1e6;
    };
    const cb6 = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val > limit * 1e6;
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
    const cs12 = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val < limit * 1e12;
    };
    const cb12 = (val: number | null, limit: number | null) => {
      if (limit === null) return false;
      if (val === null) return false;
      return val > limit * 1e12;
    };
    for (const providerId in providerData.byProviderId) {
      const p = providerData.byProviderId[providerId];

      if (cs9(p.totalWork, fc.minWork)) continue;
      if (cb9(p.totalWork, fc.maxWork)) continue;
      if (cs9(p.totalWork24h, fc.minWork24h)) continue;
      if (cb9(p.totalWork24h, fc.maxWork24h)) continue;
      if (cs6(p.speed, fc.minSpeed)) continue;
      if (cb6(p.speed, fc.maxSpeed)) continue;
      if (cs6(p.speed24h, fc.minSpeed24h)) continue;
      if (cb6(p.speed24h, fc.maxSpeed24h)) continue;
      if (cs12(p.efficiency, fc.minEfficiency)) continue;
      if (cb12(p.efficiency, fc.maxEfficiency)) continue;
      if (cs12(p.efficiency24h, fc.minEfficiency24h)) continue;
      if (cb12(p.efficiency24h, fc.maxEfficiency24h)) continue;
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
      if (fc.providerNameSearch && !p.providerName.toLowerCase().includes(fc.providerNameSearch.toLowerCase()))
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

      if (client) {
        const proms = [];
        for (let groupNo = 1; groupNo <= 10; groupNo++) {
          proms.push(
            client.queryEntities(`group = ${groupNo} && $owner = "${import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS}"`),
          );
        }
        const newProviderData: ProviderDataType = {
          grouped: "all",
          byProviderId: {},
        };
        for (const prom of proms) {
          const entities = await prom;
          for (const entity of entities) {
            let data;
            try {
              data = deserializeProvider(entity.storageValue);
            } catch (e) {
              console.error("Failed to deserialize provider data:", e);
              continue;
            }
            newProviderData.byProviderId[data.providerId] = data;
          }
        }
        const newProviderDataObj = new ProviderData(newProviderData);
        setProviderData(newProviderDataObj);
        saveCache(newProviderDataObj);
      } else {
        console.log("Fetching provider data from backend...");

        /*
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
        }*/
      }
    } catch (error) {
      alert("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  }, [client]);

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
        <li key={provider.providerId} className="rounded-lg border bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-blue-700">
            {row + 1} - {provider.providerName} -{" "}
            <span title={"Provider score"}>{getProviderScore(provider).toFixed(2)}%</span>
          </h2>
          <p className="text-sm text-gray-600">
            Provider ID:{" "}
            <span className="font-mono">
              <a
                className="ml-1 font-semibold text-blue-600"
                href={`https://stats.golem.network/network/provider/${provider.providerId}`}
              >
                {provider.providerId} &rarr;
              </a>
            </span>
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <table>
              <thead>
                <tr>
                  <th className="p-2 text-left font-normal">Metric</th>
                  <th className="p-2 text-left font-normal">All Time</th>
                  <th className="p-2 text-left font-normal">Last 24h</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">Total Work Hours</td>
                  <td className="p-2">{displayHours(provider.totalWorkHours)}</td>
                  <td className="p-2">{displayHours(provider.totalWorkHours24h)}</td>
                </tr>
                <tr>
                  <td className="p-2">Total Work</td>
                  <td className="p-2">{displayDifficulty(provider.totalWork)}</td>
                  <td className="p-2">{displayDifficulty(provider.totalWork24h)}</td>
                </tr>
                <tr>
                  <td className="p-2">Total Cost</td>
                  <td className="p-2">{provider.totalCost.toFixed(4)} GLM</td>
                  <td className="p-2">{provider.totalCost24h.toFixed(4)} GLM</td>
                </tr>
                <tr>
                  <td className="p-2">Speed</td>
                  <td className="p-2">
                    {displayDifficulty(provider.speed)}
                    /s
                  </td>
                  <td className="p-2">
                    {displayDifficulty(provider.speed24h)}
                    /s
                  </td>
                </tr>
                <tr>
                  <td className="p-2">Efficiency</td>
                  <td className="p-2">
                    {displayDifficulty(provider.efficiency)}
                    TH/GLM
                  </td>
                  <td className="p-2">
                    {displayDifficulty(provider.efficiency24h)}
                    TH/GLM
                  </td>
                </tr>
                <tr>
                  <td className="p-2">Number of Jobs</td>
                  <td className="p-2">{provider.numberOfJobs}</td>
                  <td className="p-2">{provider.numberOfJobs24h}</td>
                </tr>
                <tr>
                  <td className="p-2">Longest Job (hours)</td>
                  <td className="p-2">{displayHours(provider.longestJob)}</td>
                  <td className="p-2">{displayHours(provider.longestJob24h)}</td>
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
      <div className="w-full rounded bg-blue-50 p-6 text-center shadow">
        <h1 className="mb-2 text-2xl font-bold">Providers</h1>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <button onClick={() => clear_data()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Reset Filters
          </button>
          <button
            onClick={() => setUpdateNo(updateNo + 1)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>

        {loading && <p className="mt-4 text-gray-600">Loading...</p>}

        {/* ✅ Filter input */}
        <table className="mt-4 table-auto border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2 font-medium text-gray-700">
                <button
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="mb-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </th>
              {showFilters && (
                <>
                  <th className="p-2 font-medium text-gray-700">Min</th>
                  <th className="p-2 font-medium text-gray-700">Max</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {showFilters && (
              <>
                <RangeFilterRow
                  label={"Work"}
                  minKey={"minWork"}
                  maxKey={"maxWork"}
                  unit={"GH"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Work 24h"}
                  minKey={"minWork24h"}
                  maxKey={"maxWork24h"}
                  unit={"GH"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Speed"}
                  minKey={"minSpeed"}
                  maxKey={"maxSpeed"}
                  unit={"MH/s"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Speed 24h"}
                  minKey={"minSpeed24h"}
                  maxKey={"maxSpeed24h"}
                  unit={"MH/s"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Efficiency"}
                  minKey={"minEfficiency"}
                  maxKey={"maxEfficiency"}
                  unit={"TH/GLM"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Efficiency 24h"}
                  minKey={"minEfficiency24h"}
                  maxKey={"maxEfficiency24h"}
                  unit={"TH/GLM"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Total Work Hours"}
                  minKey={"minWorkHours"}
                  maxKey={"maxWorkHours"}
                  unit={"h"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Total Work Hours 24h"}
                  minKey={"minWorkHours24h"}
                  maxKey={"maxWorkHours24h"}
                  unit={"h"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Total Cost"}
                  minKey={"minTotalCost"}
                  maxKey={"maxTotalCost"}
                  unit={"GLM"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Total Cost 24h"}
                  minKey={"minTotalCost24h"}
                  maxKey={"maxTotalCost24h"}
                  unit={"GLM"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Number of Jobs"}
                  minKey={"minNumberOfJobs"}
                  maxKey={"maxNumberOfJobs"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
                <RangeFilterRow
                  label={"Number of Jobs 24h"}
                  minKey={"minNumberOfJobs24h"}
                  maxKey={"maxNumberOfJobs24h"}
                  filterCriteria={filterCriteria}
                  setFilterCriteria={setFilterCriteria}
                />
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
              </>
            )}
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
              <option value="speed">Total Speed</option>
              <option value="speed24h">Total Speed 24h</option>
              <option value="efficiency">Total Efficiency</option>
              <option value="efficiency24h">Total Efficiency 24h</option>
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
                Found {filteredProviders.length}/{totalProviderCount()} providers matching criteria. Displaying{" "}
                {Math.min(filteredProviders.length, maxDisplayRows)} providers.
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredProviders.map((provider, row) => displayProvider(row, provider))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-gray-600">No provider data available. Click the button above to fetch data.</p>
          )}
        </div>
      </div>
    );
  }, [
    loading,
    showFilters,
    filterCriteria,
    setFilterCriteria,
    providerData?.byProviderId,
    filteredProviders,
    totalProviderCount,
    maxDisplayRows,
    clear_data,
    updateNo,
    displayProvider,
  ]);

  return displayAll();
};

export default Providers;
