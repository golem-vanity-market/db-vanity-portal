import { Routes, Route, Link } from "react-router-dom";
import Welcome from "./Welcome";
import Providers from "./Providers";
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

const Dashboard = () => {
  return (
    <div className="min-h-screen">
      <div className="">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between p-4">
          {/* Logo + Title */}
          <a href={assetsUrl()} className="flex items-center space-x-3 rtl:space-x-reverse">
            <img width={32} height={32} src={`${assetsUrl()}/assets/golem.svg`} className="size-8" alt="GLM" />
            <span className="hidden self-center whitespace-nowrap text-2xl font-semibold md:inline dark:text-white">
              Golem Network - Providers
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
            <Route path="/providers" element={<Providers />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
