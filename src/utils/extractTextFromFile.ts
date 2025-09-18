import pdfjsLib from "./pdfWorkerSetup";
import mammoth from "mammoth";

function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ")           // remplace espaces multiples par un espace
    .replace(/[\x00-\x1F\x7F]/g, "") // supprime caractères de contrôle invisibles
    .replace(/ ?\n ?/g, "\n")       // nettoie espaces autour des retours à la ligne
    .trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  let rawText = "";

  if (ext === "txt") {
    rawText = await file.text();
  } else if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    if (!text.trim()) {
  throw new Error("Ce PDF ne contient pas de texte lisible. Il s'agit peut-être d'un document scanné.");
}
    rawText = text;
  } else if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    rawText = result.value;
  } else {
    throw new Error(`Format de fichier non supporté: ${ext}`);
  }

  return cleanExtractedText(rawText);
}
