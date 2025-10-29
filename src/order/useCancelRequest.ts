import { ArkivUpdate, ExpirationTime, Hex } from "arkiv-sdk";
import { makeClient } from "./helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/Toast";

async function cancelRequest(requestId: Hex): Promise<void> {
  const client = await makeClient();
  const requestBody = await client.getStorageValue(requestId);
  const metadata = await client.getEntityMetaData(requestId);
  if (!requestBody || !metadata) {
    throw new Error("Request not found");
  }
  const bodyAsString = new TextDecoder().decode(requestBody);
  const bodyObj = JSON.parse(bodyAsString);
  bodyObj.cancelledAt = new Date().toISOString();
  const updatedBodyString = JSON.stringify(bodyObj);
  const requestBodyUpdated = new TextEncoder().encode(updatedBodyString);
  const updateBody: ArkivUpdate = {
    entityKey: requestId,
    data: requestBodyUpdated,
    expiresIn: ExpirationTime.fromDays(7),
    numericAnnotations: metadata.numericAnnotations,
    stringAnnotations: metadata.stringAnnotations,
  };
  await client.updateEntities([updateBody]);
}
export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      toast({
        title: "Order cancelled",
        description:
          "The order has been successfully cancelled. Note that it may take some time for the cancellation to be reflected on the network.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error cancelling order",
        description:
          error?.message ||
          "An unexpected error occurred while cancelling the order.",
        variant: "error",
      });
    },
    onSettled: () => {
      const KEYS_TO_INVALIDATE = [
        "myOrders",
        "order",
        "orderResults",
        "myRequests",
      ];
      KEYS_TO_INVALIDATE.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}
