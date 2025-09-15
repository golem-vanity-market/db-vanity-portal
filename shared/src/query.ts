import { deserializeProvider, ProviderDataEntry } from "./provider.ts";
import { GolemBaseROClient } from "golem-base-sdk";

export async function fetchAllEntities(
  client: GolemBaseROClient,
  numberOfGroups: number,
  owner: string,
): Promise<Record<string, ProviderDataEntry>> {
  // Placeholder for actual implementation
  const proms = [];
  for (let groupNo = 1; groupNo <= numberOfGroups; groupNo++) {
    proms.push(
      client.queryEntities(`group = ${groupNo} && $owner = "${owner}"`),
    );
  }
  const byProviderId: Record<string, ProviderDataEntry> = {};

  for (const prom of proms) {
    const entities = await prom;
    for (const entity of entities) {
      let data;
      try {
        data = deserializeProvider(entity.storageValue);
      } catch (e) {
        console.error("Failed to deserialize provider data:", e);
        continue;
      }
      byProviderId[data.providerId] = data;
    }
  }
  return byProviderId;
}
