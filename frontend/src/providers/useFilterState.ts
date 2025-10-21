import { useCallback, useReducer, useEffect } from "react";
import { FilterCriteria } from "./provider-types";

export interface HistoricalFilter {
  id: string;
  filter: FilterCriteria;
  createdAt: Date;
  customName?: string;
}

interface FilterStateShape {
  stagedFilters: FilterCriteria;
  appliedFilters: FilterCriteria;
  filterHistory: HistoricalFilter[];
  favoriteFilters: HistoricalFilter[];
}

type FilterAction =
  | {
      type: "CHANGE_STAGED_FILTER_FIELD";
      payload: { key: keyof FilterCriteria; value: any };
    }
  | { type: "APPLY_FILTERS" }
  | { type: "SET_AND_APPLY_STAGED_FILTERS"; payload: Partial<FilterCriteria> }
  | { type: "RESET_FILTERS" }
  | { type: "APPLY_HISTORICAL_FILTER"; payload: FilterCriteria }
  | { type: "REMOVE_FROM_HISTORY"; payload: string }
  | { type: "PROMOTE_TO_FAVORITE"; payload: string }
  | { type: "REMOVE_FROM_FAVORITES"; payload: string }
  | { type: "UPDATE_FAVORITE_NAME"; payload: { id: string; newName: string } };

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
  maxLongestJob: null,
  minLongestJob: null,
  maxLongestJob24h: null,
  minLongestJob24h: null,
  sortBy: "score",
  sortOrder: "desc",
});

const filterReducer = (
  state: FilterStateShape,
  action: FilterAction,
): FilterStateShape => {
  switch (action.type) {
    case "CHANGE_STAGED_FILTER_FIELD":
      return {
        ...state,
        stagedFilters: {
          ...state.stagedFilters,
          [action.payload.key]: action.payload.value,
        },
      };
    case "APPLY_FILTERS": {
      const newHistoryEntry: HistoricalFilter = {
        id: crypto.randomUUID(),
        filter: state.stagedFilters,
        createdAt: new Date(),
      };
      const newHistory = [newHistoryEntry, ...state.filterHistory].slice(0, 10);
      return {
        ...state,
        appliedFilters: state.stagedFilters,
        filterHistory: newHistory,
      };
    }
    case "SET_AND_APPLY_STAGED_FILTERS": {
      const newFilters = { ...state.stagedFilters, ...action.payload };
      const newHistoryEntry: HistoricalFilter = {
        id: crypto.randomUUID(),
        filter: newFilters,
        createdAt: new Date(),
      };
      const newHistory = [newHistoryEntry, ...state.filterHistory].slice(0, 10);
      return {
        ...state,
        stagedFilters: newFilters,
        appliedFilters: newFilters,
        filterHistory: newHistory,
      };
    }
    case "RESET_FILTERS":
      return {
        ...state,
        stagedFilters: defaultFilterCriteria(),
        appliedFilters: defaultFilterCriteria(),
      };
    case "APPLY_HISTORICAL_FILTER":
      return {
        ...state,
        stagedFilters: action.payload,
        appliedFilters: action.payload,
      };
    case "REMOVE_FROM_HISTORY":
      return {
        ...state,
        filterHistory: state.filterHistory.filter(
          (f) => f.id !== action.payload,
        ),
      };
    case "PROMOTE_TO_FAVORITE": {
      const entryToPromote = state.filterHistory.find(
        (f) => f.id === action.payload,
      );
      if (!entryToPromote) return state;
      return {
        ...state,
        filterHistory: state.filterHistory.filter(
          (f) => f.id !== action.payload,
        ),
        favoriteFilters: [entryToPromote, ...state.favoriteFilters],
      };
    }
    case "REMOVE_FROM_FAVORITES":
      return {
        ...state,
        favoriteFilters: state.favoriteFilters.filter(
          (f) => f.id !== action.payload,
        ),
      };
    case "UPDATE_FAVORITE_NAME":
      return {
        ...state,
        favoriteFilters: state.favoriteFilters.map((f) =>
          f.id === action.payload.id
            ? { ...f, customName: action.payload.newName }
            : f,
        ),
      };
    default:
      return state;
  }
};

