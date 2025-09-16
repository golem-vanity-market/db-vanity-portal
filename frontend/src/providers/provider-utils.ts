import { ProviderDataEntry } from "../../../shared/src/provider";

export const getProviderScore = (provider: ProviderDataEntry): number => {
  const speedScore = provider.speed ? provider.speed / 10.0e6 : 0;
  const efficiencyScore = provider.efficiency ? provider.efficiency / 1.0e12 : 0;
  const sp = Math.min(speedScore, 1.0);
  let ep = Math.min(efficiencyScore, 1.0);
  if (provider.totalCost === 0) ep = 1;
  return ((sp + ep) / 2.0) * 100;
};
