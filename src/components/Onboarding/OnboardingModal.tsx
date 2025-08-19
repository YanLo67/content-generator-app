// components/Onboarding/OnboardingModal.tsx
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

// Pour la clarté, on définit les types des props
interface OnboardingModalProps {
  onClose: () => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    job_title: "",
    goal: "",
    audience: "",
    tone: "tutoiement", // Valeur par défaut
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  // La soumission se fait uniquement à la fin
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Ici, on enverra les données finales à Supabase
    const { error } = await supabase
      .from("profiles")
      .update({
        job_title: formData.job_title,
        goal: formData.goal,
        audience: formData.audience,
        tone: formData.tone,
        onboarding_completed: true, // Étape cruciale !
      })
      .eq("id", user.id);

    if (error) {
      alert("Erreur lors de la mise à jour du profil.");
      console.error(error);
    } else {
      alert("Profil complété !");
      onClose(); // Ferme la modale avec succès
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center overflow-y-auto px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md"
      >
        {/* Étape 1 : Métier et Objectif */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-4">Commençons par vous</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="job_title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quel est votre métier ?
                </label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="goal"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quel est votre objectif principal sur LinkedIn ?
                </label>
                <input
                  type="text"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Suivant
              </button>
            </div>
          </>
        )}

        {/* Étape 2 : Audience et Ton */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-4">Votre communication</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label
                  htmlFor="audience"
                  className="block text-sm font-medium text-gray-700"
                >
                  Qui est votre audience cible ?
                </label>
                <input
                  type="text"
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="tone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Quel ton souhaitez-vous employer ?
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="tutoiement">Tutoiement</option>
                  <option value="vouvoiement">Vouvoiement</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-md hover:bg-gray-100"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Suivant
              </button>
            </div>
          </>
        )}

        {/* Étape 3 : Proposition de thèmes */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-4">Vos thèmes de contenu</h2>
            <p className="text-gray-600 mb-4">
              Voici quelques thèmes que nous vous suggérons. Vous pourrez les
              modifier plus tard.
            </p>
            <div className="space-y-2 bg-gray-50 p-4 rounded-md mb-6">
              {/* Contenu statique en attendant l'IA */}
              <p>Thème 1 : Les défis de [votre métier]</p>
              <p>Thème 2 : Comment atteindre [votre objectif]</p>
              <p>Thème 3 : Conseils pour [votre audience]</p>
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="text-gray-600 py-2 px-4 rounded-md hover:bg-gray-100"
              >
                Précédent
              </button>
              <button
                type="submit"
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                Terminer et commencer
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
