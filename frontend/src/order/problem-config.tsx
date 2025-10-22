import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  CaseUpper,
  CaseLower,
  Grid3x3,
  ALargeSmall,
  Binary,
  GitCommitHorizontal,
} from "lucide-react";
import React from "react";
import { addressExamples } from "@/utils/address-examples";
import { ProblemId } from "db-vanity-model/src/order-schema.ts";

interface ProblemConfigBase {
  label: string;
  description: string;
  icon: React.ReactNode;
}

export type ProblemConfig =
  | (ProblemConfigBase & {
      id: "user-prefix";
      specifierType: "text";
      defaultValue: string;
      specifierKey: "specifier";
      getExample: (specifier: string) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "user-suffix";
      specifierType: "text";
      defaultValue: string;
      specifierKey: "specifier";
      getExample: (specifier: string) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "user-mask";
      specifierType: "text";
      defaultValue: string;
      specifierKey: "specifier";
      getExample: (specifier: string) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "leading-any";
      specifierType: "number";
      defaultValue: number;
      specifierKey: "length";
      min: number;
      max: number;
      getExample: (value: number) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "trailing-any";
      specifierType: "number";
      defaultValue: number;
      specifierKey: "length";
      min: number;
      max: number;
      getExample: (value: number) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "letters-heavy";
      specifierType: "number";
      defaultValue: number;
      specifierKey: "count";
      min: number;
      max: number;
      getExample: (value: number) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "snake-score-no-case";
      specifierType: "number";
      defaultValue: number;
      specifierKey: "count";
      min: number;
      max: number;
      getExample: (value: number) => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    })
  | (ProblemConfigBase & {
      id: "numbers-heavy";
      specifierType: null;
      defaultValue: null;
      specifierKey: null;
      getExample: () => React.ReactNode;
      getDefaultExample: () => React.ReactNode;
    });
export const problems = [
  {
    id: "user-prefix",
    label: "Custom Prefix",
    description: "Search for addresses that start with the specified prefix",
    specifierType: "text",
    defaultValue: "0xC0FFEE00",
    specifierKey: "specifier",
    icon: <CaseUpper />,
    getExample: addressExamples["user-prefix"],
    getDefaultExample: () => addressExamples["user-prefix"]("0xC0FFEE00"),
  },
  {
    id: "user-suffix",
    label: "Custom Suffix",
    description: "Search for addresses that end with the specified suffix",
    specifierType: "text",
    defaultValue: "00BADD1E",
    specifierKey: "specifier",
    icon: <CaseLower />,
    getExample: addressExamples["user-suffix"],
    getDefaultExample: () => addressExamples["user-suffix"]("00BADD1E"),
  },
  {
    id: "user-mask",
    label: "Mask",
    description:
      "Search for addresses that match the specified mask. Use X to match any character (e.g., 0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5678)",
    specifierType: "text",
    defaultValue: "0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5678",
    specifierKey: "specifier",
    icon: <Grid3x3 />,
    getExample: addressExamples["user-mask"],
    getDefaultExample: () =>
      addressExamples["user-mask"](
        "0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5678",
      ),
  },
  {
    id: "leading-any",
    label: "Leading",
    description:
      "Search for addresses that start with at least <length> of the same character (e.g., 0xaaaaaaaa...)",
    specifierType: "number",
    defaultValue: 8,
    specifierKey: "length",
    icon: <ArrowRightFromLine />,
    getExample: addressExamples["leading-any"],
    min: 8,
    max: 40,
    getDefaultExample: () => addressExamples["leading-any"](8),
  },
  {
    id: "trailing-any",
    label: "Trailing",
    description:
      "Search for addresses that end with at least <length> of the same character (e.g., 0x...aaaaaaaa)",
    specifierType: "number",
    defaultValue: 8,
    specifierKey: "length",
    icon: <ArrowLeftFromLine />,
    getExample: addressExamples["trailing-any"],
    min: 8,
    max: 40,
    getDefaultExample: () => addressExamples["trailing-any"](8),
  },
  {
    id: "letters-heavy",
    label: "Letters Heavy",
    description: "Search for addresses that contain at least <count> letters",
    specifierType: "number",
    defaultValue: 32,
    specifierKey: "count",
    icon: <ALargeSmall />,
    getExample: addressExamples["letters-heavy"],
    min: 32,
    max: 40,
    getDefaultExample: () => addressExamples["letters-heavy"](32),
  },
  {
    id: "numbers-heavy",
    label: "Numbers Only",
    description: "Search for addresses that are composed of only numbers",
    icon: <Binary />,
    specifierType: null,
    defaultValue: null,
    specifierKey: null,
    getExample: addressExamples["numbers-heavy"],
    getDefaultExample: () => addressExamples["numbers-heavy"](),
  },
  {
    id: "snake-score-no-case",
    label: "Snake",
    description:
      "Search for addresses that contain at least the given number of pairs of characters (e.g., 0x22...aa...)",
    specifierType: "number",
    defaultValue: 15,
    specifierKey: "count",
    icon: <GitCommitHorizontal />,
    getExample: addressExamples["snake-score-no-case"],
    min: 15,
    max: 39,
    getDefaultExample: () => addressExamples["snake-score-no-case"](15),
  },
] as const satisfies readonly ProblemConfig[];

export const problemsById = problems.reduce(
  (acc, problem) => {
    acc[problem.id] = problem;
    return acc;
  },
  {} as Record<ProblemId, ProblemConfig>,
);
