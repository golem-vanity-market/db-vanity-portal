import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

export const OrdersExplainer = () => (
  <Card className="overflow-hidden border-none bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-sm shadow-primary/10">
    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Lightbulb className="size-6" />
      </span>
      <div className="space-y-2">
        <CardTitle className="text-lg font-semibold text-primary">How orders move through the network</CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-relaxed text-primary/80">
          Orders are posted to the public order book and expire after a short time. Vanity nodes continuously scan the
          order book and try to pick up and execute orders on a best‑effort basis. Due to volume and order constraints,
          not all orders may be executed before they expire. Once an order is picked up, the node will create a new
          record in Golem DB and attach the results to it.
        </CardDescription>
      </div>
    </CardHeader>
  </Card>
);

export default OrdersExplainer;
