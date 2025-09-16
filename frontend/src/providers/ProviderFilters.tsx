import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterCriteria } from "./provider-types";

interface ProviderFiltersProps {
  filters: FilterCriteria;
  onFilterChange: <K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) => void;
}

const filterGroups = [
  { title: "Performance (24h)", minKey: "minWorkHours24h", maxKey: "maxWorkHours24h", unit: "Hours" },
  { title: "Speed (24h)", minKey: "minSpeed24h", maxKey: "maxSpeed24h", unit: "MH/s" },
  { title: "Efficiency (24h)", minKey: "minEfficiency24h", maxKey: "maxEfficiency24h", unit: "TH/GLM" },
  { title: "Cost (24h)", minKey: "minTotalCost24h", maxKey: "maxTotalCost24h", unit: "GLM" },
  { title: "Jobs (24h)", minKey: "minNumberOfJobs24h", maxKey: "maxNumberOfJobs24h", unit: "" },
];

export const ProviderFilters = ({ filters, onFilterChange }: ProviderFiltersProps) => {
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

      <Accordion type="multiple" className="w-full" defaultValue={["item-0"]}>
        {filterGroups.map((group, index) => (
          <AccordionItem key={group.title} value={`item-${index}`}>
            <AccordionTrigger>{group.title}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={group.minKey}>Min {group.unit}</Label>
                  <Input
                    id={group.minKey}
                    type="number"
                    placeholder="0"
                    value={filters[group.minKey as keyof FilterCriteria] ?? ""}
                    onChange={(e) =>
                      onFilterChange(group.minKey as any, e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={group.maxKey}>Max {group.unit}</Label>
                  <Input
                    id={group.maxKey}
                    type="number"
                    placeholder="Any"
                    value={filters[group.maxKey as keyof FilterCriteria] ?? ""}
                    onChange={(e) =>
                      onFilterChange(group.maxKey as any, e.target.value ? Number(e.target.value) : null)
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange("sortBy", value as FilterCriteria["sortBy"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="providerName">Provider Name</SelectItem>
            <SelectItem value="speed24h">Speed (24h)</SelectItem>
            <SelectItem value="efficiency24h">Efficiency (24h)</SelectItem>
            <SelectItem value="totalWorkHours24h">Work Hours (24h)</SelectItem>
            <SelectItem value="totalCost24h">Cost (24h)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Order</Label>
        <Select
          value={filters.sortOrder}
          onValueChange={(value) => onFilterChange("sortOrder", value as "asc" | "desc")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
