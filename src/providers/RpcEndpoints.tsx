import React, { createContext, useContext, ReactNode } from "react";

// 1. Define the shape of the context
interface RpcContextType {
  rpcProvider: string; // or a more specific type if you have a provider object
}

// 2. Create the context
const RpcContext = createContext<RpcContextType | undefined>(undefined);

// 3. Create the provider component
interface RpcProviderProps {
  rpcProvider: string;
  children: ReactNode;
}

export const RpcProvider: React.FC<RpcProviderProps> = ({
  rpcProvider,
  children,
}) => {
  return (
    <RpcContext.Provider value={{ rpcProvider }}>
      {children}
    </RpcContext.Provider>
  );
};

// 4. Custom hook for easy access
export const useRpcProvider = (): RpcContextType => {
  const context = useContext(RpcContext);
  if (!context) {
    throw new Error("useRpcProvider must be used within an RpcProvider");
  }
  return context;
};
