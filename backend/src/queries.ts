import { type ProviderData } from "../../shared/src/provider.ts";

export interface BlockInfo {
  number: bigint;
  date: string | null;
}

/**
 *       "providerName": "magical-passenger",
 *       "providerId": "0x6d39b54b74d0fa63688e2e1b2c83d706fe304052",
 *       "numberOfJobs": 120,
 *       "numberOfJobs24h": 0,
 *       "totalWork": 196062267384,
 *       "totalWork24h": 0,
 *       "jobId": "sum",
 *       "totalCost": 0.3055777114419082,
 *       "totalWorkHours": 51.41130500000003,
 *       "totalWorkHours24h": 0,
 *       "totalCost24h": 0,
 *       "lastJobDate": "2025-09-10T00:29:41.506Z",
 *       "longestJob": 3.986357777777778
 */

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
