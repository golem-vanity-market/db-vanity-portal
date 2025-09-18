import { useCallback, useState } from "react";
import { FilterCriteria } from "./provider-types";

export interface HistoricalFilter {
  id: string;
  filter: FilterCriteria;
  createdAt: Date;
}

const buildFilterFromLocalStorage = (
  cached: Partial<FilterCriteria> | null,
  defaults: FilterCriteria,
): FilterCriteria => {
  if (!cached) {
    return defaults;
  }
  return {
    providerNameSearch: cached.providerNameSearch ?? defaults.providerNameSearch,
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
});

export function useFilterState() {
  const [filterHistory, setFilterHistory] = useState<HistoricalFilter[]>(() => {
    const cachedItem = localStorage.getItem("providerFilterHistory");
    if (!cachedItem) return [];
    let parsedArray = null;
    try {
      parsedArray = JSON.parse(cachedItem);
      if (!Array.isArray(parsedArray)) {
        throw new Error("Parsed value is not an array");
      }
    } catch {
      // ignore parsing errors
      localStorage.removeItem("providerFilterHistory");
      return [];
    }
    const defaults = defaultFilterCriteria();
    return parsedArray.map((item) => ({
      ...item,
      id: item.id ?? crypto.randomUUID(),
      createdAt: new Date(item.createdAt),
      filter: buildFilterFromLocalStorage(item.filter, defaults),
    }));
  });

  const [appliedFilters, setAppliedFilters] = useState<FilterCriteria>(() => {
    const defaults = defaultFilterCriteria();
    if (filterHistory.length > 0) {
      return filterHistory[0].filter;
    }
    return defaults;
  });

  const [stagedFilters, setStagedFilters] = useState<FilterCriteria>(appliedFilters);

  const addToHistory = useCallback((newFilter: FilterCriteria) => {
    setFilterHistory((prev) => {
      const newHistoricalFilter: HistoricalFilter = {
        id: crypto.randomUUID(),
        filter: newFilter,
        createdAt: new Date(),
      };
      const updatedHistory = [newHistoricalFilter, ...prev].slice(0, 10);
      localStorage.setItem("providerFilterHistory", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setFilterHistory((prev) => {
      const updatedHistory = prev.filter((f) => f.id !== id);
      localStorage.setItem("providerFilterHistory", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  const applyStagedFiltersWithoutHistory = useCallback((filter: FilterCriteria) => {
    setAppliedFilters(filter);
  }, []);

  const applyFilters = useCallback(() => {
    applyStagedFiltersWithoutHistory(stagedFilters);
    addToHistory(stagedFilters);
  }, [applyStagedFiltersWithoutHistory, addToHistory, stagedFilters]);

  const changeStagedFilterField = useCallback(<K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
    setStagedFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    const defaults = defaultFilterCriteria();
    setStagedFilters(defaults);
    setAppliedFilters(defaults);
  }, []);

  return {
    stagedFilters,
    appliedFilters,
    changeStagedFilterField,
    resetFilters,
    filterHistory,
    addToHistory,
    applyFilters,
    setStagedFilters,
    applyStagedFiltersWithoutHistory,
    removeFromHistory,
  };
}

export type FilterState = ReturnType<typeof useFilterState>;
