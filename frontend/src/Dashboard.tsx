import React, { useMemo, useCallback, useEffect } from "react";
import { Routes, Route, Link, Outlet } from "react-router-dom";
import { createROClient } from "golem-base-sdk";
import Welcome from "./Welcome";
import ProvidersPage from "./providers/ProvidersPage";
import { ModeToggle } from "./components/theme-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./components/ui/navigation-menu";
import { Separator } from "./components/ui/separator";
import { Badge } from "./components/ui/badge";
import { Skeleton } from "./components/ui/skeleton";
import { Footer } from "./Footer";

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
    try {
      const blockNumber = await client.getRawClient().httpClient.getBlockNumber();
      setCurrentBlock(blockNumber);
    } catch (error) {
      console.error("Failed to fetch block number:", error);
    }
  }, [client]);

  useEffect(() => {
    update_current_block();
    const interval = setInterval(update_current_block, 15000);
    return () => clearInterval(interval);
  }, [update_current_block]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between">
          <a href="/" className="flex items-center space-x-3">
            <span className="font-bold">Vanity-Market Stats</span>
          </a>

          <div className="flex items-center space-x-4">
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

            <Separator orientation="vertical" className="hidden sm:block h-6" />

            <div className="hidden sm:flex items-center space-x-4">
              {current_block !== null ? (
                <Badge variant="outline">Block: {current_block.toString()}</Badge>
              ) : (
                <Skeleton className="h-8 w-24" />
              )}
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/providers" element={<ProvidersPage />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
