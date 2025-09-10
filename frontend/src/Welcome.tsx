import React from "react";

const Welcome = () => {
  return (
    <div className="p-6 bg-blue-50 rounded shadow text-center">
      <h1 className="text-2xl font-bold mb-2">Welcome</h1>
      <p className="text-gray-700">
        This project displays provider estimations and is currently{" "}
        <span className="font-semibold text-orange-600">experimental</span>.
      </p>
      <p className="text-gray-700 mt-2">
        Data is presented based on the best available information, <br />
        but may not always be accurate or up-to-date.
      </p>
    </div>
  );
};

export default Welcome;
