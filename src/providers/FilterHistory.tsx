import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { History, Trash, Heart, Edit } from "lucide-react";
import { useState } from "react";
import { FilterCriteria, sortOptions } from "./provider-types";
import { filterableMetrics } from "./ProviderFilters";
import { HistoricalFilter } from "./useFilterState";

interface FilterHistoryProps {
  filterHistory: HistoricalFilter[];
  favoriteFilters: HistoricalFilter[];
  applyHistoricalFilter: (filter: FilterCriteria) => void;
  deleteHistoricalFilter: (id: string) => void;
  promoteToFavorite: (id: string) => void;
  deleteFavoriteFilter: (id: string) => void;
  updateFavoriteName: (id: string, newName: string) => void;
}

const formatFilter = (filter: FilterCriteria) => {
  const criteria: { key: string; value: string }[] = [];

  if (filter.providerNameSearch) {
    criteria.push({ key: "Name", value: filter.providerNameSearch });
  }

  const sortOption = sortOptions.find(
    (option) => option.value === filter.sortBy,
  );
  if (sortOption) {
    criteria.push({
      key: "Sort by",
      value: `${sortOption.label} (${filter.sortOrder})`,
    });
  }

  filterableMetrics.forEach((metric) => {
    const min24h = filter[metric.h24.minKey];
    const max24h = filter[metric.h24.maxKey];
    const minAllTime = filter[metric.allTime.minKey];
    const maxAllTime = filter[metric.allTime.maxKey];

    if (min24h !== null || max24h !== null) {
      let range = "";
      if (min24h !== null && max24h !== null) {
        range = `${min24h} - ${max24h}`;
      } else if (min24h !== null) {
        range = `> ${min24h}`;
      } else if (max24h !== null) {
        range = `< ${max24h}`;
      }
      criteria.push({ key: `${metric.label} (24h)`, value: range });
    }

    if (minAllTime !== null || maxAllTime !== null) {
      let range = "";
      if (minAllTime !== null && maxAllTime !== null) {
        range = `${minAllTime} - ${maxAllTime}`;
      } else if (minAllTime !== null) {
        range = `> ${minAllTime}`;
      } else if (maxAllTime !== null) {
        range = `< ${maxAllTime}`;
      }
      criteria.push({ key: `${metric.label} (All Time)`, value: range });
    }
  });

  return criteria.length > 0 ? criteria : [{ key: "Empty Filter", value: "" }];
};

const formatDate = (date: Date) => {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  return date.toLocaleDateString();
};

const FilterDetails = ({ filter }: { filter: FilterCriteria }) => {
  return (
    <div className="absolute top-0 left-full z-10 w-80 rounded-lg border bg-background p-4 shadow-lg">
      <div className="space-y-1">
        {formatFilter(filter).map((line, i) => (
          <div key={i} className="flex justify-between">
            <span className="font-semibold">{line.key}</span>
            <span>{line.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const FilterHistory = ({
  filterHistory,
  favoriteFilters,
  applyHistoricalFilter,
  deleteHistoricalFilter,
  promoteToFavorite,
  deleteFavoriteFilter,
  updateFavoriteName,
}: FilterHistoryProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setHoveredId(null);
      setEditingId(null);
    }
    setIsPopoverOpen(open);
  };

  const handleSelect = (filter: FilterCriteria) => {
    applyHistoricalFilter(filter);
    setIsPopoverOpen(false);
  };

  const handleEditClick = (id: string, currentName: string) => {
    // clicking edit on the same item closes the edit mode
    if (editingId === id) {
      setEditingId(null);
      return;
    }
    setEditingId(id);
    setNewName(currentName);
  };

  const handleSaveName = () => {
    if (editingId) {
      updateFavoriteName(editingId, newName);
      setEditingId(null);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <History className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="leading-none font-medium">Filter History</h4>
        </div>
        <div className="mt-4 space-y-2">
          {filterHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No filter history yet.
            </p>
          ) : (
            filterHistory.map((historicalFilter) => (
              <div
                key={historicalFilter.id}
                className="flex items-center justify-between"
              >
                <div className="relative flex-1">
                  <Button
                    variant="ghost"
                    className="justify-start text-left"
                    onClick={() => handleSelect(historicalFilter.filter)}
                    onMouseEnter={() => setHoveredId(historicalFilter.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="truncate">
                      {formatDate(historicalFilter.createdAt)} at{" "}
                      {historicalFilter.createdAt.toLocaleString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </Button>
                  {hoveredId === historicalFilter.id && (
                    <FilterDetails filter={historicalFilter.filter} />
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => promoteToFavorite(historicalFilter.id)}
                >
                  <Heart className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteHistoricalFilter(historicalFilter.id)}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        <hr className="my-4" />
        <div className="space-y-2">
          <h4 className="leading-none font-medium">Favorite Filters</h4>
          {favoriteFilters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No favorite filters yet.
            </p>
          ) : (
            favoriteFilters.map((favoriteFilter) => (
              <div
                key={favoriteFilter.id}
                className="flex items-center justify-between"
              >
                <div className="relative flex-1">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start text-left"
                    onClick={() => handleSelect(favoriteFilter.filter)}
                    onMouseEnter={() => setHoveredId(favoriteFilter.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="truncate">
                      {favoriteFilter.customName ||
                        `${formatDate(favoriteFilter.createdAt)} at ${favoriteFilter.createdAt.toLocaleString(
                          [],
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}`}
                    </div>
                  </Button>
                  {hoveredId === favoriteFilter.id && (
                    <FilterDetails filter={favoriteFilter.filter} />
                  )}
                  {editingId === favoriteFilter.id && (
                    <div className="absolute top-full z-10 w-80 rounded-lg border bg-background p-4 shadow-lg">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full rounded border p-2"
                        placeholder="Enter custom name"
                      />
                      <div className="mt-2 flex justify-end space-x-2">
                        <Button
                          variant="destructive"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleSaveName}>Save</Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    handleEditClick(
                      favoriteFilter.id,
                      favoriteFilter.customName || "",
                    )
                  }
                >
                  <Edit className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => deleteFavoriteFilter(favoriteFilter.id)}
                >
                  <Trash className="size-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
