import { useAccount } from "wagmi";

export const AccountPage = () => {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div>
      <h2>Account Information</h2>
      <p>Address: {address}</p>
    </div>
  );
};
