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
