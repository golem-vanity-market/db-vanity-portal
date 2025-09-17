import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createROClient } from "golem-base-sdk";
import { ProviderData } from "../../../shared/src/provider";
import { fetchAllEntities, mapValueForAnnotation, mapValueForNumberAnnotation } from "../../../shared/src/query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, FilterX, Loader2, RefreshCw } from "lucide-react";
import { FilterCriteria } from "./provider-types";
import { ProviderFilters } from "./ProviderFilters";
import { ProviderCard } from "./ProviderCard";
import { getProviderScore } from "./provider-utils";

const CACHE_KEY = "providerDataCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const defaultFilterCriteria = (): FilterCriteria => ({
  providerNameSearch: "",
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
  sortBy: "score",
  sortOrder: "desc",
  displayLimit: 50,
});

const sortOptions = [
  { value: "providerName", label: "Provider Name" },
  { value: "speed24h", label: "Speed (24h)" },
  { value: "efficiency24h", label: "Efficiency (24h)" },
  { value: "totalWorkHours24h", label: "Work Hours (24h)" },
  { value: "totalCost24h", label: "Cost (24h)" },
  { value: "numberOfJobs24h", label: "Jobs (24h)" },
  { value: "longestJob", label: "Longest Job (All Time)" },
  { value: "speed", label: "Speed (All Time)" },
  { value: "efficiency", label: "Efficiency (All Time)" },
  { value: "totalWorkHours", label: "Work Hours (All Time)" },
  { value: "totalCost", label: "Cost (All Time)" },
  { value: "numberOfJobs", label: "Jobs (All Time)" },
  { value: "score", label: "Score" },
];

const buildFilterFromLocalStorage = (
  cached: Partial<FilterCriteria> | null,
  defaults: FilterCriteria,
): FilterCriteria => {
  if (!cached) {
    return defaults;
  }
  return {
    providerNameSearch: cached.providerNameSearch ?? defaults.providerNameSearch,
    displayLimit: cached.displayLimit ?? defaults.displayLimit,
    sortBy: cached.sortBy ?? defaults.sortBy,
    sortOrder: cached.sortOrder ?? defaults.sortOrder,
    minWork: cached.minWork ?? defaults.minWork,
    maxWork: cached.maxWork ?? defaults.maxWork,
    minWork24h: cached.minWork24h ?? defaults.minWork24h,
    maxWork24h: cached.maxWork24h ?? defaults.maxWork24h,
    minSpeed: cached.minSpeed ?? defaults.minSpeed,
    maxSpeed: cached.maxSpeed ?? defaults.maxSpeed,
    minSpeed24h: cached.minSpeed24h ?? defaults.minSpeed24h,
    maxSpeed24h: cached.maxSpeed24h ?? defaults.maxSpeed24h,
    minEfficiency: cached.minEfficiency ?? defaults.minEfficiency,
    maxEfficiency: cached.maxEfficiency ?? defaults.maxEfficiency,
    minEfficiency24h: cached.minEfficiency24h ?? defaults.minEfficiency24h,
    maxEfficiency24h: cached.maxEfficiency24h ?? defaults.maxEfficiency24h,
    minWorkHours: cached.minWorkHours ?? defaults.minWorkHours,
    maxWorkHours: cached.maxWorkHours ?? defaults.maxWorkHours,
    minWorkHours24h: cached.minWorkHours24h ?? defaults.minWorkHours24h,
    maxWorkHours24h: cached.maxWorkHours24h ?? defaults.maxWorkHours24h,
    minTotalCost: cached.minTotalCost ?? defaults.minTotalCost,
    maxTotalCost: cached.maxTotalCost ?? defaults.maxTotalCost,
    minTotalCost24h: cached.minTotalCost24h ?? defaults.minTotalCost24h,
    maxTotalCost24h: cached.maxTotalCost24h ?? defaults.maxTotalCost24h,
    minNumberOfJobs: cached.minNumberOfJobs ?? defaults.minNumberOfJobs,
    maxNumberOfJobs: cached.maxNumberOfJobs ?? defaults.maxNumberOfJobs,
    minNumberOfJobs24h: cached.minNumberOfJobs24h ?? defaults.minNumberOfJobs24h,
    maxNumberOfJobs24h: cached.maxNumberOfJobs24h ?? defaults.maxNumberOfJobs24h,
  };
};

interface FilterPanelProps {
  filters: FilterCriteria;
  onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
}

const FilterPanel = ({ filters, onFilterChange }: FilterPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <ProviderFilters filters={filters} onFilterChange={onFilterChange} />
      </CardContent>
    </Card>
  );
};

