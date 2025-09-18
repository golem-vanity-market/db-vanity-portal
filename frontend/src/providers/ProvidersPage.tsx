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
import { ArrowUp, Filter, FilterX, Loader2, RefreshCw } from "lucide-react";
import { ProviderFilters } from "./ProviderFilters";
import { ProviderCard } from "./ProviderCard";
import { getProviderScore } from "./provider-utils";
import InfiniteScroll from "react-infinite-scroll-component";
import { escapeForJS } from "@/utils";
import ExperimentalAlert from "@/components/ExperimentalAlert";
import { useFilterState } from "./useFilterState";
import { FilterCriteria } from "./provider-types";

const CACHE_KEY = "providerDataCache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

const ProvidersPage = () => {
  const [loading, setLoading] = useState(true);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { filter, changeFilterField, resetFilters } = useFilterState();

  const client = useMemo(
    () =>
      createROClient(
        parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID || ""),
        import.meta.env.VITE_GOLEM_DB_RPC || "",
        import.meta.env.VITE_GOLEM_DB_RPC_WS || "",
      ),
    [],
  );
  const fetchMoreData = () => {
    setDisplayLimit((prev) => prev + 50);
  };

  const [internalQuery, setInternalQuery] = useState<string>("");
  const [curlQuery, setCurlQuery] = useState<string>("");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    let completeQuery = `curl ${
      import.meta.env.VITE_GOLEM_DB_RPC
    } -X POST -H "Content-Type: application/json" --data '{"method":"golembase_queryEntities","params":["%%QUERY%%"], "id": 1, "jsonrpc":"2.0"}' | jq '.result[] | .value' | wc -l`;

    let numberOfParenthesis = 0;
    let qbuild = `$owner = "${import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS}"`;
    if (filter.providerNameSearch) {
      numberOfParenthesis += 1;
      qbuild += ` && name = "${escapeForJS(filter.providerNameSearch)}")`;
    }
    if (filter.minWork !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWork >= "${mapValueForAnnotation(filter.minWork * 1e9, "totalWork")}")`;
    }
    if (filter.maxWork !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWork <= "${mapValueForAnnotation(filter.maxWork * 1e9, "totalWork")}")`;
    }
    if (filter.minWork24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWork24h >= "${mapValueForAnnotation(filter.minWork24h * 1e9, "totalWork24h")}")`;
    }
    if (filter.maxWork24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWork24h <= "${mapValueForAnnotation(filter.maxWork24h * 1e9, "totalWork24h")}")`;
    }
    if (filter.minSpeed !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && speed >= "${mapValueForAnnotation(filter.minSpeed * 1e6, "speed")}")`;
    }
    if (filter.maxSpeed !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && speed <= "${mapValueForAnnotation(filter.maxSpeed * 1e6, "speed")}")`;
    }
    if (filter.minSpeed24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && speed24h >= "${mapValueForAnnotation(filter.minSpeed24h * 1e6, "speed24h")}")`;
    }
    if (filter.maxSpeed24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && speed24h <= "${mapValueForAnnotation(filter.maxSpeed24h * 1e6, "speed24h")}")`;
    }
    if (filter.minEfficiency !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && efficiency >= "${mapValueForAnnotation(filter.minEfficiency * 1e12, "efficiency")}")`;
    }
    if (filter.maxEfficiency !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && efficiency <= "${mapValueForAnnotation(filter.maxEfficiency * 1e12, "efficiency")}")`;
    }
    if (filter.minEfficiency24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && efficiency24h >= "${mapValueForAnnotation(filter.minEfficiency24h * 1e12, "efficiency24h")}")`;
    }
    if (filter.maxEfficiency24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && efficiency24h <= "${mapValueForAnnotation(filter.maxEfficiency24h * 1e12, "efficiency24h")}")`;
    }
    if (filter.minTotalCost !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalCost >= "${mapValueForAnnotation(filter.minTotalCost, "totalCost")}")`;
    }
    if (filter.maxTotalCost !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalCost <= "${mapValueForAnnotation(filter.maxTotalCost, "totalCost")}")`;
    }
    if (filter.minTotalCost24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalCost24h >= "${mapValueForAnnotation(filter.minTotalCost24h, "totalCost24h")}")`;
    }
    if (filter.maxTotalCost24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalCost24h <= "${mapValueForAnnotation(filter.maxTotalCost24h, "totalCost24h")}")`;
    }
    if (filter.minWorkHours !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWorkHours >= "${mapValueForAnnotation(filter.minWorkHours, "totalWorkHours")}")`;
    }
    if (filter.maxWorkHours !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWorkHours <= "${mapValueForAnnotation(filter.maxWorkHours, "totalWorkHours")}")`;
    }
    if (filter.minWorkHours24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWorkHours24h >= "${mapValueForAnnotation(filter.minWorkHours24h, "totalWorkHours24h")}")`;
    }
    if (filter.maxWorkHours24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && totalWorkHours24h <= "${mapValueForAnnotation(filter.maxWorkHours24h, "totalWorkHours24h")}")`;
    }
    if (filter.minNumberOfJobs !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && numberOfJobs >= ${mapValueForNumberAnnotation(filter.minNumberOfJobs, "numberOfJobs")})`;
    }
    if (filter.maxNumberOfJobs !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && numberOfJobs <= ${mapValueForNumberAnnotation(filter.maxNumberOfJobs, "numberOfJobs")})`;
    }
    if (filter.minNumberOfJobs24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && numberOfJobs24h >= ${mapValueForNumberAnnotation(filter.minNumberOfJobs24h, "numberOfJobs24h")})`;
    }
    if (filter.maxNumberOfJobs24h !== null) {
      numberOfParenthesis += 1;
      qbuild += ` && numberOfJobs24h <= ${mapValueForNumberAnnotation(filter.maxNumberOfJobs24h, "numberOfJobs24h")})`;
    }

    qbuild = "(".repeat(numberOfParenthesis) + qbuild;
    setInternalQuery(qbuild);
    completeQuery = completeQuery.replace("%%QUERY%%", escapeForJS(qbuild));
    setCurlQuery(completeQuery);
  }, [filter]);

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
        const entities = await fetchAllEntities(client, 10, import.meta.env.VITE_GOLEM_DB_OWNER_ADDRESS, internalQuery);
        const data = new ProviderData({ grouped: "all", byProviderId: entities });
        setProviderData(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
      } catch (error) {
        console.error("Error fetching provider data:", error);
      } finally {
        setLoading(false);
      }
    },
    [client, internalQuery],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const { displayedProviders, totalMatches } = useMemo(() => {
    if (!providerData) {
      return { displayedProviders: [], totalMatches: 0 };
    }

    const providers = Object.values(providerData.byProviderId);
    const fc = filter;

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
      const { sortBy, sortOrder } = filter;
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
      displayedProviders: sorted.slice(0, displayLimit),
    };
  }, [providerData, filter, displayLimit]);

  const changeFilterFieldAndResetList = (key: keyof FilterCriteria, value: string | number | null) => {
    changeFilterField(key, value);
    window.scrollTo({ top: 0, behavior: "instant" });
    setDisplayLimit(50); // Reset display limit on filter change
  };

  return (
    <div className="container mx-auto max-w-7xl pt-4 sm:pt-6 lg:pt-8">
      <ExperimentalAlert />
      <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8">
        <aside className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-20 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <ProviderFilters filter={filter} changeFilterField={changeFilterFieldAndResetList} />
              </CardContent>
            </Card>
            <Button variant="outline" className="w-full" onClick={resetFilters}>
              <FilterX className="mr-2 size-4" /> Reset Filters
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(curlQuery);
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
                  : `${totalMatches} provider${totalMatches !== 1 ? "s" : ""} match your search criteria.`}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              {/* Sort By Dropdown */}
              <div className="flex-grow sm:flex-grow-0">
                <Label htmlFor="sort-by" className="text-sm font-medium">
                  Sort By
                </Label>
                <Select
                  value={filter.sortBy}
                  onValueChange={(value) => changeFilterFieldAndResetList("sortBy", value as FilterCriteria["sortBy"])}
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
                  value={filter.sortOrder}
                  onValueChange={(value) => changeFilterFieldAndResetList("sortOrder", value as "asc" | "desc")}
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
                    <ProviderFilters filter={filter} changeFilterField={changeFilterFieldAndResetList} />
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
            <InfiniteScroll
              dataLength={displayedProviders.length}
              next={fetchMoreData}
              hasMore={displayedProviders.length < totalMatches}
              loader={
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="mr-2 size-8 animate-spin" />
                  <span>Loading more providers...</span>
                </div>
              }
              endMessage={
                <p className="py-4 text-center text-sm text-muted-foreground">
                  <b>You have seen all {totalMatches} providers.</b>
                </p>
              }
              className="space-y-4"
            >
              {displayedProviders.map((provider, index) => (
                <ProviderCard key={provider.providerId} provider={provider} rank={index + 1} />
              ))}
            </InfiniteScroll>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-24 text-center">
              <h3 className="text-xl font-semibold">No Providers Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters or click &quot;Reset Filters&quot;.
              </p>
              <Button variant="secondary" className="mt-4" onClick={resetFilters}>
                <FilterX className="mr-2 size-4" /> Reset Filters
              </Button>
            </div>
          )}
        </main>
      </div>
      {showBackToTop && (
        <Button
          onClick={scrollToTop}
          className="fixed right-4 bottom-4 z-50 h-12 w-12 rounded-full shadow-lg"
          variant="outline"
          size="icon"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ProvidersPage;
