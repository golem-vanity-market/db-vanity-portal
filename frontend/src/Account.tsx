import { Annotation, createClient, Tagged } from "golem-base-sdk";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  CaseUpper,
  CaseLower,
  Grid3x3,
  ALargeSmall,
  Binary,
  GitCommitHorizontal,
  CheckCircle2,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { addressExamples } from "@/utils/address-examples";
import { Slider } from "@/components/ui/slider";

const ProblemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("leading-any"),
    length: z.number().min(8).max(40),
  }),
  z.object({
    type: z.literal("trailing-any"),
    length: z.number().min(8).max(40),
  }),
  z.object({
    type: z.literal("letters-heavy"),
    count: z.number().min(32).max(40),
  }),
  z.object({
    type: z.literal("numbers-heavy"),
  }),
  z.object({
    type: z.literal("snake-score-no-case"),
    count: z.number().min(15).max(39),
  }),
  z.object({
    type: z.literal("user-prefix"),
    specifier: z
      .string()
      .min(8)
      .max(42)
      .startsWith("0x")
      .regex(/^0x[0-9a-f]+$/i),
  }),
  z.object({
    type: z.literal("user-suffix"),
    specifier: z
      .string()
      .min(6)
      .max(40)
      .regex(/^[0-9a-f]+$/i),
  }),
  z.object({
    type: z.literal("user-mask"),
    specifier: z.string().length(42).startsWith("0x"),
  }),
]);
type ProblemData = z.infer<typeof ProblemSchema>;
type ProblemId = ProblemData["type"];

interface ProblemConfigBase {
  label: string;
  description: string;
  icon: React.ReactNode;
}

