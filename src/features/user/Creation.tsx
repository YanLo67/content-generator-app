import { useState, useEffect, useMemo } from "react";
import PostUp from "../../components/post/PostPopup";
import Modal from "../../components/Modal";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../types/Post";
import DocumentInput from "../../components/DocumentInput"; // Pour l'upload de fichier
import IdeaPostCard from "../../components/post/IdeaPostCard";
import { Textarea } from "../../components/ui/textarea";
import { differenceInDays } from "date-fns";
import AlertPopup from "../../components/AlertPopup";
import { extractTextFromFile } from "../../utils/extractTextFromFile";
import {
  WRITING_STYLE_OPTIONS,
  DEFAULT_WRITING_STYLE,
  type WritingStyle,
} from "../../configs/constants";

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

const getLifecycleStatus = (post: Post): "Vert" | "Orange" | "Rouge" => {
  const postAgeInDays = differenceInDays(
    new Date(),
    new Date(post.last_status_date)
  );
  if (postAgeInDays <= 14) return "Vert";
  if (postAgeInDays <= 29) return "Orange";
  return "Rouge";
};

export default function Creation() {
  const { user } = useAuth();
  // 'posts' contient maintenant la liste des idées pour la sidebar
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  const [intention, setIntention] = useState<string>("Par défaut");

  const [showRedAlert, setShowRedAlert] = useState(false);

  // États pour la zone de génération
  const [textAreaContent, setTextAreaContent] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");

  // Nouveaux états pour les filtres et le tri
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy] = useState<"last_status_date">("last_status_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileIsSaved, setFileIsSaved] = useState(false);
  const [typedText, setTypedText] = useState("");

  const [newPostIds, setNewPostIds] = useState<Set<number>>(new Set());

  const [redPostsToDelete, setRedPostsToDelete] = useState<Post[]>([]);

  const [writingStyle, setWritingStyle] = useState<WritingStyle>(
    DEFAULT_WRITING_STYLE
  );

  useEffect(() => {
    if (uploadedFile) {
      const processFile = async () => {
        const text = await extractTextFromFile(uploadedFile);
        setFileText((prevText) => `${prevText}\n\n${text}`.trim());
      };
      processFile();
    }
  }, [uploadedFile]);

  // Charge les posts existants (peut être filtré par "Idée" ou non, selon votre préférence)
  const fetchPosts = async () => {
    if (!user) return;

    try {
      // On prépare les deux requêtes sans les lancer
      const postsPromise = supabase
        .from("posts")
        .select(
          "id, content, status, main_theme, sub_theme, last_status_date, scheduled_at, status"
        )
        .eq("user_id", user.id)
        .eq("status", "Idée");

      const profilePromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // On lance les deux requêtes en parallèle et on attend les résultats
      const [postsResult, profileResult] = await Promise.all([
        postsPromise,
        profilePromise,
      ]);

      // On vérifie les erreurs
      if (postsResult.error) throw postsResult.error;
      if (profileResult.error) throw profileResult.error;

      const fetchedPosts = postsResult.data || [];
      const fetchedProfile = profileResult.data;

      // On met à jour les états
      setPosts(fetchedPosts);
      setProfile(fetchedProfile);

      if (fetchedProfile.default_writing_style) {
        setWritingStyle(fetchedProfile.default_writing_style);
      }

      // On vérifie si on doit afficher l'alerte
      const isMonday = new Date().getDay() === 1;
      const redPosts = fetchedPosts.filter(
        (post) => getLifecycleStatus(post) === "Rouge"
      );

      const alertShownThisSession = sessionStorage.getItem("redPostAlertShown");

      if (isMonday && redPosts.length > 0 && !alertShownThisSession) {
        setRedPostsToDelete(redPosts);
        setShowRedAlert(true);
        setStatusFilter("Rouge");

        sessionStorage.setItem("redPostAlertShown", "true");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données initiales:", error);
    }
  };

  const handleReset = () => {
    setGeneratedPost("");
    setError(null);
    setTypedText("");
    setUploadedFile(null);
    setFileIsSaved(false);
  };

  const handleSaveFile = async (file: File): Promise<boolean> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté.");

      const { data: existingFile, error: checkError } = await supabase
        .from("documents")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("file_name", file.name)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingFile) {
        console.log("Fichier déjà sauvegardé. Pas besoin de ré-uploader.");
        return true;
      }

      const documentText = await extractTextFromFile(file);

      const response = await fetch(
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/embed-document",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            documentText,
            fileName: file.name,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "L'embedding a échoué.");
      }

      setFileIsSaved(true);
      return true; // Success
    } catch (err) {
      setFileIsSaved(false);
      console.error("Erreur dans handleSaveFile:", err);
      return false; // Failure
    }
  };

  const handleDeleteRedPosts = async () => {
    if (redPostsToDelete.length === 0) return;

    const idsToDelete = redPostsToDelete.map((post) => post.id);

    const { error } = await supabase
      .from("posts")
      .delete()
      .in("id", idsToDelete);

    if (error) {
      alert("Erreur lors de la suppression des posts.");
      console.error(error);
    } else {
      alert(`${idsToDelete.length} post(s) supprimé(s).`);
      setShowRedAlert(false);
      fetchPosts(); // On rafraîchit la liste
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

      const { data: newPostsData, error: insertError } = await supabase
        .from("posts")
        .insert(postsToInsert)
        .select("id");

      if (insertError) throw insertError;

      // On ajoute tous les nouveaux IDs au Set
      const newIds = newPostsData.map((p) => p.id);
      const updatedIds = new Set([...newPostIds, ...newIds]);
      setNewPostIds(updatedIds);

      // 4. Rafraîchir la liste
      fetchPosts();

      // Après 3 secondes, on retire les IDs
      setTimeout(() => {
        setNewPostIds((prevIds) => {
          const newIdsSet = new Set(prevIds);
          newIds.forEach((id) => newIdsSet.delete(id));
          return newIdsSet;
        });
      }, 10000);
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

    let sourceText = typedText.trim() + "\n" + fileText.trim();
    let sourceFileName = null;

    console.log(sourceText);

    if (!sourceText && fileIsSaved && uploadedFile) {
      sourceText = `Utiliser le contenu du document: ${uploadedFile.name}`;
      sourceFileName = uploadedFile.name;
    }

    if (!sourceText) {
      setError("Veuillez entrer une idée ou sauvegarder un fichier.");
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("persona_data, tone, gender")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Impossible de récupérer le persona de l'utilisateur.");
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourceText: sourceText,
          intention: intention,
          persona_data: profile.persona_data,
          tone: profile.tone,
          writingStyle: writingStyle,
          gender: profile.gender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "La réponse du serveur n'est pas OK"
        );
      }

      const data = await response.json();
      setGeneratedPost(data.post);

      setTypedText("");
      setUploadedFile(null);
      setFileIsSaved(false);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredAndSortedPosts = useMemo(() => {
    return posts
      .filter((post: Post) => {
        const searchMatch = post.content
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const statusMatch =
          !statusFilter || getLifecycleStatus(post) === statusFilter;
        return searchMatch && statusMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a[sortBy]).getTime();
        const dateB = new Date(b[sortBy]).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [posts, searchTerm, statusFilter, sortBy, sortOrder]);

  // Sauvegarde le post généré comme une nouvelle "Idée"
  const handleSavePost = async () => {
    const contentToSave = generatedPost.trim();
    if (!contentToSave || !user) {
      alert("Impossible de sauvegarder un post vide.");
      return;
    }

    try {
      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          content: contentToSave,
          user_id: user.id,
          status: "Idée",
        })
        .select("id")
        .single();

      if (error) throw error;

      // On ajoute l'ID du nouveau post à notre Set
      const updatedIds = new Set(newPostIds).add(newPost.id);
      setNewPostIds(updatedIds);

      alert("Idée sauvegardée avec succès !");
      setGeneratedPost("");
      setTextAreaContent("");
      setFileText("");
      fetchPosts(); // Rafraîchit la liste dans la sidebar

      setTimeout(() => {
        setNewPostIds((prevIds) => {
          const newIds = new Set(prevIds);
          newIds.delete(newPost.id);
          return newIds;
        });
      }, 10000);
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde du post:", err.message);
      alert("Une erreur est survenue lors de la sauvegarde.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Barre latérale (gauche) prend 2/3 de la largeur */}
      <aside
        className="w-2/3 border-r border-gray-200 p-4 flex flex-col bg-white"
        id="tour-step-2"
      >
        <div className="flex-shrink-0 mb-4 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Mes Idées de posts
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

          {/* Barre de filtres et de tri */}
          <input
            type="text"
            placeholder="Rechercher une idée..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-3"
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-gray-600">Statut :</span>
            <button
              onClick={() => setStatusFilter(null)}
              className={`px-3 py-1 text-xs rounded-full ${
                !statusFilter
                  ? "bg-black text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter("Vert")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "Vert"
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Vert
            </button>
            <button
              onClick={() => setStatusFilter("Orange")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "Orange"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Orange
            </button>
            <button
              onClick={() => setStatusFilter("Rouge")}
              className={`px-3 py-1 text-xs rounded-full ${
                statusFilter === "Rouge"
                  ? "bg-red-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Rouge
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 border border-gray-300 rounded-md bg-white"
            >
              Trier {sortOrder === "desc" ? "🔽" : "🔼"}
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto min-h-0 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPosts.map((post) => (
              <IdeaPostCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPost(post)}
                isNew={newPostIds.has(post.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Zone principale (droite) prend 1/3 de la largeur */}
      <main className="w-1/3 p-6 flex flex-col gap-6 min-h-0" id="tour-step-3">
        <h2 className="text-xl font-bold text-gray-800 flex-shrink-0">
          Création de posts
        </h2>
        <div className="flex-grow flex flex-col justify-center">
          {isGenerating || generatedPost || error ? (
            // --- BLOC 1 : AFFICHER LE RÉSULTAT ---
            <div className="flex-1 bg-white rounded-lg border p-4 flex flex-col min-h-0">
              <h4 className="font-semibold text-gray-700 mb-2 flex-shrink-0">
                Suggestion de l'IA :
              </h4>
              <div className="flex-grow pr-2">
                {isGenerating ? (
                  <p className="text-gray-500 animate-pulse text-center mt-8">
                    Génération en cours...
                  </p>
                ) : error ? (
                  <p className="text-red-500 text-center mt-8">{error}</p>
                ) : generatedPost ? (
                  <Textarea
                    value={generatedPost}
                    onChange={(e) => setGeneratedPost(e.target.value)}
                    className="w-full h-full text-lg text-gray-800 bg-transparent resize-none border-none focus:ring-0 p-0"
                  />
                ) : (
                  <p className="text-gray-400 text-center mt-8">
                    Le résultat apparaîtra ici.
                  </p>
                )}
              </div>
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
          ) : (
            // --- BLOC 2 : AFFICHER LA ZONE DE SAISIE ---
            <div className="w-full flex-shrink-0 bg-white p-4 rounded-lg border">
              <DocumentInput
                onTextChange={setTypedText}
                onFileChange={(file) => {
                  setUploadedFile(file);
                  setFileIsSaved(false);
                }}
                onFileSave={handleSaveFile}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choisir le style d'écriture :
                </label>
                <div className="flex gap-2">
                  {WRITING_STYLE_OPTIONS.map((style) => (
                    <button
                      key={style}
                      onClick={() => setWritingStyle(style)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        writingStyle === style
                          ? "bg-blue-600 text-white font-semibold"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choisissez une intention :
                </label>
                <div className="flex gap-2">
                  {["Par défaut", "Éduquer", "Inspirer", "Promouvoir"].map(
                    (int) => (
                      <button
                        key={int}
                        onClick={() => setIntention(int)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          intention === int
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300"
                        }`}
                      >
                        {int}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                className="mt-4 w-full px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                disabled={isGenerating || (!typedText.trim() && !uploadedFile)}
                onClick={handleGeneratePost}
              >
                {isGenerating ? "Génération..." : "Transformer avec l'IA"}
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

      {showRedAlert && (
        <AlertPopup
          postsToDelete={redPostsToDelete}
          profile={profile}
          onClose={() => setShowRedAlert(false)}
          onDelete={handleDeleteRedPosts}
        />
      )}
    </div>
  );
}
