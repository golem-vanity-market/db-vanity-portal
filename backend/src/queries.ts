export interface BlockInfo {
  number: bigint;
  date: string | null;
}

interface ApplicationState {
  latestBlock: BlockInfo | null;
}

export const appState: ApplicationState = {
  latestBlock: null,
};

class Operations {

  public updateBlockInfo(blockInfo: BlockInfo) {
    appState.latestBlock = blockInfo;
  }

}

export const operations = new Operations();
