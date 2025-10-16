import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppKitAccount } from "@reown/appkit/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2, PlusCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { makeClient, msToShort } from "./helpers";
import OrdersExplainer from "./OrdersExplainer";
import OpenOrdersSection from "./OpenOrdersSection";
import MyOrdersSection from "./MyOrdersSection";
import { VanityOrderSchema, VanityRequestWithTimestampSchema, type VanityRequestWithTimestamp } from "./order-schema";
import { z } from "zod";

const fetchMyRequests = async () => {
  const golemClient = await makeClient();
  const rawRes = await golemClient.queryEntities(
    `vanity_market_request="2" && $owner="${golemClient.getRawClient().walletClient.account.address}"`,
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
    `vanity_market_order="2" && requestor="${golemClient.getRawClient().walletClient.account.address}"`,
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

  const pickedRequestIds = new Set(myOrders.map((order) => order.requestId));

  const awaitingPickupCount = myRequests.filter((request) => !pickedRequestIds.has(request.id)).length;
  const activeOrdersCount = myOrders.filter((order) => order.status !== "completed").length;
  const completedOrdersCount = myOrders.filter((order) => order.status === "completed").length;
  const totalOrders = myOrders.length;
  const completionRate = totalOrders > 0 ? Math.round((completedOrdersCount / totalOrders) * 100) : 0;

  const turnaroundDurations = myOrders
    .filter((order) => order.completed)
    .map((order) => new Date(order.completed as string).getTime() - new Date(order.created).getTime())
    .filter((ms) => Number.isFinite(ms) && ms > 0);

  const averageTurnaround =
    turnaroundDurations.length > 0
      ? Math.round(turnaroundDurations.reduce((total, ms) => total + ms, 0) / turnaroundDurations.length)
      : null;

  const pickupDurations = myOrders
    .filter((order) => order.started)
    .map((order) => new Date(order.started as string).getTime() - new Date(order.created).getTime())
    .filter((ms) => Number.isFinite(ms) && ms > 0);

  const averagePickup =
    pickupDurations.length > 0
      ? Math.round(pickupDurations.reduce((total, ms) => total + ms, 0) / pickupDurations.length)
      : null;

  const stats = {
    awaitingPickup: awaitingPickupCount,
    activeOrders: activeOrdersCount,
    completedOrders: completedOrdersCount,
    totalOrders,
    completionRate,
    averageTurnaround,
    averagePickup,
  };

  const anyFetching = isRequestsFetching || isOrdersFetching;
  const completionRateLabel = stats.totalOrders ? `${stats.completionRate}%` : "—";
  const averageTurnaroundLabel = stats.averageTurnaround ? msToShort(stats.averageTurnaround) : "—";
  const averagePickupLabel = stats.averagePickup ? msToShort(stats.averagePickup) : "—";

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border/70 bg-card/95 p-8 shadow-lg shadow-primary/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Orders overview
            </span>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">My Activity</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Track everything you have posted to the vanity marketplace and monitor progress in real time.
              </p>
            </div>
          </div>
          <div className="flex w-full justify-start sm:w-auto sm:justify-end">
            <Button asChild size="lg" className="h-11 rounded-xl px-6">
              <Link to="/order/new" title="Create a new order">
                <PlusCircle className="size-4" />
                New Order
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-none bg-background/90 shadow-sm shadow-primary/10">
          <CardHeader className="p-5 pb-3">
            <CardDescription className="text-xs font-semibold text-muted-foreground/80">
              Awaiting pickup
            </CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.awaitingPickup}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-sm text-muted-foreground">
            Orders still visible in the public queue.
          </CardContent>
        </Card>
        <Card className="border-none bg-background/90 shadow-sm shadow-primary/10">
          <CardHeader className="p-5 pb-3">
            <CardDescription className="text-xs font-semibold text-muted-foreground/80">
              Active pipeline
            </CardDescription>
            <CardTitle className="text-3xl font-semibold">{stats.activeOrders}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-sm text-muted-foreground">
            {stats.completedOrders} completed out of {stats.totalOrders} posted.
          </CardContent>
        </Card>
        <Card className="border-none bg-primary/5 shadow-sm shadow-primary/20">
          <CardHeader className="p-5 pb-3">
            <CardDescription className="text-xs font-semibold text-primary/80">Completion rate</CardDescription>
            <CardTitle className="text-3xl font-semibold text-primary">{completionRateLabel}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-sm text-primary/90">
            Completed {stats.completedOrders} orders so far.
          </CardContent>
        </Card>
        <Card className="border-none bg-background/90 shadow-sm shadow-primary/10">
          <CardHeader className="p-5 pb-4">
            <CardDescription className="text-xs font-semibold text-muted-foreground/80">
              Average Processing speed
            </CardDescription>
            <CardTitle className="text-3xl font-semibold">{averageTurnaroundLabel}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground/80">Avg pickup</dt>
                <dd className="mt-1 text-base font-semibold text-foreground">{averagePickupLabel}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <OrdersExplainer />

      <Tabs value={tab} onValueChange={(value) => setTab(value as "pending" | "active")} className="w-full">
        <div className="rounded-3xl border border-border/70 shadow-lg shadow-primary/10">
          <div className="flex flex-col gap-4 border-b border-border/70 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="h-auto gap-2 rounded-full bg-background/80 p-1">
              <TabsTrigger
                value="pending"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow"
              >
                Posted (awaiting pickup)
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{myRequests.length}</span>
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow"
              >
                Picked up &amp; history
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{myOrders.length}</span>
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-3">
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
          </div>
          <div className="space-y-6 p-4 sm:p-6">
            <TabsContent value="pending" className="mt-0">
              <OpenOrdersSection
                pending={myRequests}
                isLoading={isRequestsLoading}
                error={requestsError}
                now={now}
                pickedRequestIds={pickedRequestIds}
                onShowPicked={() => setTab("active")}
              />
            </TabsContent>
            <TabsContent value="active" className="mt-0">
              <MyOrdersSection orders={myOrders} isLoading={isOrdersLoading} error={ordersError} now={now} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
