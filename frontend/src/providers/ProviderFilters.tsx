import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CircleDollarSign, Cpu, FilterX, GaugeCircle, Hash, Timer, TrendingUp } from "lucide-react";
import React from "react";
import { FilterCriteria } from "./provider-types";

interface ProviderFiltersProps {
  filter: FilterCriteria;
  changeFilterField: (key: keyof FilterCriteria, value: string | number | null) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

export const filterableMetrics = [
  {
    label: "Work Hours",
    unit: "h",
    description: "The total time the provider has been active and working.",
    icon: <Timer className="size-4 text-muted-foreground" />,
    h24: { minKey: "minWorkHours24h", maxKey: "maxWorkHours24h" },
    allTime: { minKey: "minWorkHours", maxKey: "maxWorkHours" },
  },
  {
    label: "Work Done",
    unit: "GH",
    description: "The total number of addresses that the provider has searched.",
    icon: <Cpu className="size-4 text-muted-foreground" />,
    h24: { minKey: "minWork24h", maxKey: "maxWork24h" },
    allTime: { minKey: "minWork", maxKey: "maxWork" },
  },
  {
    label: "Speed",
    unit: "MH/s",
    description: "The provider's speed in terms of addresses searched per second.",
    icon: <GaugeCircle className="size-4 text-muted-foreground" />,
    h24: { minKey: "minSpeed24h", maxKey: "maxSpeed24h" },
    allTime: { minKey: "minSpeed", maxKey: "maxSpeed" },
  },
  {
    label: "Efficiency",
    unit: "TH/GLM",
    description: "The provider's efficiency in terms of addresses searched per GLM.",
    icon: <TrendingUp className="size-4 text-muted-foreground" />,
    h24: { minKey: "minEfficiency24h", maxKey: "maxEfficiency24h" },
    allTime: { minKey: "minEfficiency", maxKey: "maxEfficiency" },
  },
  {
    label: "Total Cost",
    unit: "GLM",
    description: "The total cost of the work done by the provider.",
    icon: <CircleDollarSign className="size-4 text-muted-foreground" />,
    h24: { minKey: "minTotalCost24h", maxKey: "maxTotalCost24h" },
    allTime: { minKey: "minTotalCost", maxKey: "maxTotalCost" },
  },
  {
    label: "Number of Jobs",
    unit: "",
    description: "The total number of unique agreements that were made with this provider.",
    icon: <Hash className="size-4 text-muted-foreground" />,
    h24: { minKey: "minNumberOfJobs24h", maxKey: "maxNumberOfJobs24h" },
    allTime: { minKey: "minNumberOfJobs", maxKey: "maxNumberOfJobs" },
  },
  {
    label: "Longest Job",
    unit: "h",
    description: "The duration of the longest agreement made with this provider.",
    icon: <Timer className="size-4 text-muted-foreground" />,
    h24: { minKey: "minLongestJob24h", maxKey: "maxLongestJob24h" },
    allTime: { minKey: "minLongestJob", maxKey: "maxLongestJob" },
  },
] satisfies {
  label: string;
  unit: string;
  description: string;
  icon: React.ReactNode;
  h24: { minKey: keyof FilterCriteria; maxKey: keyof FilterCriteria };
  allTime: { minKey: keyof FilterCriteria; maxKey: keyof FilterCriteria };
}[];

export const ProviderFilters = ({ filter, changeFilterField, applyFilters, resetFilters }: ProviderFiltersProps) => {
  const handleNumericChange = (key: keyof FilterCriteria, value: string) => {
    const numericValue = value === "" ? null : Number(value);
    changeFilterField(key, numericValue);
  };

  const isMetricActive = (metric: (typeof filterableMetrics)[number]) => {
    return (
      filter[metric.h24.minKey] != null ||
      filter[metric.h24.maxKey] != null ||
      filter[metric.allTime.minKey] != null ||
      filter[metric.allTime.maxKey] != null
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="providerNameSearch">Provider Name</Label>
        <Input
          id="providerNameSearch"
          placeholder="Search by name..."
          value={filter.providerNameSearch}
          onChange={(e) => changeFilterField("providerNameSearch", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Advanced Metric Filters</Label>
        <ScrollArea className="rounded-md border pr-4">
          {/* type="multiple" allows opening multiple sections at once */}
          <Accordion type="multiple" className="w-full px-3">
            {filterableMetrics.map((metric) => {
              const active = isMetricActive(metric);
              const icon = React.cloneElement(metric.icon, {
                className: `size-4 ${active ? "text-primary" : "text-muted-foreground"}`,
              });
              return (
                <AccordionItem key={metric.label} value={metric.label}>
                  <AccordionTrigger className="cursor-pointer py-3">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger className="flex cursor-pointer items-center gap-2 ">
                          {icon}
                          <span className="text-sm font-semibold">
                            {metric.label} {metric.unit && `(${metric.unit})`}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{metric.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Last 24h</Label>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={filter[metric.h24.minKey] ?? ""}
                            onChange={(e) => handleNumericChange(metric.h24.minKey, e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={filter[metric.h24.maxKey] ?? ""}
                            onChange={(e) => handleNumericChange(metric.h24.maxKey, e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-muted-foreground">All Time</Label>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={filter[metric.allTime.minKey] ?? ""}
                            onChange={(e) => handleNumericChange(metric.allTime.minKey, e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Max"
                            value={filter[metric.allTime.maxKey] ?? ""}
                            onChange={(e) => handleNumericChange(metric.allTime.maxKey, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
          <Button variant="outline" className="w-full" onClick={resetFilters}>
            <FilterX className="mr-2 size-4" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
