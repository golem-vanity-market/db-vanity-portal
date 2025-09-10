import React from "react";
import { backendUrl } from "./utils";

const Welcome = () => {
  const check_backend = async () => {
    try {
      const response = await fetch(`${backendUrl()}`);
      if (response.ok) {
        const data = await response.json();
        alert(`Backend is healthy: ${data.message}`);
      } else {
        alert("Backend is not reachable");
      }
    } catch (error) {
      alert("Error connecting to backend");
    }
  };
  return (
    <div className="rounded bg-blue-50 p-6 text-center shadow">
      <h1 className="mb-2 text-2xl font-bold">Welcome</h1>
      <p className="text-gray-700">
        This project displays provider estimations and is currently{" "}
        <span className="font-semibold text-orange-600">experimental</span>.
      </p>
      <p className="mt-2 text-gray-700">
        Data is presented based on the best available information, <br />
        but may not always be accurate or up-to-date.
      </p>
      <button onClick={() => check_backend()}>Check backend connection</button>
    </div>
  );
};

export default Welcome;
