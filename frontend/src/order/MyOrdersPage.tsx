import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { createClient, Tagged } from "golem-base-sdk";
import { Link } from "react-router-dom";
import { OrderSchema } from "./order-schema";
import z from "zod";

const OrderWithTimestampSchema = OrderSchema.extend({
  timestamp: z.string().datetime(),
});

const getEthereumGlobal = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
};

const fetchMyOrders = async () => {
  const golemClient = await createClient(
    parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
    new Tagged("ethereumprovider", getEthereumGlobal()),
    import.meta.env.VITE_GOLEM_DB_RPC,
    import.meta.env.VITE_GOLEM_DB_RPC_WS,
  );
  const rawRes = await golemClient.queryEntities('vanity_market_request="1"');
  return rawRes
    .map(({ entityKey, storageValue }) => {
      let jsonParsed = null;
      try {
        jsonParsed = JSON.parse(storageValue.toString());
      } catch (e) {
        console.error("Failed to parse JSON for order:", e);
        return null;
      }
      const parsed = OrderWithTimestampSchema.safeParse(jsonParsed);
      if (!parsed.success) {
        return null;
      }
      return { id: entityKey, order: parsed.data };
    })
    .filter((o) => o !== null);
};

export const MyOrdersPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["myOrders"],
    queryFn: fetchMyOrders,
  });

  const { isConnected } = useAppKitAccount();

  if (!isConnected) {
    return <Alert>Please connect your wallet to view your orders.</Alert>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-bold">My Orders</h1>
      <Button asChild>
        <Link to="/order/new">New Order</Link>
      </Button>
    </div>
  );
};
