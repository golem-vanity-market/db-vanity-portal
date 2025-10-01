import { Annotation, createClient, Tagged } from "golem-base-sdk";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { calculateWorkUnitForProblems } from "@/utils/difficulty";
import { displayDifficulty } from "@/utils";
import { Alert } from "@/components/ui/alert";
import { useAppKitAccount } from "@reown/appkit/react";
import { VanityRequestSchema, Problem, ProblemId } from "./order-schema";
import { problems, problemsById } from "./problem-config";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const FormSchema = z.object({
  publicKey: z.string().startsWith("0x").length(132),
  problems: z
    .object({
      "leading-any": z
        .object({
          enabled: z.boolean(),
          length: z.number(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (data.length < 8 || data.length > 40) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Length must be between 8 and 40",
                path: ["length"],
              });
            }
          }
        }),
      "trailing-any": z
        .object({
          enabled: z.boolean(),
          length: z.number(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (data.length < 8 || data.length > 40) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Length must be between 8 and 40",
                path: ["length"],
              });
            }
          }
        }),
      "letters-heavy": z
        .object({
          enabled: z.boolean(),
          count: z.number(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (data.count < 32 || data.count > 40) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Count must be between 32 and 40",
                path: ["count"],
              });
            }
          }
        }),
      "numbers-heavy": z.object({
        enabled: z.boolean(),
      }),
      "snake-score-no-case": z
        .object({
          enabled: z.boolean(),
          count: z.number(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (data.count < 15 || data.count > 39) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Count must be between 15 and 39",
                path: ["count"],
              });
            }
          }
        }),
      "user-prefix": z
        .object({
          enabled: z.boolean(),
          specifier: z.string(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (!data.specifier.startsWith("0x")) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must start with 0x",
                path: ["specifier"],
              });
            }
            if (data.specifier.length < 8 || data.specifier.length > 42) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must be between 8 and 42 characters",
                path: ["specifier"],
              });
            }
            if (!/^0x[0-9a-f]+$/i.test(data.specifier)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must be a valid hex string",
                path: ["specifier"],
              });
            }
          }
        }),
      "user-suffix": z
        .object({
          enabled: z.boolean(),
          specifier: z.string(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (data.specifier.length < 6 || data.specifier.length > 40) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must be between 6 and 40 characters",
                path: ["specifier"],
              });
            }
            if (!/^[0-9a-f]+$/i.test(data.specifier)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must be a valid hex string",
                path: ["specifier"],
              });
            }
          }
        }),
      "user-mask": z
        .object({
          enabled: z.boolean(),
          specifier: z.string(),
        })
        .superRefine((data, ctx) => {
          if (data.enabled) {
            if (!data.specifier.startsWith("0x")) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must start with 0x",
                path: ["specifier"],
              });
            }
            if (data.specifier.length !== 42) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Specifier must be 42 characters long",
                path: ["specifier"],
              });
            }
          }
        }),
    })
    .refine((data) => Object.values(data).some((problem) => problem.enabled), {
      message: "Select at least one problem",
      path: ["problems"],
    }),
});

const getEthereumGlobal = () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
};

async function sendOrder(data: z.infer<typeof FormSchema>) {
  const golemClient = await createClient(
    parseInt(import.meta.env.VITE_GOLEM_DB_CHAIN_ID),
    new Tagged("ethereumprovider", getEthereumGlobal()),
    import.meta.env.VITE_GOLEM_DB_RPC,
    import.meta.env.VITE_GOLEM_DB_RPC_WS,
  );

  const timestamp = new Date().toISOString();
  const utf8Encode = new TextEncoder();

  const selectedProblems = Object.entries(data.problems)
    .filter(([_, value]) => value.enabled)
    .map(([key, value]) => ({
      type: key,
      ...value,
    }));
  const parsedEntity = VanityRequestSchema.parse({
    publicKey: data.publicKey,
    problems: selectedProblems,
  });

  const res = await golemClient.createEntities([
    {
      data: utf8Encode.encode(
        JSON.stringify({
          ...parsedEntity,
          timestamp,
        }),
      ),
      btl: 1800 * 24 * 7,
      stringAnnotations: [new Annotation("vanity_market_request", "1"), new Annotation("timestamp", timestamp)],
      numericAnnotations: [],
    },
  ]);
  return res;
}

