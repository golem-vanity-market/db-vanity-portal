export interface ProviderDataEntry {
  providerName: string;
  providerId: string;
  numberOfJobs: number;
  numberOfJobs24h: number;
  totalWork: number;
  totalWork24h: number;
  jobId: string;
  totalCost: number;
  totalCost24h: number;
  totalWorkHours: number;
  totalWorkHours24h: number;
  lastJobDate: string;
  longestJob: number;
  longestJob24h: number;
}

export interface FilterCriteria {
  minWorkHours: number | null;
  minWorkHours24h: number | null;
  minTotalCost: number | null;
  minTotalCost24h: number | null;
  minNumberOfJobs: number | null;
  minNumberOfJobs24h: number | null;
  providerNameSearch: string | null;

  sortBy:
    | "totalWork"
    | "totalWork24h"
    | "totalCost"
    | "totalCost24h"
    | "numberOfJobs"
    | "numberOfJobs24h"
    | "totalWorkHours"
    | "totalWorkHours24h"
    | "lastJobDate"
    | "longestJob";
  sortOrder: "asc" | "desc";
}

export interface ProviderDataType {
  grouped: string;
  byProviderId: Record<string, ProviderDataEntry>;
}

export class ProviderData implements ProviderDataType {
  grouped: string;
  byProviderId: Record<string, ProviderDataEntry>;

  constructor(data: ProviderDataType) {
    this.grouped = data.grouped;
    this.byProviderId = {};
    for (const key in data.byProviderId) {
      const value = data.byProviderId[key];
      this.byProviderId[key] = {
        providerName: value.providerName,
        providerId: value.providerId,
        numberOfJobs: value.numberOfJobs,
        numberOfJobs24h: value.numberOfJobs24h,
        totalWork: value.totalWork,
        totalWork24h: value.totalWork24h,
        jobId: value.jobId,
        totalCost: value.totalCost,
        totalCost24h: value.totalCost24h,
        totalWorkHours: value.totalWorkHours,
        totalWorkHours24h: value.totalWorkHours24h,
        lastJobDate: value.lastJobDate,
        longestJob: value.longestJob,
        longestJob24h: value.longestJob24h,
      }; // create a copy of each entry
    }
  }

  clone(): ProviderData {
    return new ProviderData(this);
  }
}
