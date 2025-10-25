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
  minLongestJob: number | null;
  maxLongestJob: number | null;
  minLongestJob24h: number | null;
  maxLongestJob24h: number | null;
  providerNameSearch: string;

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
    | "longestJob"
    | "score";
  sortOrder: "asc" | "desc";
}

export const sortOptions = [
  { value: "providerName", label: "Provider Name" },
  { value: "longestJob", label: "Longest Job (All Time)" },
  { value: "longestJob24h", label: "Longest Job (24h)" },
  { value: "speed", label: "Speed (All Time)" },
  { value: "speed24h", label: "Speed (24h)" },
  { value: "efficiency", label: "Efficiency (All Time)" },
  { value: "efficiency24h", label: "Efficiency (24h)" },
  { value: "totalWorkHours", label: "Work Hours (All Time)" },
  { value: "totalWorkHours24h", label: "Work Hours (24h)" },
  { value: "totalCost", label: "Cost (All Time)" },
  { value: "totalCost24h", label: "Cost (24h)" },
  { value: "numberOfJobs", label: "Jobs (All Time)" },
  { value: "numberOfJobs24h", label: "Jobs (24h)" },
  { value: "score", label: "Score" },
];