function escapeForJS(str: string): string {
  return str
    .replace(/\\/g, "\\\\") // escape backslash
    .replace(/"/g, '\\"') // escape double quotes
    .replace(/'/g, "\\'") // escape single quotes
    .replace(/\n/g, "\\n") // escape newlines
    .replace(/\r/g, "\\r") // escape carriage returns
    .replace(/\t/g, "\\t"); // escape tabs
}

const ProvidersPage = () => {
  const [loading, setLoading] = useState(true);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(() => {
    const defaults = defaultFilterCriteria();
    const cachedItem = localStorage.getItem("providerFilterCriteria");

    let parsedCache = null;
    if (cachedItem) {
      try {
        parsedCache = JSON.parse(cachedItem);
      } catch {
        // ignore parsing errors
      }
    }

    const cachedFilters = buildFilterFromLocalStorage(parsedCache, defaults);
    localStorage.setItem("providerFilterCriteria", JSON.stringify(cachedFilters));
    return cachedFilters;
  });

  const client = useMemo(
    () =>
      createROClient(
        parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID || ""),
        import.meta.env.VITE_GOLEM_DB_RPC || "",
        import.meta.env.VITE_GOLEM_DB_RPC_WS || "",
      ),
    [],
  );

  const handleFilterChange = useCallback(<K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
    setFilterCriteria((prev) => {
      const newFilters = { ...prev, [key]: value };
      localStorage.setItem("providerFilterCriteria", JSON.stringify(newFilters));
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    const defaults = defaultFilterCriteria();
    setFilterCriteria(defaults);
    localStorage.setItem("providerFilterCriteria", JSON.stringify(defaults));
  }, []);

  const [internalQuery, setInternalQuery] = useState<string>("");

  useEffect(() => {
    let completeQuery = `curl ${
      import.meta.env.VITE_GOLEM_DB_RPC
    } -X POST -H "Content-Type: application/json" --data '{"method":"golembase_queryEntities","params":["%%QUERY%%"], "id": 1, "jsonrpc":"2.0"}' | jq`;

    let qbuild = `$owner = "${import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS}"`;
    if (filterCriteria.providerNameSearch) {
      qbuild += ` && name = "${escapeForJS(filterCriteria.providerNameSearch)}"`;
    }
    if (filterCriteria.minWork !== null) {
      qbuild += ` && totalWork >= "${mapValueForAnnotation(filterCriteria.minWork * 1e9, "totalWork")}"`;
    }
    if (filterCriteria.maxWork !== null) {
      qbuild += ` && totalWork <= "${mapValueForAnnotation(filterCriteria.maxWork * 1e9, "totalWork")}"`;
    }
    if (filterCriteria.minWork24h !== null) {
      qbuild += ` && totalWork24h >= "${mapValueForAnnotation(filterCriteria.minWork24h * 1e9, "totalWork24h")}"`;
    }
    if (filterCriteria.maxWork24h !== null) {
      qbuild += ` && totalWork24h <= "${mapValueForAnnotation(filterCriteria.maxWork24h * 1e9, "totalWork24h")}"`;
    }
    if (filterCriteria.minSpeed !== null) {
      qbuild += ` && speed >= "${mapValueForAnnotation(filterCriteria.minSpeed * 1e6, "speed")}"`;
    }
    if (filterCriteria.maxSpeed !== null) {
      qbuild += ` && speed <= "${mapValueForAnnotation(filterCriteria.maxSpeed * 1e6, "speed")}"`;
    }
    if (filterCriteria.minSpeed24h !== null) {
      qbuild += ` && speed24h >= "${mapValueForAnnotation(filterCriteria.minSpeed24h * 1e6, "speed24h")}"`;
    }
    if (filterCriteria.maxSpeed24h !== null) {
      qbuild += ` && speed24h <= "${mapValueForAnnotation(filterCriteria.maxSpeed24h * 1e6, "speed24h")}"`;
    }
    if (filterCriteria.minEfficiency !== null) {
      qbuild += ` && efficiency >= "${mapValueForAnnotation(filterCriteria.minEfficiency * 1e12, "efficiency")}"`;
    }
    if (filterCriteria.maxEfficiency !== null) {
      qbuild += ` && efficiency <= "${mapValueForAnnotation(filterCriteria.maxEfficiency * 1e12, "efficiency")}"`;
    }
    if (filterCriteria.minEfficiency24h !== null) {
      qbuild += ` && efficiency24h >= "${mapValueForAnnotation(
        filterCriteria.minEfficiency24h * 1e12,
        "efficiency24h",
      )}"`;
    }
    if (filterCriteria.maxEfficiency24h !== null) {
      qbuild += ` && efficiency24h <= "${mapValueForAnnotation(
        filterCriteria.maxEfficiency24h * 1e12,
        "efficiency24h",
      )}"`;
    }
    if (filterCriteria.minTotalCost !== null) {
      qbuild += ` && totalCost >= "${mapValueForAnnotation(filterCriteria.minTotalCost, "totalCost")}"`;
    }
    if (filterCriteria.maxTotalCost !== null) {
      qbuild += ` && totalCost <= "${mapValueForAnnotation(filterCriteria.maxTotalCost, "totalCost")}"`;
    }
    if (filterCriteria.minTotalCost24h !== null) {
      qbuild += ` && totalCost24h >= "${mapValueForAnnotation(filterCriteria.minTotalCost24h, "totalCost24h")}"`;
    }
    if (filterCriteria.maxTotalCost24h !== null) {
      qbuild += ` && totalCost24h <= "${mapValueForAnnotation(filterCriteria.maxTotalCost24h, "totalCost24h")}"`;
    }
    if (filterCriteria.minWorkHours !== null) {
      qbuild += ` && totalWorkHours >= "${mapValueForAnnotation(filterCriteria.minWorkHours, "totalWorkHours")}"`;
    }
    if (filterCriteria.maxWorkHours !== null) {
      qbuild += ` && totalWorkHours <= "${mapValueForAnnotation(filterCriteria.maxWorkHours, "totalWorkHours")}"`;
    }
    if (filterCriteria.minWorkHours24h !== null) {
      qbuild += ` && totalWorkHours24h >= "${mapValueForAnnotation(
        filterCriteria.minWorkHours24h,
        "totalWorkHours24h",
      )}"`;
    }
    if (filterCriteria.maxWorkHours24h !== null) {
      qbuild += ` && totalWorkHours24h <= "${mapValueForAnnotation(
        filterCriteria.maxWorkHours24h,
        "totalWorkHours24h",
      )}"`;
    }
    if (filterCriteria.minNumberOfJobs !== null) {
      qbuild += ` && numberOfJobs >= ${mapValueForNumberAnnotation(filterCriteria.minNumberOfJobs, "numberOfJobs")}`;
    }
    if (filterCriteria.maxNumberOfJobs !== null) {
      qbuild += ` && numberOfJobs <= ${mapValueForNumberAnnotation(filterCriteria.maxNumberOfJobs, "numberOfJobs")}`;
    }
    if (filterCriteria.minNumberOfJobs24h !== null) {
      qbuild += ` && numberOfJobs24h >= ${mapValueForNumberAnnotation(
        filterCriteria.minNumberOfJobs24h,
        "numberOfJobs24h",
      )}`;
    }
    if (filterCriteria.maxNumberOfJobs24h !== null) {
      qbuild += ` && numberOfJobs24h <= ${mapValueForNumberAnnotation(
        filterCriteria.maxNumberOfJobs24h,
        "numberOfJobs24h",
      )}`;
    }

    completeQuery = completeQuery.replace("%%QUERY%%", escapeForJS(qbuild));
    setInternalQuery(completeQuery);
  }, [filterCriteria]);

  const fetchData = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && !forceRefresh) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setProviderData(new ProviderData(parsed.data));
          setLoading(false);
          return;
        }
      }

      try {
        const entities = await fetchAllEntities(client, 10, import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS);
        const data = new ProviderData({ grouped: "all", byProviderId: entities });
        setProviderData(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      } catch (error) {
        console.error("Error fetching provider data:", error);
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { displayedProviders, totalMatches } = useMemo(() => {
    if (!providerData) {
      return { displayedProviders: [], totalMatches: 0 };
    }

    const providers = Object.values(providerData.byProviderId);
    const fc = filterCriteria;

    const filtered = providers.filter((p) => {
      if (fc.providerNameSearch && !p.providerName.toLowerCase().includes(fc.providerNameSearch.toLowerCase()))
        return false;
      if (fc.minWork !== null && p.totalWork < fc.minWork * 1e9) return false;
      if (fc.maxWork !== null && p.totalWork > fc.maxWork * 1e9) return false;
      if (fc.minWork24h !== null && p.totalWork24h < fc.minWork24h * 1e9) return false;
      if (fc.maxWork24h !== null && p.totalWork24h > fc.maxWork24h * 1e9) return false;
      if (fc.minSpeed !== null && p.speed < fc.minSpeed * 1e6) return false;
      if (fc.maxSpeed !== null && p.speed > fc.maxSpeed * 1e6) return false;
      if (fc.minSpeed24h !== null && p.speed24h < fc.minSpeed24h * 1e6) return false;
      if (fc.maxSpeed24h !== null && p.speed24h > fc.maxSpeed24h * 1e6) return false;
      if (fc.minEfficiency !== null && p.efficiency < fc.minEfficiency * 1e12) return false;
      if (fc.maxEfficiency !== null && p.efficiency > fc.maxEfficiency * 1e12) return false;
      if (fc.minEfficiency24h !== null && p.efficiency24h < fc.minEfficiency24h * 1e12) return false;
      if (fc.maxEfficiency24h !== null && p.efficiency24h > fc.maxEfficiency24h * 1e12) return false;
      if (fc.minTotalCost !== null && p.totalCost < fc.minTotalCost) return false;
      if (fc.maxTotalCost !== null && p.totalCost > fc.maxTotalCost) return false;
      if (fc.minTotalCost24h !== null && p.totalCost24h < fc.minTotalCost24h) return false;
      if (fc.maxTotalCost24h !== null && p.totalCost24h > fc.maxTotalCost24h) return false;
      if (fc.minWorkHours !== null && p.totalWorkHours < fc.minWorkHours) return false;
      if (fc.maxWorkHours !== null && p.totalWorkHours > fc.maxWorkHours) return false;
      if (fc.minWorkHours24h !== null && p.totalWorkHours24h < fc.minWorkHours24h) return false;
      if (fc.maxWorkHours24h !== null && p.totalWorkHours24h > fc.maxWorkHours24h) return false;
      if (fc.minNumberOfJobs !== null && p.numberOfJobs < fc.minNumberOfJobs) return false;
      if (fc.maxNumberOfJobs !== null && p.numberOfJobs > fc.maxNumberOfJobs) return false;
      if (fc.minNumberOfJobs24h !== null && p.numberOfJobs24h < fc.minNumberOfJobs24h) return false;
      if (fc.maxNumberOfJobs24h !== null && p.numberOfJobs24h > fc.maxNumberOfJobs24h) return false;
      // filter passed
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const { sortBy, sortOrder } = filterCriteria;
      let aVal, bVal;

      // Handle special calculated cases first
      if (sortBy === "score") {
        aVal = getProviderScore(a);
        bVal = getProviderScore(b);
      } else if (sortBy === "providerName") {
        // Handle string comparison
        aVal = a.providerName.toLowerCase();
        bVal = b.providerName.toLowerCase();
      } else {
        // Handle direct property lookup for all other numeric cases
        aVal = a[sortBy] ?? 0;
        bVal = b[sortBy] ?? 0;
      }

      // The actual comparison logic
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return {
      totalMatches: sorted.length,
      displayedProviders: sorted.slice(0, filterCriteria.displayLimit),
    };
  }, [providerData, filterCriteria]);

  return (
    <div className="container mx-auto max-w-7xl pt-4 sm:pt-6 lg:pt-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
        <aside className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-20 space-y-4">
            <FilterPanel filters={filterCriteria} onFilterChange={handleFilterChange} />
            <Button variant="outline" className="w-full" onClick={resetFilters}>
              <FilterX className="mr-2 size-4" /> Reset Filters
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(internalQuery);
              }}
            >
              Copy curl query
            </Button>
          </div>
        </aside>

        <main className="lg:col-span-3">
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
              <p className="text-muted-foreground">
                {loading
                  ? "Searching for providers..."
                  : `Displaying ${displayedProviders.length} of ${totalMatches} matching providers.`}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              {/* Sort By Dropdown */}
              <div className="flex-grow sm:flex-grow-0">
                <Label htmlFor="sort-by" className="text-sm font-medium">
                  Sort By
                </Label>
                <Select
                  value={filterCriteria.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value as FilterCriteria["sortBy"])}
                >
                  <SelectTrigger id="sort-by" className="mt-1 w-full sm:w-[180px]">
                    <SelectValue placeholder="Select sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Dropdown */}
              <div>
                <Label htmlFor="sort-order" className="text-sm font-medium">
                  Order
                </Label>
                <Select
                  value={filterCriteria.sortOrder}
                  onValueChange={(value) => handleFilterChange("sortOrder", value as "asc" | "desc")}
                >
                  <SelectTrigger id="sort-order" className="mt-1 w-full sm:w-[120px]">
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="mr-2 size-4" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <FilterPanel filters={filterCriteria} onFilterChange={handleFilterChange} />
                  </SheetContent>
                </Sheet>
                <Button onClick={() => fetchData(true)} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ) : displayedProviders.length > 0 ? (
            <div className="space-y-4">
              {displayedProviders.map((provider, index) => (
                <ProviderCard key={provider.providerId} provider={provider} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className="border-muted-foreground/30 flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-24 text-center">
              <h3 className="text-xl font-semibold">No Providers Found</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Try adjusting your filters or click &quot;Reset Filters&quot;.
              </p>
              <Button variant="secondary" className="mt-4" onClick={resetFilters}>
                <FilterX className="mr-2 size-4" /> Reset Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProvidersPage;
