import { generateStoryDraft } from "@/lib/story/drafts";
import { generateDescriptions, generateHooks, generateTitles } from "@/lib/story/generation";
import type { ContentAIProvider } from "@/types/assistant";

export const ruleBasedContentProvider: ContentAIProvider = {
  id: "rule-based",
  generateHooks: async (input) => generateHooks(input),
  generateTitles: async (input) => generateTitles(input),
  generateStoryOutline: async (input, options) => generateStoryDraft(input, options),
  generateDescription: async (input) => generateDescriptions(input),
};
