import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { useWalletInfo } from "@reown/appkit/react";

export const ConnectButton = () => {
  const { address, isConnected, status } = useAppKitAccount();
  const { open } = useAppKit();
  const { walletInfo } = useWalletInfo();
  if (isConnected && address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <Button variant="outline" onClick={() => open()} className="font-heading">
        {walletInfo?.icon && (
          <img
            src={walletInfo.icon}
            alt={walletInfo.name}
            className="inline size-5"
          />
        )}
        {shortAddress}
      </Button>
    );
  }
  if (status === "connecting" || status === "reconnecting") {
    return (
      <Button variant="default" disabled className="font-heading">
        Connecting...
      </Button>
    );
  }
  return (
    <Button variant="default" onClick={() => open()} className="font-heading">
      Connect Wallet
    </Button>
  );
};
