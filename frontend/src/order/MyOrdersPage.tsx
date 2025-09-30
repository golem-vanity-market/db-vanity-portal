import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { createClient, Tagged } from "golem-base-sdk";
import { Link } from "react-router-dom";
import { OrderCard } from "./OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderWithTimestampSchema } from "./order-schema";
import { PlusCircle } from "lucide-react";

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
  const rawRes = await golemClient.queryEntities(
    `vanity_market_request="1" && $owner="${golemClient.getRawClient().walletClient.account.address}"`,
  );
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
    .filter((o) => o !== null)
    .sort((a, b) => new Date(b.order.timestamp).getTime() - new Date(a.order.timestamp).getTime());
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
    <div className="container">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button asChild>
          <Link to="/order/new">
            <PlusCircle className="size-4" />
            New Order
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to fetch orders. Please try again later.</AlertDescription>
        </Alert>
      )}

      {data && data.length === 0 && (
        <Alert>
          <AlertTitle>No Orders Found</AlertTitle>
          <AlertDescription>{`You haven't placed any orders yet. Create one to get started!`}</AlertDescription>
        </Alert>
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map(({ id, order }) => (
            <OrderCard key={id} id={id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};
