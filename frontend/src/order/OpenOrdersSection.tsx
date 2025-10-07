import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ProblemList from "./ProblemList";
import { REQUEST_TTL_MS, formatDateTime, formatRelative, msToShort, truncateMiddle } from "./helpers";
import type { Problem } from "./order-schema";

type PendingItem = {
  id: string;
  order: { timestamp: string; publicKey: string; problems: Problem[] };
};

export function OpenOrdersSection({
  pending,
  isLoading,
  error,
  now,
  pickedRequestIds,
  onShowPicked,
}: {
  pending: PendingItem[];
  isLoading: boolean;
  error: unknown;
  now: number;
  pickedRequestIds: Set<string>;
  onShowPicked?: () => void;
}) {
  return (
    <section className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Posted (awaiting pickup)</h2>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : (
          <Badge variant="outline">{pending.length}</Badge>
        )}
      </div>
      {!!error && (
        <Alert variant="destructive">
          <AlertTitle>Failed to load open orders</AlertTitle>
          <AlertDescription>Try again shortly.</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : pending.length === 0 ? (
        <div className="text-sm text-muted-foreground">No open orders. Create a new one to get started.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%]">Order</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Time left</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead className="text-right">Problems</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map(({ id, order }) => {
              const createdAt = new Date(order.timestamp).getTime();
              const expiresAt = createdAt + REQUEST_TTL_MS;
              const remaining = Math.max(0, expiresAt - now);
              const isPicked = pickedRequestIds.has(id);
              return (
                <TableRow key={id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <a
                        href={`${import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER}/entity/${id}?tab=data`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs underline"
                        title="Open in explorer"
                      >
                        {truncateMiddle(id, 10, 8)}
                      </a>
                      <span className="font-mono text-[10px] break-all text-muted-foreground">
                        pub: {truncateMiddle(order.publicKey, 10, 8)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span title={formatDateTime(order.timestamp)}>{formatRelative(order.timestamp, now)}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(order.timestamp)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={"secondary"}>{`in ${msToShort(remaining)}`}</Badge>
                  </TableCell>
                  <TableCell>
                    {isPicked ? (
                      <Button
                        bounce="none"
                        variant="link"
                        type="button"
                        onClick={onShowPicked}
                        className="px-0 text-xs"
                        title="View picked-up details"
                      >
                        Picked up →
                      </Button>
                    ) : (
                      <Badge variant="outline">Awaiting</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto px-0 underline"
                          aria-label={`View selected problems (${order.problems.length})`}
                        >
                          View problems ({order.problems.length})
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96" align="end">
                        <div className="mb-2 text-sm font-semibold">Selected problems</div>
                        <ProblemList problems={order.problems} />
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

export default OpenOrdersSection;
