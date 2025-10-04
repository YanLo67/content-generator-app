export const WRITING_STYLE_OPTIONS = [
  "Content Gen",
  "Justin Welsh",
  "Ruben Hassid",
  "Chris Donnelly",
] as const; 

export const DEFAULT_WRITING_STYLE = WRITING_STYLE_OPTIONS[0]; 

// This creates a TypeScript type from your options array
export type WritingStyle = typeof WRITING_STYLE_OPTIONS[number];