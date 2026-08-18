import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(), // used for the card + meta description
      cover: image(),
      tags: z.array(z.string()).default([]),
      date: z.coerce.date(),
      sources: z
        .array(
          z.object({
            label: z.string(),
            url: z.string().url(),
          })
        )
        .default([]),
      cta: z
        .object({
          label: z.string(),
          url: z.string(), // can be a relative path (e.g. /project/x) or full URL
        })
        .optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles };
