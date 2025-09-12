import React from "react";
import { FilterCriteria } from "./Providers";

interface Props {
  label: string;
  minKey: string;
  maxKey: string;
  filterCriteria: FilterCriteria;
  setFilterCriteria: (arg0: FilterCriteria) => void;
  step?: number;
  unit?: string;
  inputClassName?: string;
}

function getKeyValue(filterCriteria: FilterCriteria, key: string): string {
  // @ts-expect-error type safe checking included
  const raw = filterCriteria[key];
  return typeof raw === "number" || typeof raw === "string" ? String(raw) : "";
}

export default function RangeFilterRow({
  label,
  minKey,
  maxKey,
  filterCriteria,
  setFilterCriteria,
  unit = "",
  step = 0.1,
  inputClassName = "w-24 rounded border border-gray-300 px-2 py-1",
}: Props) {
  if (Object.keys(filterCriteria).indexOf(minKey) === -1 || Object.keys(filterCriteria).indexOf(maxKey) === -1) {
    throw new Error(`FilterCriteria does not have keys ${minKey} or ${maxKey}`);
  }
  const handleChange = (key: string, value: string) => {
    setFilterCriteria({
      ...filterCriteria,
      [key]: value ? parseFloat(value) : null,
    });
  };

  const unitStr = unit ? ` [${unit}]` : "";
  return (
    <tr className="border-b">
      <td className="p-2">
        {label}
        {unitStr}
      </td>
      <td className="p-2">
        <input
          type="number"
          step={step}
          value={getKeyValue(filterCriteria, minKey)}
          onChange={(e) => handleChange(minKey, e.target.value)}
          className={inputClassName}
          placeholder={unit}
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          step={step}
          value={getKeyValue(filterCriteria, maxKey)}
          onChange={(e) => handleChange(maxKey, e.target.value)}
          className={inputClassName}
          placeholder={unit}
        />
      </td>
    </tr>
  );
}
