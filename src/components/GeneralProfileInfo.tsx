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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [postInputs, setPostInputs] = useState({
    post1: "",
    post2: "",
    post3: "",
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedStyle, setGeneratedStyle] = useState("");

  const handleInputChange = (
    key: "post1" | "post2" | "post3",
    value: string
  ) => {
    setPostInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Vérifie si les 3 champs contiennent du texte
  const areAllPostsFilled =
    postInputs.post1.trim().length > 0 &&
    postInputs.post2.trim().length > 0 &&
    postInputs.post3.trim().length > 0;

  const handleAnalyzeStyle = async () => {
    // 1. VALIDATION STRICTE : On bloque si les 3 ne sont pas remplis
    if (!areAllPostsFilled) {
      alert(
        "Veuillez remplir les 3 exemples de posts pour garantir une analyse de qualité."
      );
      return;
    }

    setIsAnalyzing(true);
    setGeneratedStyle("");

    // 2. CONCATÉNATION : On envoie les 3 posts
    const postsToAnalyze = [
      postInputs.post1,
      postInputs.post2,
      postInputs.post3,
    ]
      .map((text, index) => `--- EXEMPLE DE POST ${index + 1} ---\n${text}`)
      .join("\n\n");

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
        body: JSON.stringify({ sampleTexts: postsToAnalyze }),
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
    setPostInputs({ post1: "", post2: "", post3: "" });
    setGeneratedStyle("");
  };

  const allStyleOptions = WRITING_STYLE_OPTIONS.filter(
    (style) =>
      style !== "Mon Style Personnalisé" ||
      (style === "Mon Style Personnalisé" && customStyle)
  );

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
            className="px-3 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 whitespace-nowrap"
          >
            {customStyle ? "Modifier mon style" : "Créer un style"}
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4 max-h-[80vh] overflow-y-auto">
          <h3 className="text-lg font-bold mb-2">
            Définir votre style d'écriture
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Pour que l'IA capture votre ADN, veuillez coller{" "}
            <b>3 posts différents</b> ci-dessous.
          </p>

          <div className="space-y-4">
            {/* POST 1 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Exemple de post #1 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={postInputs.post1}
                onChange={(e) => handleInputChange("post1", e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Collez votre premier post ici..."
              />
            </div>

            {/* POST 2 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Exemple de post #2 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={postInputs.post2}
                onChange={(e) => handleInputChange("post2", e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Collez votre deuxième post ici..."
              />
            </div>

            {/* POST 3 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Exemple de post #3 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={postInputs.post3}
                onChange={(e) => handleInputChange("post3", e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Collez votre troisième post ici..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyzeStyle}
              // Désactivé tant que les 3 ne sont pas remplis ou que l'analyse tourne
              disabled={isAnalyzing || !areAllPostsFilled}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              {isAnalyzing ? "Analyse en cours..." : "Analyser ces 3 posts"}
            </button>
          </div>

          {generatedStyle && (
            <div className="mt-6 p-4 bg-green-50 rounded-md border border-green-100 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-sm font-medium text-green-800 mb-2">
                ✨ Style détecté par l'IA :
              </p>
              <div className="bg-white p-3 rounded border border-green-200 text-sm text-gray-800 italic max-h-60 overflow-y-auto">
                {generatedStyle}
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={handleSaveCustomStyle}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm"
                >
                  Sauvegarder ce style
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
