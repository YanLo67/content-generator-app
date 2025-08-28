import React, { useState, useEffect } from "react";
import PostUp from "../../components/post/PostPopup";
import Modal from "../../components/Modal";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../types/Post";
import FileTextExtractor from "../../components/FileTextExtractor"; // Pour l'upload de fichier
import IdeaPostCard from "../../components/post/IdeaPostCard";
import { Textarea } from "../../components/ui/textarea";

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0V6h-1a1 1 0 110-2h1V3a1 1 0 011-1zM3 13a1 1 0 011-1h1v1a1 1 0 11-2 0v-1zm1-5a1 1 0 011-1h1v1a1 1 0 11-2 0v-1zm6 5a1 1 0 011-1h1v1a1 1 0 11-2 0v-1zm1-5a1 1 0 011-1h1v1a1 1 0 11-2 0v-1zm-3 4a1 1 0 011-1h1v1a1 1 0 11-2 0v-1z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Creation() {
  const { user } = useAuth();
  // 'posts' contient maintenant la liste des idées pour la sidebar
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // États pour la zone de génération
  const [textAreaContent, setTextAreaContent] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");

  // Charge les posts existants (peut être filtré par "Idée" ou non, selon votre préférence)
  const fetchPosts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, content, status, main_theme, sub_theme, last_status_date, scheduled_at"
      )
      .eq("user_id", user.id)
      .eq("status", "Idée")
      .order("scheduled_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement posts:", error.message);
    } else {
      setPosts(data || []);
    }
  };

  const handleBulkGenerate = async () => {
    if (!user) return;
    setIsBulkGenerating(true);
    try {
      // 1. Récupérer le profil et les thèmes de l'utilisateur
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("persona_data, themes")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) throw new Error("Profil non trouvé.");

      // 2. Appeler la fonction Edge 'generate-four-posts'
      const functionUrl = `https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-four-posts`;
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
        body: JSON.stringify({
          themes: profile.themes,
          formData: profile.persona_data, // On renomme 'persona' en 'formData'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "La génération a échoué.");
      }

      const { posts: newPosts } = await response.json();

      // 3. Sauvegarder les 4 nouveaux posts
      const postsToInsert = newPosts.map((postData: any) => ({
        content: postData.content,
        main_theme: postData.main_theme,
        sub_theme: postData.sub_theme,
        user_id: user.id,
        status: "Idée",
      }));

      const { error: insertError } = await supabase
        .from("posts")
        .insert(postsToInsert);
      if (insertError) throw insertError;

      // 4. Rafraîchir la liste
      fetchPosts();
    } catch (error: any) {
      alert(`Une erreur est survenue : ${error.message}`);
      console.error(error);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  // Génère un post complet à partir d'un texte source
  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPost("");
    const sourceText = textAreaContent.trim() || fileText.trim();

    if (!sourceText) {
      setError("Veuillez entrer une idée ou uploader un fichier.");
      setIsGenerating(false);
      return;
    }

    try {
      const functionUrl =
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/rapid-action";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté.");

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
      setIsGenerating(false);
    }
  };

  // Sauvegarde le post généré comme une nouvelle "Idée"
  const handleSavePost = async () => {
    const contentToSave = generatedPost.trim();
    if (!contentToSave || !user) {
      alert("Impossible de sauvegarder un post vide.");
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .insert({
          content: contentToSave,
          user_id: user.id,
          status: "Idée",
        })
        .single();

      if (error) throw error;

      alert("Idée sauvegardée avec succès !");
      setGeneratedPost("");
      setTextAreaContent("");
      setFileText("");
      fetchPosts(); // Rafraîchit la liste dans la sidebar
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde du post:", err.message);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Barre latérale (gauche) prend 2/3 de la largeur */}
      <aside className="w-2/3 border-r border-gray-200 p-4 overflow-y-auto bg-white">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white/80 backdrop-blur-sm pb-2 z-10">
          <h3 className="text-lg font-semibold text-gray-800">
            Mes Idées & Posts
          </h3>
          <button
            onClick={handleBulkGenerate}
            disabled={isBulkGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <SparklesIcon />
            {isBulkGenerating ? "Génération..." : "Générer 4 idées"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            // Utilisez ici le composant de carte que vous préférez, IdeaPostCard ou PostCardSimple
            <IdeaPostCard
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      </aside>

      {/* Zone principale (droite) prend 1/3 de la largeur */}
      <main className="w-1/3 p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold text-gray-800 flex-shrink-0">
          Générateur d'Idées
        </h2>

        {/* Zone de saisie (plus petite) */}
        <div className="flex-shrink-0 bg-white p-4 rounded-lg border">
          <textarea
            className="w-full h-1 p-2 border border-gray-300 rounded-lg resize-none min-h-[100px] focus:ring-blue-500 focus:border-blue-500"
            placeholder="Écrivez une idée, collez un texte..."
            value={textAreaContent}
            onChange={(e) => setTextAreaContent(e.target.value)}
          />
          <div className="mt-2">
            <FileTextExtractor onExtract={(text) => setTextAreaContent(text)} />
          </div>
          <button
            className="mt-4 w-full px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            disabled={
              isGenerating || (!textAreaContent.trim() && !fileText.trim())
            }
            onClick={handleGeneratePost}
          >
            {isGenerating ? "Génération..." : "Transformer avec l'IA"}
          </button>
        </div>

        {/* Zone de résultat (plus grande) */}
        <div className="flex-1 bg-white rounded-lg border p-4 flex flex-col min-h-0">
          <h4 className="font-semibold text-gray-700 mb-2 flex-shrink-0">
            Suggestion de l'IA :
          </h4>
          {isGenerating ? (
            <p className="text-gray-500 animate-pulse">
              Génération en cours...
            </p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : generatedPost ? (
            <Textarea
              value={generatedPost}
              onChange={(e) => setGeneratedPost(e.target.value)}
              className="w-full h-full text-lg text-gray-800 bg-transparent resize-none border-none focus:ring-0 p-0"
            />
          ) : (
            <p className="text-gray-400">Le résultat apparaîtra ici.</p>
          )}
          {generatedPost && !isGenerating && (
            <div className="flex justify-end mt-2 pt-2 border-t flex-shrink-0">
              <button
                onClick={handleSavePost}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Enregistrer l'idée
              </button>
            </div>
          )}
        </div>
      </main>

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
    </div>
  );
}
