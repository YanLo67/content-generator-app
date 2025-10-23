import { useState } from "react";
import { supabase } from "../lib/supabase";
import { WRITING_STYLE_OPTIONS, type WritingStyle } from "../configs/constants";
import Modal from "./Modal";

interface GeneralProfileInfoProps {
  defaultStyle: WritingStyle | string;
  customStyle: string | null;
  onStyleChange: (newStyle: WritingStyle | string) => void;
  onCustomStyleSave: (newDescription: string) => Promise<void>;
}

export default function GeneralProfileInfo({
  defaultStyle,
  customStyle,
  onStyleChange,
  onCustomStyleSave,
}: GeneralProfileInfoProps) {
  // Les états pour la modale restent ici, car ils sont internes au composant
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sampleText, setSampleText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedStyle, setGeneratedStyle] = useState("");

  const handleAnalyzeStyle = async () => {
    setIsAnalyzing(true);
    setGeneratedStyle("");
    try {
      const functionUrl =
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/analyze-writing-style";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non trouvée.");
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sampleTexts: sampleText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setGeneratedStyle(data.style);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCustomStyle = async () => {
    if (!generatedStyle) return;
    await onCustomStyleSave(generatedStyle);
    setIsModalOpen(false);
    setSampleText("");
    setGeneratedStyle("");
  };

  // 1. On filtre la liste : on n'affiche "Mon Style Personnalisé" que s'il existe
  const allStyleOptions = WRITING_STYLE_OPTIONS.filter(
    (style) =>
      style !== "Mon Style Personnalisé" ||
      (style === "Mon Style Personnalisé" && customStyle)
  );

  // 2. On détermine la valeur à afficher
  const selectValue =
    defaultStyle === customStyle && customStyle
      ? "Mon Style Personnalisé"
      : defaultStyle;

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="defaultStyle"
          className="block text-sm font-medium text-gray-700"
        >
          Style d'écriture par défaut
        </label>
        <div className="flex items-center gap-2 mt-1">
          <select
            id="defaultStyle"
            value={selectValue}
            onChange={(e) => {
              const selectedValue = e.target.value;
              onStyleChange(selectedValue as WritingStyle);
              console.log("aaaaa" + selectedValue);
            }}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
          >
            {allStyleOptions.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300"
          >
            {customStyle ? "Modifier mon style" : "Créer un style"}
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4">
            Définir votre style d'écriture
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Collez 1 à 3 de vos anciens posts. L'IA les analysera pour définir
            votre style unique.
          </p>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            rows={10}
            className="w-full p-2 border rounded-md"
            placeholder="Collez vos textes ici..."
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAnalyzeStyle}
              disabled={isAnalyzing || !sampleText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {isAnalyzing ? "Analyse en cours..." : "Analyser mon style"}
            </button>
          </div>
          {generatedStyle && (
            <div className="mt-4 p-4 bg-green-50 rounded-md">
              <p className="text-sm text-gray-600 mb-2">
                Style détecté par l'IA :
              </p>
              <div className="bg-white p-3 rounded border text-sm text-gray-800">
                {generatedStyle}
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={handleSaveCustomStyle}
                  className="px-4 py-2 bg-green-600 text-white rounded-md"
                >
                  Utiliser et sauvegarder ce style
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
