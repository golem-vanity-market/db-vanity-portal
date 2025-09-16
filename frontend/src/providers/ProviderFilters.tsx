import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterCriteria } from "./provider-types";
import { CircleDollarSign, Cpu, GaugeCircle, Hash, Timer, TrendingUp } from "lucide-react";

interface ProviderFiltersProps {
  filters: FilterCriteria;
  onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
}

const filterableMetrics = [
  {
    label: "Work Hours",
    unit: "h",
    icon: <Timer className="text-muted-foreground size-4" />,
    h24: { minKey: "minWorkHours24h", maxKey: "maxWorkHours24h" },
    allTime: { minKey: "minWorkHours", maxKey: "maxWorkHours" },
  },
  {
    label: "Work Done",
    unit: "GH",
    icon: <Cpu className="text-muted-foreground size-4" />,
    h24: { minKey: "minWork24h", maxKey: "maxWork24h" },
    allTime: { minKey: "minWork", maxKey: "maxWork" },
  },
  {
    label: "Speed",
    unit: "MH/s",
    icon: <GaugeCircle className="text-muted-foreground size-4" />,
    h24: { minKey: "minSpeed24h", maxKey: "maxSpeed24h" },
    allTime: { minKey: "minSpeed", maxKey: "maxSpeed" },
  },
  {
    label: "Efficiency",
    unit: "TH/GLM",
    icon: <TrendingUp className="text-muted-foreground size-4" />,
    h24: { minKey: "minEfficiency24h", maxKey: "maxEfficiency24h" },
    allTime: { minKey: "minEfficiency", maxKey: "maxEfficiency" },
  },
  {
    label: "Total Cost",
    unit: "GLM",
    icon: <CircleDollarSign className="text-muted-foreground size-4" />,
    h24: { minKey: "minTotalCost24h", maxKey: "maxTotalCost24h" },
    allTime: { minKey: "minTotalCost", maxKey: "maxTotalCost" },
  },
  {
    label: "Number of Jobs",
    unit: "",
    icon: <Hash className="text-muted-foreground size-4" />,
    h24: { minKey: "minNumberOfJobs24h", maxKey: "maxNumberOfJobs24h" },
    allTime: { minKey: "minNumberOfJobs", maxKey: "maxNumberOfJobs" },
  },
];

export const ProviderFilters = ({ filters, onFilterChange }: ProviderFiltersProps) => {
  const handleNumericChange = (key: keyof FilterCriteria, value: string) => {
    onFilterChange(key, value ? Number(value) : null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="providerNameSearch">Provider Name</Label>
        <Input
          id="providerNameSearch"
          placeholder="Search by name..."
          value={filters.providerNameSearch}
          onChange={(e) => onFilterChange("providerNameSearch", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Advanced Metric Filters</Label>
        <ScrollArea className="rounded-md border pr-4">
          {/* type="multiple" allows opening multiple sections at once */}
          <Accordion type="multiple" className="w-full px-3">
            {filterableMetrics.map((metric) => (
              <AccordionItem key={metric.label} value={metric.label}>
                {/* The Trigger is now the metric name */}
                <AccordionTrigger className="py-3">
                  <div className="flex items-center gap-2">
                    {metric.icon}
                    <span className="text-sm font-semibold">
                      {metric.label} {metric.unit && `(${metric.unit})`}
                    </span>
                  </div>
                </AccordionTrigger>

                {/* The Content contains the familiar input layout */}
                <AccordionContent className="pb-4 pt-2">
                  <div className="space-y-4">
                    {/* Section for "Last 24h" */}
                    <div>
                      <Label className="text-muted-foreground text-xs">Last 24h</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters[metric.h24.minKey as keyof FilterCriteria] ?? ""}
                          onChange={(e) => handleNumericChange(metric.h24.minKey as any, e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters[metric.h24.maxKey as keyof FilterCriteria] ?? ""}
                          onChange={(e) => handleNumericChange(metric.h24.maxKey as any, e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Section for "All Time" */}
                    <div>
                      <Label className="text-muted-foreground text-xs">All Time</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters[metric.allTime.minKey as keyof FilterCriteria] ?? ""}
                          onChange={(e) => handleNumericChange(metric.allTime.minKey as any, e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters[metric.allTime.maxKey as keyof FilterCriteria] ?? ""}
                          onChange={(e) => handleNumericChange(metric.allTime.maxKey as any, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  );
};
