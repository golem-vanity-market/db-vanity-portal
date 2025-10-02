import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ProblemList from "./ProblemList";
import type { Problem } from "./order-schema";
import { formatDateTime, formatRelative, truncateMiddle } from "./helpers";

type Order = {
  requestId: string;
  status: "queue" | "processing" | "completed";
  created: string;
  started: string | null;
  completed: string | null;
  pubKey: string;
  problems: Problem[];
};

export function MyOrdersSection({
  orders,
  isLoading,
  error,
  now,
}: {
  orders: Order[];
  isLoading: boolean;
  error: unknown;
  now: number;
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Active & Past Orders</h2>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : (
          <Badge variant="outline">{orders.length}</Badge>
        )}
      </div>
      {!!error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load orders</AlertTitle>
          <AlertDescription>Try again shortly.</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No orders yet. Once a node picks up your order, it will appear here.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="text-right">Problems</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => {
              const statusVariant =
                o.status === "completed" ? "default" : o.status === "processing" ? "secondary" : "outline";
              return (
                <TableRow key={`${o.requestId}-${o.created}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <a
                        href={`${import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER}/entity/${o.requestId}?tab=data`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs underline"
                        title="Open in explorer"
                      >
                        {truncateMiddle(o.requestId, 10, 8)}
                      </a>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        pub: {truncateMiddle(o.pubKey, 10, 8)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant}>{o.status}</Badge>
                  </TableCell>
                  <TableCell title={formatDateTime(o.created)}>{formatRelative(o.created, now)}</TableCell>
                  <TableCell title={o.started ? formatDateTime(o.started) : undefined}>
                    {o.started ? formatRelative(o.started, now) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell title={o.completed ? formatDateTime(o.completed) : undefined}>
                    {o.completed ? formatRelative(o.completed, now) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-0 underline"
                          aria-label={`View selected problems (${o.problems?.length ?? 0})`}
                        >
                          View problems ({o.problems?.length ?? 0})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96" align="end">
                        <div className="mb-2 text-sm font-semibold">Selected problems</div>
                        <ProblemList problems={o.problems ?? []} />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

export default MyOrdersSection;
