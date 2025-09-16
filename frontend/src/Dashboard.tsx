import { Routes, Route, Link } from "react-router-dom";
import Welcome from "./Welcome";
import { assetsUrl } from "./utils";
import { ModeToggle } from "./components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./components/ui/navigation-menu";
import { Separator } from "./components/ui/separator";
import { createROClient } from "golem-base-sdk";
import React, { useMemo, useCallback, useEffect } from "react";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";
import ProvidersPage from "./providers/ProvidersPage";

const Dashboard = () => {
  const [current_block, setCurrentBlock] = React.useState<bigint | null>(null);
  const client = useMemo(
    () =>
      createROClient(
        parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID || ""),
        import.meta.env.VITE_GOLEM_DB_RPC || "",
        import.meta.env.VITE_GOLEM_DB_RPC_WS || "",
      ),
    [],
  );
  const update_current_block = useCallback(async () => {
    const blockNumber = await client.getRawClient().httpClient.getBlockNumber();
    console.log("Current block number:", blockNumber);
    setCurrentBlock(blockNumber);
  }, [client]);

  useEffect(() => {
    update_current_block();
    const interval = setInterval(() => {
      update_current_block();
    }, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, [client, update_current_block]);

  return (
    <div className="min-h-screen">
      <div className="">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between p-4">
          {/* Logo + Title */}
          <a href={assetsUrl()} className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="hidden self-center whitespace-nowrap text-2xl font-semibold md:inline dark:text-white">
              Vanity-Market stats
            </span>
          </a>
          <div className="ml-auto flex space-x-2 items-stretch">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to="/providers">Providers</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <Separator orientation="vertical" className="h-9" />
            {/* Current Block Number */}
            {current_block !== null ? (
              <Badge variant="outline" className="h-9">
                Golem Base Block: {current_block.toString()}
              </Badge>
            ) : (
              <Skeleton className="h-9 w-24" />
            )}
            <Separator orientation="vertical" className="h-9" />
            {/* Dark mode toggle */}
            <ModeToggle />
          </div>
        </div>
      </div>

      <div className="border-gray-200">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
          <Routes>
            <Route path="/" element={<Welcome />} />
          </Routes>
          <Routes>
            <Route path="/providers" element={<ProvidersPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
