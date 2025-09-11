export interface ProviderData {
  grouped: string;
  byProviderId: Record<
    string,
    {
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
  >;
}