const buildFilterFromLocalStorage = (
  cached: Partial<FilterCriteria> | null,
  defaults: FilterCriteria,
): FilterCriteria => {
  if (!cached) {
    return defaults;
  }
  return {
    providerNameSearch:
      cached.providerNameSearch ?? defaults.providerNameSearch,
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
    minNumberOfJobs24h:
      cached.minNumberOfJobs24h ?? defaults.minNumberOfJobs24h,
    maxNumberOfJobs24h:
      cached.maxNumberOfJobs24h ?? defaults.maxNumberOfJobs24h,
    minLongestJob: cached.minLongestJob ?? defaults.minLongestJob,
    maxLongestJob: cached.maxLongestJob ?? defaults.maxLongestJob,
    minLongestJob24h: cached.minLongestJob24h ?? defaults.minLongestJob24h,
    maxLongestJob24h: cached.maxLongestJob24h ?? defaults.maxLongestJob24h,
  };
};

const initializer = (): FilterStateShape => {
  const defaults = defaultFilterCriteria();
  const initialState: FilterStateShape = {
    stagedFilters: defaults,
    appliedFilters: defaults,
    filterHistory: [],
    favoriteFilters: [],
  };

  try {
    const cachedHistory = localStorage.getItem("providerFilterHistory");
    if (cachedHistory) {
      const parsed = JSON.parse(cachedHistory);
      if (Array.isArray(parsed)) {
        initialState.filterHistory = parsed.map((item: any) => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
          createdAt: new Date(item.createdAt),
          filter: buildFilterFromLocalStorage(item.filter, defaults),
        }));
        if (initialState.filterHistory.length > 0) {
          initialState.appliedFilters = initialState.filterHistory[0].filter;
          initialState.stagedFilters = initialState.filterHistory[0].filter;
        }
      }
    }

    const cachedFavorites = localStorage.getItem("providerFavoriteFilters");
    if (cachedFavorites) {
      const parsed = JSON.parse(cachedFavorites);
      if (Array.isArray(parsed)) {
        initialState.favoriteFilters = parsed.map((item: any) => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
          createdAt: new Date(item.createdAt),
          customName: item.customName ?? "",
          filter: buildFilterFromLocalStorage(item.filter, defaults),
        }));
      }
    }
  } catch (e) {
    console.error("Failed to load filters from local storage", e);
    // In case of error, return default state
    return {
      stagedFilters: defaultFilterCriteria(),
      appliedFilters: defaultFilterCriteria(),
      filterHistory: [],
      favoriteFilters: [],
    };
  }

  return initialState;
};

export function useFilterState() {
  const [state, dispatch] = useReducer(filterReducer, undefined, initializer);

  useEffect(() => {
    localStorage.setItem(
      "providerFilterHistory",
      JSON.stringify(state.filterHistory),
    );
    localStorage.setItem(
      "providerFavoriteFilters",
      JSON.stringify(state.favoriteFilters),
    );
  }, [state.filterHistory, state.favoriteFilters]);

  const changeStagedFilterField = useCallback(
    <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => {
      dispatch({ type: "CHANGE_STAGED_FILTER_FIELD", payload: { key, value } });
    },
    [],
  );

  const applyFilters = useCallback(() => {
    dispatch({ type: "APPLY_FILTERS" });
  }, []);

  const setAndApplyStagedFilters = useCallback(
    (newFilterCriteria: Partial<FilterCriteria>) => {
      dispatch({
        type: "SET_AND_APPLY_STAGED_FILTERS",
        payload: newFilterCriteria,
      });
    },
    [],
  );

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  const applyHistoricalFilter = useCallback((filter: FilterCriteria) => {
    dispatch({ type: "APPLY_HISTORICAL_FILTER", payload: filter });
  }, []);

  const deleteHistoricalFilter = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FROM_HISTORY", payload: id });
  }, []);

  const promoteToFavorite = useCallback((id: string) => {
    dispatch({ type: "PROMOTE_TO_FAVORITE", payload: id });
  }, []);

  const deleteFavoriteFilter = useCallback((id: string) => {
    dispatch({ type: "REMOVE_FROM_FAVORITES", payload: id });
  }, []);

  const updateFavoriteName = useCallback((id: string, newName: string) => {
    dispatch({ type: "UPDATE_FAVORITE_NAME", payload: { id, newName } });
  }, []);

  return {
    ...state,
    changeStagedFilterField,
    applyFilters,
    setAndApplyStagedFilters,
    resetFilters,
    applyHistoricalFilter,
    deleteHistoricalFilter,
    promoteToFavorite,
    deleteFavoriteFilter,
    updateFavoriteName,
  };
}

export type FilterState = ReturnType<typeof useFilterState>;
