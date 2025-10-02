import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const OrdersExplainer = () => (
  <Alert>
    <AlertTitle>How orders work</AlertTitle>
    <AlertDescription>
      Orders are posted to the public order book and expire after a short time. Vanity nodes continuously scan the order
      book and try to pick up and execute orders on a best‑effort basis. Due to volume and order constraints, not all
      orders may be executed before they expire. Once an order is picked up, the node will create a new record in Golem
      DB and attach the results to it.
    </AlertDescription>
  </Alert>
);

export default OrdersExplainer;