export const NewOrderPage = () => {
  const { isConnected } = useAppKitAccount();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    defaultValues: {
      publicKey:
        "0x04d4a96d675423cc05f60409c48b084a53d3fa0ac59957939f526505c43f975b77fabab74decd66d80396308db9cb4db13b0c273811d51a1773d6d9e2dbcac1d28",
      problems: {
        "leading-any": { enabled: false, length: 8 },
        "trailing-any": { enabled: false, length: 8 },
        "letters-heavy": { enabled: false, count: 32 },
        "numbers-heavy": { enabled: false },
        "snake-score-no-case": { enabled: false, count: 15 },
        "user-prefix": { enabled: false, specifier: "0xC0FFEE" },
        "user-suffix": { enabled: false, specifier: "BADD1E" },
        "user-mask": { enabled: false, specifier: "0x1234xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx5678" },
      },
    },
  });

  const mutation = useMutation({
    mutationFn: sendOrder,
    onSuccess: (data) => {
      form.reset();
      toast.success("Order sent successfully!", {
        action: {
          label: "View in block explorer",
          onClick: () => {
            window.open(
              `${import.meta.env.VITE_GOLEM_DB_BLOCK_EXPLORER}/entity/${data[0].entityKey}?tab=data`,
              "_blank",
            );
          },
        },
      });
    },
    onError: (error) => {
      console.error("Error sending order:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error sending order, check the console for more details`, {
        description: message.substring(0, 100) + (message.length > 100 ? "..." : ""),
      });
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    mutation.mutate(data);
  }

  const selectedProblems = Object.entries(form.watch("problems"))
    .filter(([, problem]) => problem.enabled)
    .map(
      ([key, value]) =>
        ({
          type: key,
          ...value,
        }) as Problem,
    );

  const [examples, setExamples] = useState<Record<string, React.ReactNode>>(() => {
    const initialExamples: Record<string, React.ReactNode> = {};
    for (const problem of problems) {
      initialExamples[problem.id] = problem.getDefaultExample();
    }
    return initialExamples;
  });

  const updateExample = (problemId: ProblemId, specifierValue: string | number) => {
    const problem = problemsById[problemId];
    if (problem.specifierType === "text" && typeof specifierValue === "string") {
      setExamples((prev) => ({ ...prev, [problemId]: problem.getExample(specifierValue) }));
    } else if (problem.specifierType === "number" && typeof specifierValue === "number") {
      setExamples((prev) => ({ ...prev, [problemId]: problem.getExample(specifierValue) }));
    }
  };

  const enableProblem = (problemId: ProblemId) => {
    form.setValue(`problems.${problemId}.enabled`, true, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const toggleProblem = (problemId: ProblemId) => {
    const fieldValue = form.getValues(`problems.${problemId}`);
    form.setValue(
      `problems.${problemId}`,
      { ...fieldValue, enabled: !fieldValue.enabled },
      {
        shouldValidate: true,
        shouldDirty: true,
      },
    );
  };

  const totalDifficulty = calculateWorkUnitForProblems(selectedProblems);

  // prettier-ignore
  const hashesIn30Min = 20 // 20 providers
    * 5 * 1e6 // 5 MH/s
    * 30 * 60 // 30 minutes

  const expectedMatches = Math.round(
    selectedProblems.length > 0 && totalDifficulty > 0 ? hashesIn30Min / totalDifficulty : 0,
  );

  const formFields = problems.reduce(
    (acc, problemConfig) => {
      acc[problemConfig.id] = (() => {
        switch (problemConfig.id) {
          case "leading-any":
          case "trailing-any":
            return (
              <FormField
                key={problemConfig.id}
                control={form.control}
                name={`problems.${problemConfig.id}.length`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Slider
                          min={problemConfig.min}
                          max={problemConfig.max}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => {
                            field.onChange(value[0]);
                            updateExample(problemConfig.id, value[0]);
                          }}
                          onPointerDown={() => {
                            enableProblem(problemConfig.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="w-8 text-center font-bold text-primary">{field.value}</div>
                      </div>
                    </FormControl>
                    <FormDescription>{problemConfig.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          case "letters-heavy":
          case "snake-score-no-case":
            return (
              <FormField
                key={problemConfig.id}
                control={form.control}
                name={`problems.${problemConfig.id}.count`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Count</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => {
                            field.onChange(value[0]);
                            updateExample(problemConfig.id, value[0]);
                          }}
                          onPointerDown={() => {
                            enableProblem(problemConfig.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          min={problemConfig.min}
                          max={problemConfig.max}
                          step={1}
                        />
                        <div className="w-8 text-center font-bold text-primary">{field.value}</div>
                      </div>
                    </FormControl>
                    <FormDescription>{problemConfig.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          case "user-prefix":
          case "user-suffix":
          case "user-mask":
            return (
              <FormField
                key={problemConfig.id}
                control={form.control}
                name={`problems.${problemConfig.id}.specifier`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specifier</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value}
                        className="font-mono"
                        placeholder={problemConfig.defaultValue}
                        type="text"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={() => {
                          enableProblem(problemConfig.id);
                        }}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (problemConfig.id === "user-mask") {
                            if (value.length < 2) {
                              value = "0x";
                            } else {
                              value = "0x" + value.replace(/^0x/i, "").replace(/[^0-9a-fA-FXx]/gi, "");
                            }
                          } else if (problemConfig.id === "user-prefix") {
                            if (value.length < 2) {
                              value = "0x";
                            } else {
                              value = "0x" + value.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/gi, "");
                            }
                          } else {
                            value = value.replace(/[^0-9a-fA-F]/gi, "");
                          }
                          value = value.slice(
                            0,
                            problemConfig.id === "user-mask" ? 42 : problemConfig.id === "user-prefix" ? 42 : 40,
                          );
                          if (field.value === value) return;
                          field.onChange(value);
                          updateExample(problemConfig.id, value);
                        }}
                      />
                    </FormControl>
                    <FormDescription>{problemConfig.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          default:
            return null;
        }
      })();
      return acc;
    },
    {} as Record<ProblemId, React.ReactNode>,
  );

  return (
    <div className="container flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Order</h1>
        <Button asChild>
          <Link to="/order">
            <ArrowLeft className="size-4" />
            Back to orders list
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <Alert variant="default" className="mb-2">
            <strong>Disclaimer:</strong> This is an alpha implementation of the orderbook system. Please use{" "}
            <span className="font-bold text-orange-600">testnet tokens only</span>. Orders will be handled by our nodes
            in a best-effort manner. There is no guarantee that your order will be fulfilled. Never share your private
            key. The public key you provide should correspond to a private key that you control, but the private key
            itself is never shared or transmitted.
          </Alert>
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
                    <FormDescription>
                      The public key that the providers will use to search for vanity addresses. Make sure you control
                      the corresponding private key.
                    </FormDescription>
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
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {problems.map((item) => {
                        const isSelected = form.getValues(`problems.${item.id}.enabled`);
                        const problemForDifficultyCalc = {
                          ...form.getValues(`problems.${item.id}`),
                          type: item.id,
                        } as Problem;
                        const difficulty = calculateWorkUnitForProblems([problemForDifficultyCalc]);

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
                                  isSelected
                                    ? "text-foreground/80"
                                    : "text-foreground/60 group-hover:text-foreground/80",
                                )}
                              >
                                {item.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {formFields[item.id]}
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
                              <div className="mt-2 flex flex-col">
                                <label className="text-sm font-medium">Difficulty</label>
                                <label className="text-xs text-foreground/60">
                                  How many addresses need to be checked to find one that matches the pattern?
                                </label>
                                <div className="mt-2 rounded-md bg-background/50 p-3 font-mono text-sm break-all">
                                  {difficulty.toLocaleString()} ({displayDifficulty(difficulty)})
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="mt-4 rounded-md border bg-muted/30 p-4">
                <h3 className="text-lg font-semibold">Total Difficulty</h3>
                <p className="text-sm text-foreground/80">
                  This is an estimate of how many addresses need to be checked to find at least one that matches any of
                  the selected problems.
                </p>
                <p className="text-sm text-foreground/80">
                  The more problems you select, the easier it will be to match any of them.
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {selectedProblems.length === 0
                    ? "Select at least 1 problem"
                    : !form.formState.isValid
                      ? "Fix form errors to estimate"
                      : displayDifficulty(totalDifficulty)}
                </p>
                <h3 className="mt-4 text-lg font-semibold">Time Estimation</h3>
                <p className="text-sm text-foreground/80">
                  With 20 providers working for 30 minutes, you can expect to find approximately:
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {selectedProblems.length === 0
                    ? "Select at least 1 problem"
                    : !form.formState.isValid
                      ? "Fix form errors to estimate"
                      : expectedMatches.toLocaleString() + " matching addresses"}
                </p>
                {expectedMatches < 100 && selectedProblems.length > 0 && (
                  <p className="mt-2 text-sm text-orange-500">
                    Warning: The expected number of matches is low. Consider selecting easier problems for better
                    results.
                  </p>
                )}
              </div>

              <Button type="submit" disabled={mutation.isPending || !isConnected || !form.formState.isValid}>
                {mutation.isPending ? "Sending Order..." : !isConnected ? "Connect wallet to send order" : "Send Order"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
