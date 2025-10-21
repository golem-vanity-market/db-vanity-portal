import React from "react";
import { useSearchParams } from "react-router-dom";
import { getAddress } from "viem";

interface FancyEntry {
  address: string;
  created: Date;
  score: number;
}

const DetailsPage = () => {
  // Grab the query params from the URL
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get("providerId"); // e.g. /details?providerId=123

  const [fancies, setFancies] = React.useState<any[]>([]);

  const fetchProviderData = async (providerId: string) => {
    const since = "2025-09-18T00:00:00Z";
    const entr = await fetch(
      `https://addressology.net/api/fancy/list?limit=1000&provider_id=${providerId}&public_key_base=all&order=score&since=${since}&free=free`,
    );

    const entrJson = await entr.json();

    const entrNew = [];
    for (const entr of entrJson) {
      entrNew.push({
        address: getAddress(entr.address),
        created: new Date(entr.created),
        score: parseFloat(entr.score),
      });
    }
    setFancies(entrNew);
  };

  React.useEffect(() => {
    if (providerId) {
      fetchProviderData(providerId);
    }
  }, [providerId]);

  if (!providerId) {
    return <div>No provider ID specified in the URL.</div>;
  }
  //https://addressology.net/api/fancy/list?limit=1000&provider_id=0x7c5343fe91aae4c2e513396c0d6e66f0de388e9a&public_key_base=all&order=score&since=2025-09-18T00:00:00Z&free=free

  return (
    <div>
      <div className={"mb-4 rounded border border-gray-300 bg-yellow-50 p-4"}>
        This part is not finished yet !<br />
        Do not give feedback based on this page.
      </div>

      <h1 className={"mb-4 text-lg font-bold"}>
        Fancies for Provider {providerId}
      </h1>

      {fancies.length === 0 ? (
        <p>Loading fancies...</p>
      ) : (
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Address
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Created
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left">
                Score (×10⁹)
              </th>
            </tr>
          </thead>
          <tbody>
            {fancies.map((fancy: FancyEntry, index: number) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2 font-mono">
                  {fancy.address}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {fancy.created.toISOString()}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  {(fancy.score / 1e9).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DetailsPage;
