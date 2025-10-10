import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, PlusCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { makeClient } from "./helpers";
import OrdersExplainer from "./OrdersExplainer";
import OpenOrdersSection from "./OpenOrdersSection";
import MyOrdersSection from "./MyOrdersSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VanityOrderSchema, VanityRequestWithTimestampSchema, type VanityRequestWithTimestamp } from "./order-schema";
import { z } from "zod";

const fetchMyRequests = async () => {
  const golemClient = await makeClient();
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
      const parsed = VanityRequestWithTimestampSchema.safeParse(jsonParsed);
      if (!parsed.success) {
        console.error("Failed to validate request:", parsed.error);
        return null;
      }
      return { id: entityKey as string, order: parsed.data };
    })
    .filter((o): o is { id: string; order: VanityRequestWithTimestamp } => o !== null)
    .sort((a, b) => new Date(b.order.timestamp).getTime() - new Date(a.order.timestamp).getTime());
};

const fetchMyOrders = async () => {
  const golemClient = await makeClient();
  const rawRes = await golemClient.queryEntities(
    `vanity_market_order="1" && requestor="${golemClient.getRawClient().walletClient.account.address}"`,
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
      const parsed = VanityOrderSchema.safeParse(jsonParsed);
      if (!parsed.success) {
        console.error("Failed to validate order:", parsed.error);
        return null;
      }
      return { ...parsed.data, orderId: entityKey as string };
    })
    .filter((o): o is z.infer<typeof VanityOrderSchema> & { orderId: string } => o !== null)
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
};

export const MyOrdersPage = () => {
  const {
    data: myRequests = [],
    isLoading: isRequestsLoading,
    error: requestsError,
    refetch: refetchRequests,
    isFetching: isRequestsFetching,
  } = useQuery<{ id: string; order: VanityRequestWithTimestamp }[]>({
    queryKey: ["myRequests"],
    queryFn: fetchMyRequests,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  type VanityOrder = z.infer<typeof VanityOrderSchema> & { orderId: string };
  const {
    data: myOrders = [],
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch: refetchOrders,
    isFetching: isOrdersFetching,
  } = useQuery<VanityOrder[]>({
    queryKey: ["myOrders"],
    queryFn: fetchMyOrders,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  const { isConnected } = useAppKitAccount();
  const [now, setNow] = useState(() => Date.now());
  const [tab, setTab] = useState<"pending" | "active">(() => {
    if (typeof window === "undefined") return "pending";
    const hash = window.location.hash.replace(/^#/, "");
    if (hash === "pending" || hash === "active") return hash;
    return "pending";
  });
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const target = `#${tab}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [tab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "pending" || hash === "active") {
        setTab(hash);
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  if (!isConnected) {
    return <Alert>Please connect your wallet to view your orders.</Alert>;
  }

  const pickedRequestIds = new Set(myOrders.map((o) => o.requestId));
  const anyFetching = isRequestsFetching || isOrdersFetching;

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Activity</h1>
          <p className="text-sm text-muted-foreground">Track your open and active orders.</p>
        </div>
        <Button asChild>
          <Link to="/order/new">
            <PlusCircle className="size-4" />
            New Order
          </Link>
        </Button>
      </div>

      <OrdersExplainer />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "pending" | "active")} className="w-full">
        <div className="mb-2 flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Posted (awaiting pickup)
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{myRequests.length}</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              Picked up & history
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{myOrders.length}</span>
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              Promise.allSettled([refetchRequests(), refetchOrders()]);
            }}
            disabled={anyFetching}
            title="Refresh both lists"
          >
            {anyFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Refresh
          </Button>
        </div>
        <TabsContent value="pending" className="mt-4">
          <OpenOrdersSection
            pending={myRequests}
            isLoading={isRequestsLoading}
            error={requestsError}
            now={now}
            pickedRequestIds={pickedRequestIds}
            onShowPicked={() => setTab("active")}
          />
        </TabsContent>
        <TabsContent value="active" className="mt-4">
          <MyOrdersSection orders={myOrders} isLoading={isOrdersLoading} error={ordersError} now={now} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
