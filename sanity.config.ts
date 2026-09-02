import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";
import { AIAssistantView } from "./sanity/components/AIAssistantView";

export default defineConfig({
  name: "frong-me",
  title: "frong.me",
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || "",
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
  plugins: [
    structureTool({
      defaultDocumentNode: (S, { schemaType }) => {
        if (schemaType === "article") {
          return S.document().views([
            S.view.form().title("Editor"),
            S.view.component(AIAssistantView).title("AI Assistant"),
          ]);
        }
        return S.document().views([S.view.form()]);
      },
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
