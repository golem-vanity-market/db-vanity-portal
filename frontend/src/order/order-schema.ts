import z from "zod";

export const ProblemSchema = z.discriminatedUnion("type", [
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

export const VanityRequestSchema = z.object({
  publicKey: z.string().startsWith("0x").length(132),
  problems: z.array(ProblemSchema).refine((value) => value.length > 0, {
    message: "You have to select at least one item.",
  }),
});

export type Problem = z.infer<typeof ProblemSchema>;
export type ProblemId = Problem["type"];

export const VanityRequestWithTimestampSchema = VanityRequestSchema.extend({
  timestamp: z.string().datetime(),
});

export type VanityRequestWithTimestamp = z.infer<typeof VanityRequestWithTimestampSchema>;
