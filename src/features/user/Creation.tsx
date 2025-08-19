import React, { useState, useEffect } from "react";
import FileTextExtractor from "../../components/FileTextExtractor";
import PostCardSimple from "../../components/post/PostCardSimple";
import type { Post } from "../../types/Post";
import PostUp from "../../components/post/PostPopup";
import Modal from "../../components/Modal";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

export default function Creation() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [textAreaContent, setTextAreaContent] = useState("");

  // États pour la fonctionnalité de génération par l'IA
  const [fileText, setFileText] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charge les posts existants au démarrage
  const fetchPosts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("posts")
      .select("id, content, last_status_date, status, scheduled_at")
      .eq("user_id", user.id)
      .order("last_status_date", { ascending: false });
    if (error) {
      console.error("Erreur chargement posts:", error.message);
    } else {
      setPosts(data || []);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  // Fonction pour appeler l'Edge Function et générer un post
  const handleGeneratePost = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedPost("");

    const sourceText = textAreaContent.trim() || fileText.trim();
    console.log(sourceText);

    if (!sourceText) {
      setError("Veuillez entrer une idée ou uploader un fichier.");
      setIsLoading(false);
      return;
    }

    try {
      const functionUrl =
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/rapid-action";

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Vous devez être connecté pour effectuer cette action."
        );
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sourceText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "La réponse du serveur n'est pas OK"
        );
      }

      const data = await response.json();
      setGeneratedPost(data.post);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour sauvegarder le post (généré ou modifié) en base de données
  const handleSavePost = async () => {
    const contentToSave = generatedPost.trim();
    if (!contentToSave || !user) {
      alert(
        "Impossible de sauvegarder un post vide ou si vous n'êtes pas connecté."
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          content: contentToSave,
          user_id: user.id,
          status: "Idée", // Statut par défaut
        })
        .single();

      if (error) throw error;

      alert("Post sauvegardé avec succès !");
      setGeneratedPost("");
      setTextAreaContent("");
      setFileText("");
      fetchPosts();
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde du post:", err.message);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar avec la liste des posts */}
      <aside className="w-64 border-r border-gray-200 p-3 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
          Mes posts
        </h3>
        <div className="space-y-2">
          {posts.map((post) => (
            <PostCardSimple
              key={post.id}
              post={post}
              onClick={(post) => setSelectedPost(post)}
            />
          ))}
        </div>
      </aside>

      {/* Zone principale de création */}
      <main className="flex flex-col flex-1 p-4 gap-4">
        {/* Zone d'affichage du post généré (scrollable et éditable) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 rounded-lg p-4 border border-gray-200 bg-white shadow-inner flex flex-col">
            {isLoading && (
              <p className="text-gray-500 animate-pulse m-auto">
                Génération en cours...
              </p>
            )}
            {error && <p className="text-red-500 m-auto">{error}</p>}

            {generatedPost && (
              <textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                className="w-full h-full text-gray-800 whitespace-pre-wrap resize-none border-none focus:ring-0 p-0 bg-transparent"
                placeholder="Le post généré par l'IA..."
              />
            )}
            {/* {!isLoading && !error && !generatedPost && (
              <p className="text-gray-400 text-center m-auto">
                Le post généré par l'IA apparaîtra ici.
              </p>
            )} */}
          </div>

          {/* Bouton pour enregistrer le post (n'apparaît qu'après génération) */}
          {generatedPost && !isLoading && (
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSavePost}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Enregistrer le post
              </button>
            </div>
          )}
        </div>

        {/* Zone de saisie de l'idée initiale */}
        <div className="flex gap-4 items-start">
          <textarea
            className="flex-1 p-3 border border-gray-300 rounded resize-none min-h-[80px]"
            placeholder="Écrivez une idée, collez un texte..."
            value={textAreaContent}
            onChange={(e) => setTextAreaContent(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={
              isLoading || (!textAreaContent.trim() && !fileText.trim())
            }
            onClick={handleGeneratePost}
          >
            {isLoading ? "..." : "Générer"}
          </button>
        </div>

        {/* Zone d'upload de fichier */}
        <div className="border border-gray-300 rounded p-3">
          <FileTextExtractor onExtract={(text: string) => setFileText(text)} />
        </div>

        {/* Modale pour voir les détails d'un post existant */}
        <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
          {selectedPost && (
            <PostUp
              post={selectedPost}
              userId={user?.id || ""}
              onClose={() => setSelectedPost(null)}
              onUpdate={fetchPosts}
            />
          )}
        </Modal>
      </main>
    </div>
  );
}
