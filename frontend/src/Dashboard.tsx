import React from "react";

import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Welcome from "./Welcome";
import Providers from "./Providers";
import { assetsUrl } from "./utils";

function navClassName(selected: boolean): string {
  if (selected) {
    return "block rounded-sm bg-blue-700 px-3 py-2 text-white md:bg-transparent md:p-0 md:text-blue-700 dark:text-white md:dark:text-blue-500";
  }
  return "block rounded-sm px-3 py-2 text-gray-900 hover:bg-gray-100 md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-blue-700 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent md:dark:hover:text-blue-500";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="border-b border-gray-200 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between p-4">
          {/* Logo + Title */}
          <a
            href={assetsUrl()}
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <img
              width={32}
              height={32}
              src={`${assetsUrl()}/assets/golem.svg`}
              className="size-8"
              alt="GLM"
            />
            <span className="hidden self-center whitespace-nowrap text-2xl font-semibold md:inline dark:text-white">
              Golem Network - Providers
            </span>
          </a>

          {/* Navigation */}
          <div id="navbar-default">
            <ul className="flex space-x-8 font-medium">
              <li>
                <button
                  onClick={() => navigate("/")}
                  className={navClassName(location.pathname === "/")}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/providers")}
                  className={navClassName(location.pathname === "/providers")}
                >
                  Providers
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/about")}
                  className={navClassName(location.pathname === "/about")}
                >
                  About
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="border-gray-200 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
          <Routes>
            <Route path="/" element={<Welcome />} />
          </Routes>
          <Routes>
            <Route path="/providers" element={<Providers />} />
          </Routes>
          <Routes>
            <Route path="/about" element={<div>About</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
