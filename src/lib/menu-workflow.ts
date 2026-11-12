import { z } from "zod";
import { buildProposal, catalog, maxQuantity, validPlan, type Plan } from "./dinner";

const itemIdSchema = z.enum(["napa", "enoki", "tofu", "beef", "lotus", "noodles", "bok", "broth"]);
export const reviewRequestSchema = z
  .object({
    plan: z.custom<Plan>(validPlan, "Invalid dinner settings."),
    revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
export type ReviewRequest = z.infer<typeof reviewRequestSchema>;

export const menuOutputSchema = z
  .object({
    summary: z.string().trim().min(1).max(240),
    recommendations: z
      .array(
        z
          .object({
            id: itemIdSchema,
            quantity: z.number().int().min(0).max(30000),
          })
          .strict(),
      )
      .length(catalog.length),
  })
  .strict();

// This is also sent as the gateway's constrained JSON response format.
export const menuJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "recommendations"],
  properties: {
    summary: { type: "string" },
    recommendations: {
      type: "array",
      minItems: catalog.length,
      maxItems: catalog.length,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "quantity"],
        properties: {
          id: { type: "string", enum: catalog.map((item) => item.id) },
          quantity: { type: "integer", minimum: 0, maximum: 30000 },
        },
      },
    },
  },
};

export function proposalFromMenu(output: unknown, request: ReviewRequest) {
  const result = menuOutputSchema.parse(output);
  if (new Set(result.recommendations.map((row) => row.id)).size !== catalog.length)
    throw new Error("Menu must recommend every catalog item exactly once.");
  const quantities = Object.fromEntries(
    result.recommendations.map((row) => [row.id, row.quantity]),
  ) as Plan["quantities"];
  return buildProposal(
    { ...request.plan, quantities },
    request.plan,
    request.revision,
    "live",
    result.summary,
  );
}

export function menuContext(request: ReviewRequest) {
  return {
    guests: request.plan.guests,
    vegetarianGuests: request.plan.vegetarians,
    budgetUSD: request.plan.budget,
    catalog: catalog.map((item) => ({
      ...item,
      maximumQuantity: maxQuantity(item),
      confirmedQuantity: request.plan.quantities[item.id],
      minimumKeptQuantity: request.plan.kept.includes(item.id)
        ? request.plan.quantities[item.id]
        : null,
    })),
  };
}

export type ReviewResult =
  | { ok: true; proposal: ReturnType<typeof proposalFromMenu> }
  | {
      ok: false;
      code: "configuration" | "invalid" | "timeout" | "rate-limit" | "credits" | "gateway";
      message: string;
    };
