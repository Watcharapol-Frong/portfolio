export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface PortableTextBlock {
  _type: string;
  style?: string;
  children?: { text?: string }[];
}

export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

const STYLE_DEPTH: Record<string, number> = { h2: 2, h3: 3 };

export function extractHeadings(body: PortableTextBlock[] = []): Heading[] {
  return body
    .filter((block) => block._type === "block" && block.style && STYLE_DEPTH[block.style])
    .map((block) => {
      const text = (block.children ?? []).map((child) => child.text ?? "").join("");
      return {
        depth: STYLE_DEPTH[block.style as string],
        slug: slugify(text),
        text,
      };
    });
}
