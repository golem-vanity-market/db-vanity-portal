export interface BlockInfo {
  number: bigint;
  date: string | null;
}

export interface ProviderData {
  grouped: string;
  byProviderId: Record<
    string,
    {
      providerName: string;
      providerId: string;
      numberOfJobs: number;
      totalWork: number;
      jobId: string;
      totalCost: number;
      totalWorkHours: number;
    }
  >;
}

interface ApplicationState {
  latestBlock: BlockInfo | null;
  providerData: ProviderData | null;
}

export const appState: ApplicationState = {
  latestBlock: null,
  providerData: null,
};

class Operations {
  public getProviderData(): ProviderData | null {
    return appState.providerData;
  }

  public updateBlockInfo(blockInfo: BlockInfo) {
    appState.latestBlock = blockInfo;
  }

  public updateProviderData(providerData: ProviderData | null) {
    appState.providerData = providerData;
  }
}

export const operations = new Operations();
