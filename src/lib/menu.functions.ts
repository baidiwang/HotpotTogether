import { createServerFn } from "@tanstack/react-start";
import { reviewRequestSchema } from "./menu-workflow";

export const reviewWithMenu = createServerFn({ method: "POST" })
  .validator(reviewRequestSchema)
  .handler(async ({ data }) => {
    const { generateMenuReview } = await import("./menu.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    return generateMenuReview(data, {
      signal: getRequest().signal,
      enabled: process.env["HOTPOT_AI_ENABLED"],
      apiKey: process.env["LOVABLE_API_KEY"],
      model: process.env["HOTPOT_AI_MODEL"],
    });
  });
