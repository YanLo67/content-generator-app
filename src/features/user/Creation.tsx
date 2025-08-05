import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";

export default function Creation() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [editedResult, setEditedResult] = useState(""); // pour modifier le texte généré
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const savePostToSupabase = async (text: string) => {
    if (!user) return;
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: text,
    });
    if (error) {
      console.error("Erreur en sauvegardant le post :", error.message);
      setError(error.message);
    } else {
      setError("");
      setPrompt("");
      setResult("");
      setEditedResult("");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResult("");
    setEditedResult("");

    try {
      const linkedInPrompt = `Tu es un expert en communication LinkedIn. Rédige un post LinkedIn professionnel et engageant à partir du texte suivant :\n\n${prompt}`;

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: linkedInPrompt }],
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content;

      setResult(text || "Pas de réponse");
      setEditedResult(text || ""); // on initialise le texte éditable
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Création de poste LinkedIn</h1>

      <textarea
        rows={5}
        placeholder="Écris ton idée ici..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mb-6"
      >
        {loading ? "Génération en cours..." : "Générer le post"}
      </button>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {result && (
        <>
          <textarea
            rows={8}
            value={editedResult}
            onChange={(e) => setEditedResult(e.target.value)}
            className="w-full p-3 border rounded mb-4"
          />

          <button
            onClick={() => savePostToSupabase(editedResult)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Sauvegarder le post modifié
          </button>
        </>
      )}
    </div>
  );
}
