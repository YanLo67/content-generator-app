export type Idea = {
  id: number;
  source_type: "text" | "pdf";
  content: string;
  file_url?: string;
  created_at: string;
};