import React from "react";

const Welcome = () => {
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
    </div>
  );
};

export default Welcome;
