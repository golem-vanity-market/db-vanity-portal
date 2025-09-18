import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { History } from "lucide-react";
import { useState } from "react";
import { FilterCriteria } from "./provider-types";
import { filterableMetrics } from "./ProviderFilters";
import { HistoricalFilter } from "./useFilterState";

interface FilterHistoryProps {
  filterHistory: HistoricalFilter[];
  applyHistoricalFilter: (filter: FilterCriteria) => void;
}

const formatFilter = (filter: FilterCriteria) => {
  const criteria: { key: string; value: string }[] = [];

  if (filter.providerNameSearch) {
    criteria.push({ key: "Name", value: filter.providerNameSearch });
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

export const FilterHistory = ({ filterHistory, applyHistoricalFilter }: FilterHistoryProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (filterHistory.length === 0) {
    return null; // Don't show the button if there's no history
  }

  const handleSelect = (filter: FilterCriteria) => {
    applyHistoricalFilter(filter);
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <History className="mr-2 size-4" /> History
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="leading-none font-medium">Filter History</h4>
          <p className="text-sm text-muted-foreground">Select a filter to apply it.</p>
        </div>
        <div className="mt-4 space-y-2">
          {filterHistory.map((historicalFilter, index) => (
            <div key={index} className="relative">
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => handleSelect(historicalFilter.filter)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="truncate">
                  {formatDate(historicalFilter.createdAt)} at{" "}
                  {historicalFilter.createdAt.toLocaleString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              </Button>
              {hoveredIndex === index && (
                <div className="absolute top-0 right-full z-10 mr-2 w-80 rounded-lg border bg-background p-4 shadow-lg">
                  <div className="space-y-1">
                    {formatFilter(historicalFilter.filter).map((line, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="font-semibold">{line.key}</span>
                        <span>{line.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
