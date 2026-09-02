import { defineField, defineType } from "sanity";
import { CharCountInput } from "../components/CharCount";
import { UnsplashImageInput } from "../components/UnsplashImageInput";

export default defineType({
  name: "article",
  title: "Article",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "metadata", title: "Metadata" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      components: { input: CharCountInput },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      group: "content",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
          ],
        },
        {
          type: "image",
          options: { hotspot: true },
        },
      ],
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "metadata",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "font",
      title: "Font",
      type: "string",
      group: "metadata",
      options: {
        list: [
          { title: "Sans (Inter)", value: "sans" },
          { title: "Serif (Cormorant Garamond)", value: "serif" },
        ],
        layout: "radio",
      },
      initialValue: "sans",
    }),
    defineField({
      name: "cover",
      title: "Cover Image",
      type: "image",
      group: "metadata",
      options: { hotspot: true },
      components: { input: UnsplashImageInput },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description / Excerpt",
      type: "text",
      group: "metadata",
      description: "Used for the card + meta description",
      components: { input: CharCountInput },
      validation: (Rule) => Rule.required().max(160).warning("Keep it under 160 characters for SEO"),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "metadata",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      group: "metadata",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      group: "metadata",
      of: [
        {
          type: "object",
          name: "source",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "url", title: "URL", type: "url" }),
          ],
        },
      ],
    }),
    defineField({
      name: "cta",
      title: "Call to Action",
      type: "object",
      group: "metadata",
      fields: [
        defineField({ name: "label", title: "Label", type: "string" }),
        defineField({ name: "url", title: "URL", type: "string" }),
      ],
    }),
    defineField({
      name: "draft",
      title: "Draft",
      type: "boolean",
      group: "metadata",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "description", media: "cover" },
  },
});
