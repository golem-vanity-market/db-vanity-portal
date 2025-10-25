import { ProviderData } from "db-vanity-model/src/provider.ts";
import { useEffect, useState } from "react";
// @ts-expect-error TS7016 Plotly types are missing
import Plot from "react-plotly.js";

interface ProviderAnalyticsProps {
  providerData: ProviderData | null;
}

interface ProcessedData {
  numberOfProviders: number;
  costs24: number[];
  costs: number[];
  speeds24: number[];
  speeds: number[];
  efficiencies24: number[];
  efficiencies: number[];
  works24: number[];
  works: number[];
  names: string[];
}

const ProviderAnalytics = ({ providerData }: ProviderAnalyticsProps) => {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null,
  );

  const chartWidth = 900;
  const chartHeight = 700;

  useEffect(() => {
    // Simulate async data processing
    setTimeout(() => {
      const resultData: ProcessedData = {
        numberOfProviders: 0,
        costs24: [],
        costs: [],
        speeds24: [],
        speeds: [],
        efficiencies24: [],
        efficiencies: [],
        works24: [],
        works: [],
        names: [],
      };

      if (providerData?.byProviderId) {
        for (const providerId in providerData.byProviderId) {
          const provider = providerData.byProviderId[providerId];
          resultData.numberOfProviders += 1;
          resultData.costs24.push(provider.totalCost24h);
          resultData.costs.push(provider.totalCost);
          resultData.speeds24.push(provider.speed24h);
          resultData.speeds.push(provider.speed);
          resultData.efficiencies24.push(provider.efficiency24h);
          resultData.efficiencies.push(provider.efficiency);
          resultData.works24.push(provider.totalWork24h);
          resultData.works.push(provider.totalWork);
          resultData.names.push(provider.providerName);
        }
      }
      setProcessedData(resultData);
    }, 1000);
  }, [providerData]);

  if (providerData && !processedData) {
    return <div>Preparing data...</div>;
  }
  if (!processedData) {
    return <div>No Provider Data Available</div>;
  }

  // ======== Plot Helper Functions =========

  const plotHistogram = (arr: number[], title: string) => (
    <Plot
      data={[
        {
          x: arr,
          type: "histogram",
          marker: { color: "blue" },
        },
      ]}
      layout={{
        width: chartWidth,
        height: chartHeight,
        bargap: 0.1,
        title: { text: title },
      }}
    />
  );

  const plotScatter = (
    x: number[],
    y: number[],
    labels: string[],
    xTitle: string,
    yTitle: string,
    title: string,
  ) => (
    <Plot
      data={[
        {
          x,
          y,
          text: labels,
          type: "scatter",
          mode: "markers",
          marker: { color: "blue" },
        },
      ]}
      layout={{
        width: chartWidth,
        height: chartHeight,
        xaxis: { title: { text: xTitle } },
        yaxis: { title: { text: yTitle } },
        title: { text: title },
      }}
    />
  );

  const plotScatter3D = (
    x: number[],
    y: number[],
    z: number[],
    labels: string[],
    xTitle: string,
    yTitle: string,
    zTitle: string,
    title: string,
  ) => (
    <Plot
      data={[
        {
          x,
          y,
          z,
          text: labels,
          type: "scatter3d",
          mode: "markers",
          marker: { color: "blue" },
        },
      ]}
      layout={{
        width: chartWidth,
        height: chartHeight,
        scene: {
          xaxis: { title: { text: xTitle } },
          yaxis: { title: { text: yTitle } },
          zaxis: { title: { text: zTitle } },
        },
        title: { text: title },
      }}
    />
  );

  // ======== Render =========

  return (
    <div>
      <div>
        Provider Analytics Component for {processedData.numberOfProviders}{" "}
        entries
      </div>

      {plotScatter(
        processedData.speeds24,
        processedData.works24,
        processedData.names,
        "Speed (24h)",
        "Work (24h)",
        "Speed vs Work (24h)",
      )}

      {plotScatter(
        processedData.works24,
        processedData.costs24,
        processedData.names,
        "Work (24h)",
        "Cost (24h)",
        "Work vs Cost (24h)",
      )}

      {plotScatter3D(
        processedData.works24,
        processedData.speeds24,
        processedData.costs24,
        processedData.names,
        "Work (24h)",
        "Speed (24h)",
        "Cost (24h)",
        "3D Work-Speed-Cost (24h)",
      )}

      {plotHistogram(processedData.costs24, "Earnings distribution (24h)")}
      {plotHistogram(processedData.costs, "Earnings distribution (7d)")}
      {plotHistogram(processedData.speeds24, "Speed distribution (24h)")}
      {plotHistogram(processedData.speeds, "Speed distribution (7d)")}
      {plotHistogram(
        processedData.efficiencies24,
        "Efficiency distribution (24h)",
      )}
      {plotHistogram(
        processedData.efficiencies,
        "Efficiency distribution (7d)",
      )}
      {plotHistogram(processedData.works24, "Work distribution (24h)")}
      {plotHistogram(processedData.works, "Work distribution (7d)")}
    </div>
  );
};

export default ProviderAnalytics;
