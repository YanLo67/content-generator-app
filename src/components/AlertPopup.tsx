import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Post } from "../types/Post";

interface AlertPopupProps {
  postsToDelete: Post[];
  profile: any;
  onClose: () => void;
  onDelete: (posts: Post[]) => Promise<void>;
}

export default function AlertPopup({
  postsToDelete,
  profile,
  onClose,
  onDelete,
}: AlertPopupProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [fomoSentence, setFomoSentence] = useState("");
  const [isLoadingSentence, setIsLoadingSentence] = useState(true);

  const firstPost = postsToDelete.length > 0 ? postsToDelete[0] : null;

  useEffect(() => {
    const manageFomoSentence = async () => {
      if (profile?.fomo_sentence) {
        setFomoSentence(profile.fomo_sentence);
        setIsLoadingSentence(false);
        return;
      }
      if (!firstPost || !profile?.persona_data) {
        setIsLoadingSentence(false);
        return;
      }
      try {
        const functionUrl = `https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-fomo-sentence`;
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            postContent: firstPost.content,
            userPersona: profile.persona_data,
          }),
        });
        const data = await response.json();
        if (data.fomoSentence) {
          const newSentence = data.fomoSentence;
          setFomoSentence(newSentence);
          await supabase
            .from("profiles")
            .update({ fomo_sentence: newSentence })
            .eq("id", profile.id);
        }
      } catch (error) {
        console.error("Erreur de génération FOMO:", error);
      } finally {
        setIsLoadingSentence(false);
      }
    };
    manageFomoSentence();
  }, [firstPost, profile]);

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    await onDelete(postsToDelete);
  };

  const postCount = postsToDelete.length;

  return (
    <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      {/* ▼▼▼ NOUVEAU DESIGN DE LA POPUP ▼▼▼ */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col gap-6">
        {/* En-tête */}
        <div className="text-center">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 17c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-4">
            Attention, des idées s'endorment !
          </h3>
          <p className="mt-2 text-md text-gray-500">
            Vous avez {postCount}{" "}
            {postCount > 1 ? "idées inactives" : "idée inactive"} depuis plus de
            30 jours.
          </p>
        </div>

        {/* Bloc de citation pour la phrase de l'IA */}
        <div className="p-4 bg-amber-50 border-l-4 border-amber-400">
          {isLoadingSentence ? (
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <blockquote className="text-amber-900 font-medium italic">
              “
              {fomoSentence ||
                "Ces idées pourraient encore avoir un grand potentiel..."}
              ”
            </blockquote>
          )}
        </div>

        {/* Aperçu du post concerné */}
        {firstPost && (
          <div className="text-left p-4 bg-gray-50 rounded-lg border">
            <p className="font-semibold text-xs text-gray-500 uppercase mb-2">
              Exemple d'idée concernée :
            </p>
            <p className="text-gray-700 text-sm line-clamp-3">
              {firstPost.content}
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="mt-4 flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 bg-red-600 text-base font-medium text-white hover:bg-red-700 disabled:bg-red-300"
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : `Supprimer les ${postCount} idées`}
          </button>
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={isDeleting}
          >
            Garder pour l'instant
          </button>
        </div>
      </div>
    </div>
  );
}