type ProblemConfig =
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
const problems = [
  {
    id: "user-prefix",
    label: "Prefix",
    description: "Search for addresses that start with the specified prefix",
    specifierType: "text",
    defaultValue: "0xC0FFEE",
    specifierKey: "specifier",
    icon: <CaseUpper />,
    getExample: addressExamples["user-prefix"],
    getDefaultExample: () => addressExamples["user-prefix"]("0xC0FFEE"),
  },
  {
    id: "user-suffix",
    label: "Suffix",
    description: "Search for addresses that end with the specified suffix",
    specifierType: "text",
    defaultValue: "BADD1E",
    specifierKey: "specifier",
    icon: <CaseLower />,
    getExample: addressExamples["user-suffix"],
    getDefaultExample: () => addressExamples["user-suffix"]("BADD1E"),
  },
  {
    id: "user-mask",
    label: "Mask",
    description:
      "Search for addresses that match the specified mask. Use X to match any character (e.g., 0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5678)",
    specifierType: "text",
    defaultValue: "0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxx5678",
    specifierKey: "specifier",
    icon: <Grid3x3 />,
    getExample: addressExamples["user-mask"],
    getDefaultExample: () => addressExamples["user-mask"]("0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5678"),
  },
  {
    id: "leading-any",
    label: "Leading",
    description: "Search for addresses that start with at least <length> of the same character (e.g., 0xaaaaaaaa...)",
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
    description: "Search for addresses that end with at least <length> of the same character (e.g., 0x...aaaaaaaa)",
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

const formSchema = z.object({
  publicKey: z.string().startsWith("0x").length(132),
  problems: z.array(ProblemSchema).refine((value) => value.length > 0, {
    message: "You have to select at least one item.",
  }),
});

const getEthereumGlobal = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
};

async function sendOrder(data: z.infer<typeof formSchema>) {
  const golemClient = await createClient(
    parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
    new Tagged("ethereumprovider", getEthereumGlobal()),
    import.meta.env.VITE_GOLEM_DB_RPC,
    import.meta.env.VITE_GOLEM_DB_RPC_WS,
  );

  const timestamp = new Date().toISOString();
  const utf8Encode = new TextEncoder();

  const res = await golemClient.createEntities([
    {
      data: utf8Encode.encode(
        JSON.stringify({
          problems: data.problems,
          publicKey: data.publicKey,
          timestamp,
        }),
      ),
      btl: 1800 * 24 * 7,
      stringAnnotations: [new Annotation("vanity_market_request", "1"), new Annotation("timestamp", timestamp)],
      numericAnnotations: [],
    },
  ]);
  console.log("Create entity result:", res);
  return res;
}

export const AccountPage = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: {
      publicKey:
        "0x04d4a96d675423cc05f60409c48b084a53d3fa0ac59957939f526505c43f975b77fabab74decd66d80396308db9cb4db13b0c273811d51a1773d6d9e2dbcac1d28",
      problems: [],
    },
  });

  const mutation = useMutation({
    mutationFn: sendOrder,
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }

  const selectedProblems = form.watch("problems");
  const [examples, setExamples] = useState<Record<string, React.ReactNode>>(() => {
    const initialExamples: Record<string, React.ReactNode> = {};
    for (const problem of problems) {
      initialExamples[problem.id] = problem.getDefaultExample();
    }
    return initialExamples;
  });

  const updateExample = (problemId: ProblemId, specifierValue: string | number) => {
    const problem = problemsById[problemId];
    switch (problem.specifierType) {
      case "text":
        if (typeof specifierValue === "string") {
          setExamples((prev) => ({
            ...prev,
            [problemId]: problem.getExample(specifierValue),
          }));
        }
        break;

      case "number":
        if (typeof specifierValue === "number") {
          setExamples((prev) => ({
            ...prev,
            [problemId]: problem.getExample(specifierValue),
          }));
        }
        break;
    }
  };
  const toggleProblem = (problemId: ProblemId) => {
    const currentProblems = form.getValues("problems") || [];
    const selectedProblem = currentProblems.find((p) => p.type === problemId);

    if (selectedProblem) {
      const newProblems = currentProblems.filter((p) => p.type !== problemId);
      form.setValue("problems", newProblems);

      // Reset example to default when problem is deselected, but only if the problem's specifier is not the default
      const problem = problemsById[problemId];
      if (
        problem.specifierKey &&
        problem.defaultValue &&
        problem.specifierKey in selectedProblem &&
        (selectedProblem as ProblemData & { [key in typeof problem.specifierKey]: unknown })[problem.specifierKey] !==
          problem.defaultValue
      ) {
        setExamples((prev) => ({
          ...prev,
          [problemId]: problem.getDefaultExample(),
        }));
      }
    } else {
      const problem = problemsById[problemId];
      let newProblemForForm: ProblemData;
      switch (problem.id) {
        case "user-prefix":
        case "user-suffix":
        case "user-mask":
          newProblemForForm = { type: problem.id, specifier: problem.defaultValue };
          break;
        case "leading-any":
        case "trailing-any":
          newProblemForForm = { type: problem.id, length: problem.min };
          break;
        case "letters-heavy":
        case "snake-score-no-case":
          newProblemForForm = { type: problem.id, count: problem.min };
          break;
        case "numbers-heavy":
          newProblemForForm = { type: problem.id };
          break;
      }

      const newProblems = [...currentProblems, newProblemForForm];
      form.setValue("problems", newProblems);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Public Key</FormLabel>
                  <FormControl>
                    <Input placeholder="0x..." {...field} />
                  </FormControl>
                  <FormDescription>The public key of the wallet to receive the vanity address.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="problems"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Problems</FormLabel>
                    <FormDescription>Select the problems you want to order for solving.</FormDescription>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {problems.map((item) => {
                      const isSelected = selectedProblems.some((p) => p.type === item.id);
                      const problemIndex = selectedProblems.findIndex((p) => p.type === item.id);

                      return (
                        <Card
                          key={item.id}
                          className={cn(
                            "cursor-pointer border-2 group",
                            isSelected
                              ? "border-primary bg-primary/5 shadow-lg"
                              : "border-transparent hover:border-primary/60 hover:shadow-lg bg-muted/30 text-muted-foreground",
                          )}
                          onClick={() => toggleProblem(item.id)}
                        >
                          <CardHeader>
                            <CardTitle
                              className={cn("flex items-center justify-between", !isSelected && "text-foreground")}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-2 transition-colors",
                                  !isSelected ? "text-muted-foreground group-hover:text-foreground" : "",
                                )}
                              >
                                {item.icon}
                                {item.label}
                              </div>
                              {isSelected && <CheckCircle2 className={cn("text-primary")} />}
                            </CardTitle>
                            <CardDescription
                              className={cn(
                                isSelected ? "text-foreground/80" : "text-foreground/60 group-hover:text-foreground/80",
                              )}
                            >
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {item.specifierKey && (
                              <FormField
                                control={form.control}
                                name={`problems.${problemIndex}.${item.specifierKey}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      {item.specifierType === "number" ? (
                                        <div className="flex items-center gap-4">
                                          <Slider
                                            value={[field.value ? Number(field.value) : item.min]}
                                            onValueChange={(value) => {
                                              if (value[0] === field.value) return;
                                              field.onChange(value[0]);
                                              updateExample(item.id, value[0]);
                                            }}
                                            min={item.min}
                                            max={item.max}
                                            step={1}
                                            onPointerDown={() => !isSelected && toggleProblem(item.id)}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <div className="w-8 text-center font-bold text-primary">
                                            {field.value || item.min}
                                          </div>
                                        </div>
                                      ) : (
                                        <Input
                                          placeholder={item.defaultValue}
                                          type={item.specifierType}
                                          value={field.value || item.defaultValue}
                                          onFocus={() => !isSelected && toggleProblem(item.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => {
                                            let value = e.target.value;
                                            if (item.id === "user-mask") {
                                              value = "0x" + value.replace(/^0x/i, "").replace(/[^0-9a-fA-FXx]/gi, "");
                                            } else if (item.id === "user-prefix") {
                                              value = "0x" + value.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/gi, "");
                                            } else {
                                              value = value.replace(/[^0-9a-fA-F]/gi, "");
                                            }
                                            if (value === field.value) return;
                                            field.onChange(value);
                                            updateExample(item.id, value);
                                          }}
                                        />
                                      )}
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            {examples[item.id] && (
                              <div>
                                <label className={cn("text-sm font-medium", !isSelected && "text-foreground/60")}>
                                  Example
                                </label>
                                <div className="mt-2 rounded-md bg-background/50 p-3 font-mono text-sm break-all">
                                  {examples[item.id]}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending Order..." : "Send Order"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
