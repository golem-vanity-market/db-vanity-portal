interface ProviderDataEntry {
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
    this.byProviderId = { };
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
        longestJob: value.longestJob
      }; // create a copy of each entry
    }
  }

  clone(): ProviderData {
    return new ProviderData(this);
  }
}

