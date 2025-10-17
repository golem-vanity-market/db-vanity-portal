import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clipboard, ClipboardCheck, Download, ExternalLink, Info, RefreshCw } from "lucide-react";
import { useState } from "react";

import { VanityOrderResult, VanityOrderResultSchema, type Problem } from "./order-schema";
import { makeClient, truncateMiddle } from "./helpers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrder } from "./useOrder";
import { matchProblemToAddress } from "@/utils/difficulty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/Toast";
import { getAddress } from "viem";
import { Badge } from "@/components/ui/badge";

const fetchOrderResults = async (orderId: string) => {
  const golemClient = await makeClient();
  const rawRes = await golemClient.queryEntities(`vanity_market_order_result="2" && orderId="${orderId}"`);
  return rawRes
    .map(({ entityKey, storageValue }) => {
      let jsonParsed = null;
      try {
        jsonParsed = JSON.parse(storageValue.toString());
      } catch (e) {
        console.error("Failed to parse JSON for order:", e);
        return null;
      }
      const parsed = VanityOrderResultSchema.safeParse(jsonParsed);
      if (!parsed.success) {
        console.error("Failed to validate result:", parsed.error);
        return null;
      }
      return { id: entityKey as string, order: parsed.data };
    })
    .filter((o): o is { id: string; order: VanityOrderResult } => o !== null);
};

function OrderResultsPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: results = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orderResults", orderId],
    queryFn: () => fetchOrderResults(orderId!),
    enabled: !!orderId,
  });

  const { data: orderData } = useOrder(orderId ?? "");

  const resultsWithProblemAssigned = results.map((result) => {
    const problem = orderData ? matchProblemToAddress(result.order.proof.address, orderData.problems) : null;
    return { ...result, problem };
  });

  const problemLabel = (p: Problem["type"]) => {
    switch (p) {
      case "leading-any":
        return `Leading`;
      case "trailing-any":
        return `Trailing`;
      case "letters-heavy":
        return "Letters heavy";
      case "numbers-heavy":
        return "Numbers only";
      case "snake-score-no-case":
        return "Snake score";
      case "user-prefix":
        return `Custom prefix`;
      case "user-suffix":
        return `Custom suffix`;
      case "user-mask":
        return `Custom mask`;
    }
  };

  const problems = new Set(orderData?.problems?.map((p) => p.type) ?? []);

  const getInitialFilter = () => {
    const hash = location.hash.slice(1); // Remove '#'
    return hash || "all";
  };

  const [activeFilter, setActiveFilter] = useState<string>(getInitialFilter);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value);
    navigate(`#${value}`, { replace: true });
  };

  const filteredResults =
    activeFilter === "all"
      ? resultsWithProblemAssigned
      : resultsWithProblemAssigned.filter((r) => r.problem && r.problem.type === activeFilter);

  const problemCounts = resultsWithProblemAssigned.reduce((acc, r) => {
    if (r.problem) {
      const key = r.problem.type;
      acc.set(key, (acc.get(key) ?? 0) + 1);
    }
    return acc;
  }, new Map<Problem["type"], number>());

  const copyText = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label, variant: "success" });
    } catch (e) {
      toast({ title: "Failed to copy to clipboard", variant: "error" });
      console.error(e);
    }
  };

  const downloadText = (filename: string, content: string, mime: string = "text/plain;charset=utf-8") => {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Failed to download file", variant: "error" });
      console.error(e);
    }
  };

  const toCsv = () => {
    const header = [
      "address",
      "salt",
      "provider_id",
      "provider_name",
      "provider_wallet",
      "order_id",
      "result_entity_id",
      "pub_key",
    ];
    const escape = (val: string) => {
      const s = String(val ?? "");
      if (/[",\n]/.test(s)) return '"' + s.replaceAll('"', '""') + '"';
      return s;
    };
    const rows = results.map(({ id, order }) => [
      order.proof.address,
      order.proof.salt,
      order.provider.id,
      order.provider.name,
      order.provider.walletAddress,
      order.orderId,
      id,
      order.proof.pubKey,
    ]);
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    return csv;
  };

  // Simple deterministic color from provider id for avatar
  const colorFromId = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    const h = Math.abs(hash) % 360;
    const s = 65;
    const l = 45;
    return `hsl(${h} ${s}% ${l}%)`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
        return "secondary";
      case "queue":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "processing":
        return "Processing";
      case "queue":
        return "Queued";
      default:
        return status;
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Results</h1>
            {orderData?.status && (
              <Badge variant={getStatusVariant(orderData.status)}>{getStatusLabel(orderData.status)}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Addresses found for your order.</p>
          {orderId && (
            <div className="mt-1 text-xs text-muted-foreground">
              Order:{" "}
              <a
                href={`${import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER}/entity/${orderId}?tab=data`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline"
                title="Open order in explorer"
              >
                {truncateMiddle(orderId, 12, 10)}
              </a>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isLoading && results.length > 0 && (
            <Button
              onClick={() =>
                downloadText(`order_${orderId ?? "results"}_results.csv`, toCsv(), "text/csv;charset=utf-8")
              }
              title="Download all results as CSV"
              variant="secondary"
            >
              <Download className="mr-2 size-4" /> Download CSV
            </Button>
          )}
          {!isLoading && (
            <Button onClick={() => refetch()} title="Refresh results" variant="secondary" disabled={isLoading}>
              <RefreshCw className="mr-2 size-4" /> Refresh
            </Button>
          )}
          <Button asChild>
            <Link to="/order">
              <ArrowLeft className="mr-2 size-4" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>

      {!!error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load results</AlertTitle>
          <AlertDescription>Try again shortly.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No results yet. If a provider finds a matching address, it will appear here.
        </div>
      ) : (
        <>
          {problems.size > 0 && (
            <Tabs value={activeFilter} onValueChange={handleFilterChange} className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="all">
                  <span>All</span>
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {resultsWithProblemAssigned.length}
                  </span>
                </TabsTrigger>
                {Array.from(problems)
                  .toSorted()
                  .map((p) => (
                    <TabsTrigger key={p} value={p}>
                      <span>{problemLabel(p)}</span>
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                        {problemCounts.get(p) ?? 0}
                      </span>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Address</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.map(({ id, order }) => {
                const addr = getAddress(order.proof.address);
                return (
                  <TableRow key={id}>
                    <TableCell>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => copyText(addr, "Address copied")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            copyText(addr, "Address copied");
                          }
                        }}
                        className="group inline-flex max-w-full cursor-pointer items-center gap-2"
                        title="Click to copy address"
                      >
                        <span className="truncate font-mono text-sm">{addr}</span>
                        <Clipboard className="size-4 text-muted-foreground group-hover:text-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`${import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER}/entity/${id}?tab=data`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-sm underline"
                        title="Open result entity in explorer"
                      >
                        {truncateMiddle(id, 10, 8)} <ExternalLink className="size-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: colorFromId(order.provider.id) }}
                            aria-hidden
                          >
                            {order.provider.name?.slice(0, 1).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm">{order.provider.name}</span>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" title="Provider details">
                              <Info className="size-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96" align="start">
                            <div className="space-y-2 text-sm">
                              <div className="font-semibold">{order.provider.name}</div>
                              <div className="font-mono text-xs break-all">id: {order.provider.id}</div>
                              <div className="font-mono text-xs break-all text-muted-foreground">
                                wallet: {order.provider.walletAddress}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.proof.pubKey.startsWith("xpub") ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyText(order.proof.salt, "Derivation path copied")}
                            title="Copy derivation path"
                          >
                            <ClipboardCheck className="mr-2 size-3.5" /> Copy derivation path
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyText(order.proof.salt, "Salt copied")}
                            title="Copy salt"
                          >
                            <ClipboardCheck className="mr-2 size-3.5" /> Copy salt
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}

export default OrderResultsPage;
