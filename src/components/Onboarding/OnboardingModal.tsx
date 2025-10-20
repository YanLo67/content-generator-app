import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import type { Session } from "@supabase/supabase-js";

// Interface for component props
interface OnboardingModalProps {
  onClose: () => void;
}

// Internal component for the progress bar
const Stepper = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div
        className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
          currentStep >= 1 ? "bg-blue-600" : "bg-gray-200"
        }`}
      ></div>
      <div
        className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
          currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
        }`}
      ></div>
      <div
        className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
          currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
        }`}
      ></div>
    </div>
  );
};

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    job: "",
    goal: "",
    audience: "",
    tone: "tutoiement",
    gender: "masculin" as GenderOption,
  });
  const [savingMessage] = useState("Finalisation en cours...");
  const [newTheme, setNewTheme] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThemes, setGeneratedThemes] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  type GenderOption = "masculin" | "feminin" | "neutre";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    onClose();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non trouvée.");
      // On lance les deux générations en parallèle
      const personaPromise = generatePersona(session);
      const postsPromise = generateFourPosts(session); // N'a plus besoin de personaData
      const [personaData, generatedPosts] = await Promise.all([
        personaPromise,
        postsPromise,
      ]);
      // Sauvegarder le persona dans le profil
      await supabase
        .from("profiles")
        .update({
          persona_data: personaData,
          onboarding_completed: true,
          tone: formData.tone,
          gender: formData.gender,
        })
        .eq("id", user.id);
      // Insérer les nouveaux posts

      const postsToInsert = generatedPosts.map(
        (postObject: {
          content: string;
          main_theme: string;
          sub_theme: string;
        }) => ({
          content: postObject.content,
          main_theme: postObject.main_theme,
          sub_theme: postObject.sub_theme,
          user_id: user.id,
          status: "Idée",
        })
      );
      const { error: insertError } = await supabase
        .from("posts")
        .insert(postsToInsert);
      if (insertError) throw insertError;
    } catch (error: any) {
      alert(`Une erreur est survenue aaaaaa : ${error.message}`);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction dédiée à la génération du persona
  const generatePersona = async (session: Session) => {
    const functionUrl = `https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-persona`;
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...formData, themes: generatedThemes }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Erreur Persona: ${errorData.error || "Génération échouée"}`
      );
    }
    return response.json();
  };

  // Fonction dédiée à la génération des 4 posts
  const generateFourPosts = async (session: Session) => {
    const functionUrl = `https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-four-posts`;
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        themes: generatedThemes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Erreur Posts: ${errorData.error || "Génération échouée"}`
      );
    }
    const data = await response.json();
    console.log(data);
    return data.posts;
  };

  const handleDeleteTheme = (themeToDelete: string) => {
    setGeneratedThemes((prevThemes) =>
      prevThemes.filter((theme) => theme !== themeToDelete)
    );
  };

  const handleGenerateThemes = async () => {
    if (!user) return;
    setIsGenerating(true);
    setGenerationError(null);
    try {
      const functionUrl = `https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/rapid-handler`;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Could not get session.");
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          job: formData.job,
          goal: formData.goal,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Theme generation failed.");
      }
      const data = await response.json();
      if (data.themes && Array.isArray(data.themes)) {
        setGeneratedThemes(data.themes);
      } else {
        throw new Error("Invalid theme format received.");
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError("Could not generate themes at this time.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      handleGenerateThemes();
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleAddTheme = () => {
    const themeToAdd = newTheme.trim();
    if (themeToAdd && !generatedThemes.includes(themeToAdd)) {
      setGeneratedThemes((prevThemes) => [...prevThemes, themeToAdd]);
      setNewTheme("");
    }
  };

  const handleKeyDownAddTheme = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTheme();
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      {isSaving && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">{savingMessage}</p>
        </div>
      )}
      <form
        onSubmit={handleFinalSubmit}
        className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-2xl"
      >
        <Stepper currentStep={step} />
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Commençons par vous</h2>
            <div className="space-y-6 mb-8">
              <div>
                <label
                  htmlFor="job"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quel est votre métier ?
                </label>
                <input
                  type="text"
                  name="job"
                  value={formData.job}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ex: Développeur Web, Coach Agile, Consultant SEO..."
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="goal"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quel est votre objectif principal sur LinkedIn ?
                </label>
                <textarea
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Ex: Trouver de nouveaux clients, partager mon expertise pour construire ma marque personnelle, recruter des talents..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quel genre préférez-vous pour la rédaction ?
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  {" "}
                  {(["masculin", "feminin", "neutre"] as GenderOption[]).map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, gender: option }))
                        }
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          formData.gender === option
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <p className="font-medium text-sm text-gray-800 capitalize">
                          {" "}
                          {option}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {" "}
                          {option === "masculin" && "Rédaction au masculin."}
                          {option === "feminin" && "Rédaction au féminin."}
                          {option === "neutre" &&
                            "Utilisation de l'écriture inclusive."}
                        </p>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 text-base"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Votre communication</h2>
            <div className="space-y-6 mb-8">
              <div>
                <label
                  htmlFor="audience"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Qui est votre audience cible ?
                </label>
                <textarea
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Ex: Des directeurs marketing dans des PME, des développeurs juniors, des responsables RH dans la tech..."
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="tone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Quel ton souhaitez-vous employer ?
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="tutoiement">
                    Tutoiement (plus direct et personnel)
                  </option>
                  <option value="vouvoiement">
                    Vouvoiement (plus formel et professionnel)
                  </option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="text-gray-600 py-2 px-6 rounded-md hover:bg-gray-100 text-base"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 text-base"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-4">Vos thèmes de contenu</h2>
            <p className="text-gray-600 mb-6">
              Affinez la liste en supprimant des thèmes ou en ajoutant les
              vôtres.
            </p>
            <div className="min-h-[120px] bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
              {isGenerating ? (
                <p className="text-gray-500 animate-pulse">
                  Génération des thèmes...
                </p>
              ) : generationError ? (
                <p className="text-red-500">{generationError}</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {generatedThemes.map((theme, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium pl-4 pr-2 py-2 rounded-full"
                    >
                      <span>{theme}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTheme(theme)}
                        className="text-blue-600 hover:bg-blue-300/50 rounded-full p-0.5 transition-colors"
                        aria-label={`Supprimer le thème ${theme}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mb-8">
              <input
                type="text"
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                onKeyDown={handleKeyDownAddTheme}
                className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ajouter un nouveau thème..."
              />
              <button
                type="button"
                onClick={handleAddTheme}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
              >
                Ajouter
              </button>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="text-gray-600 py-2 px-6 rounded-md hover:bg-gray-100 text-base"
              >
                Précédent
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 text-base disabled:bg-green-300"
                disabled={isSaving}
              >
                {isSaving ? "Finalisation..." : "Terminer et commencer"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
