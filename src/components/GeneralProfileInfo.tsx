import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  WRITING_STYLE_OPTIONS,
  DEFAULT_WRITING_STYLE,
  type WritingStyle,
} from "../configs/constants";

export default function GeneralProfileInfo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // States for the form fields
  const [writing_style, setWriting_style] = useState("");
  const [website, setWebsite] = useState("");
  const [defaultStyle, setDefaultStyle] = useState<WritingStyle>(
    DEFAULT_WRITING_STYLE
  );

  // Fetch existing profile data when the component loads
  useEffect(() => {
    const fetchGeneralData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, website, default_writing_style")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setWriting_style(data.full_name || "");
          setWebsite(data.website || "");
          setDefaultStyle(data.default_writing_style || DEFAULT_WRITING_STYLE);
        }
      } catch (error) {
        console.error("Error fetching general profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGeneralData();
  }, [user]);

  // Save the updated data to Supabase
  const handleSaveGeneral = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          default_writing_style: defaultStyle,
        })
        .eq("id", user.id);

      if (error) throw error;
      alert("Informations sauvegardées !");
    } catch (error) {
      alert("Erreur lors de la sauvegarde des informations.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p>Chargement des informations...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          Modifiez vos informations générales et vos préférences.
        </p>
        <button
          onClick={handleSaveGeneral}
          disabled={isSaving}
          className="bg-blue-600 text-white py-2 px-5 rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </div>

      <div>
        <label
          htmlFor="defaultStyle"
          className="block text-sm font-medium text-gray-700"
        >
          Style d'écriture par défaut
        </label>
        <select
          id="defaultStyle"
          value={defaultStyle}
          onChange={(e) => setDefaultStyle(e.target.value as WritingStyle)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        >
          {WRITING_STYLE_OPTIONS.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
