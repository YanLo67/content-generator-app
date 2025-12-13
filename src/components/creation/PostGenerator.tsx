import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import DocumentInput from "../DocumentInput";
import {
  WRITING_STYLE_OPTIONS,
  DEFAULT_WRITING_STYLE,
  type WritingStyle,
} from "../../configs/constants";
import { ExtractTextFromFile } from "../../utils/ExtractTextFromFile";
import { Textarea } from "../ui/textarea";
import DocumentList from "../DocumentsList";

interface PostGeneratorProps {
  user: any;
  profile: any;
  onPostSaved: (newPost: any) => void;
  onPostsGenerated: () => void;
}

export default function PostGenerator({
  user,
  profile,
  onPostSaved,
  onPostsGenerated,
}: PostGeneratorProps) {
  const [textAreaContent, setTextAreaContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [intention, setIntention] = useState("Par défaut");
  const [writingStyle, setWritingStyle] = useState<WritingStyle>(
    DEFAULT_WRITING_STYLE
  );
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  // const [youtubeUrl, setYoutubeUrl] = useState("");
  // const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [generatedPost, setGeneratedPost] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFullGenerationProcess = async (fileName: string) => {
    const topic =
      "Identifie les 4 thématiques les plus importantes de ce document.";
    setIsGenerating(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Session non trouvée.");

      // --- ÉTAPE 1 : Extraire les thèmes ---
      const themesFunctionUrl =
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/extract-themes-from-doc";
      const themesResponse = await fetch(themesFunctionUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          topic,
          job: profile?.user_profile?.who,
        }),
      });
      if (!themesResponse.ok) {
        const errData = await themesResponse.json();
        throw new Error(errData.error || "L'extraction des thèmes a échoué.");
      }
      const themes = await themesResponse.json();
      if (!themes || themes.length === 0)
        throw new Error("Aucun thème n'a pu être extrait.");

      console.log(themes);

      // --- ÉTAPE 2 : Générer les posts pour chaque thème ---
      const postPromises = themes.map((theme: any) => {
        const postFunctionUrl =
          "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-post-from-theme";
        return fetch(postFunctionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            theme,
            persona_data: profile.persona_data,
            tone: profile.tone,
            gender: profile.gender,
          }),
        }).then((res) => res.json());
      });

      const results = await Promise.all(postPromises);

      console.log(results);

      // --- ÉTAPE 3 : Sauvegarder les posts générés ---
      const postsToInsert = themes.map((_: any, index: number) => ({
        content: results[index].post || "Erreur de génération pour ce thème.",
        // Vous pouvez aussi récupérer les thèmes ici si vous le souhaitez :
        main_theme: themes[index].main_theme,
        sub_theme: themes[index].sub_theme,
        user_id: user.id,
        status: "Idée",
      }));

      const { error: insertError } = await supabase
        .from("posts")
        .insert(postsToInsert);
      if (insertError) throw insertError;

      // --- ÉTAPE 4 : Rafraîchir l'interface principale ---
      onPostsGenerated(); // On notifie le parent pour qu'il rafraîchisse la grille
      handleReset(); // On réinitialise ce composant
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    // On vérifie si le profil existe et s'il a un style par défaut défini.
    if (profile && profile.default_writing_style) {
      // On met à jour l'état local avec le style préféré de l'utilisateur.
      setWritingStyle(profile.default_writing_style);
    }
  }, [profile]);

  const handleSaveFile = async (file: File): Promise<boolean> => {
    if (!file || !user) return false;
    try {
      const text = await ExtractTextFromFile(file);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté.");
      const response = await fetch(
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/embed-document",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            documentText: text,
            user_id: user.id,
            fileName: file.name,
          }),
        }
      );
      if (!response.ok) throw new Error("L'embedding a échoué.");
      setSelectedFileName(file.name);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // const handleFetchTranscript = async () => {
  //   if (!youtubeUrl.trim()) return;
  //   setIsFetchingTranscript(true);
  //   setError(null);
  //   try {
  //     const functionUrl =
  //       "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/get-youtube-transcript";
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();
  //     if (!session) throw new Error("Vous devez être connecté.");
  //     const response = await fetch(functionUrl, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${session.access_token}`,
  //       },
  //       body: JSON.stringify({ videoUrl: youtubeUrl }),
  //     });
  //     const data = await response.json();
  //     if (!response.ok) throw new Error(data.error);
  //     setTextAreaContent((prev) =>
  //       `${prev}\n\n--- TRANSCRIPTION YOUTUBE ---\n${data.transcript}`.trim()
  //     );
  //     setYoutubeUrl("");
  //   } catch (err: any) {
  //     setError(err.message);
  //   } finally {
  //     setIsFetchingTranscript(false);
  //   }
  // };

  const handleDeleteDocument = async (fileName: string) => {
    if (!user) {
      alert("Vous devez être connecté pour effectuer cette action.");
      return;
    }

    if (
      !confirm(
        `Voulez-vous vraiment supprimer le document "${fileName}" et toutes ses données associées ?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("user_id", user.id)
        .eq("file_name", fileName);

      if (error) {
        throw error;
      }

      alert(`Le document "${fileName}" a été supprimé avec succès.`);
    } catch (error: any) {
      console.error("Erreur lors de la suppression du document:", error);
      alert(
        `Une erreur est survenue lors de la suppression : ${error.message}`
      );
    }
  };

  const handleGeneratePost = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPost("");
    const topic = textAreaContent.trim();
    if (!topic && !selectedFileName) {
      setError(
        "Veuillez entrer une idée ou sélectionner un document sauvegardé."
      );
      setIsGenerating(false);
      return;
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté.");

      let functionUrl = "";
      let requestBody = {};

      if (selectedFileName) {
        functionUrl =
          "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/generate-post-from-doc";
        requestBody = {
          topic,
          fileName: selectedFileName,
          persona_data: profile.persona_data,
          tone: profile.tone,
          gender: profile.gender,
          writingStyle: writingStyle,
        };
      } else {
        functionUrl =
          "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/rapid-action";
        requestBody = {
          sourceText: topic,
          intention,
          persona_data: profile.persona_data,
          tone: profile.tone,
          writingStyle,
          customWritingStyle: profile.custom_writing_style,
          gender: profile.gender,
        };
      }

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
      const data = await response.json();
      setGeneratedPost(data.post);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndReset = async () => {
    await handleSavePost(); // <--- INSEREZ VOTRE FONCTION DE SAUVEGARDE ICI
    console.log("Post enregistré !");

    setIsResetModalOpen(false);
    handleReset(); // On reset une fois sauvegardé
  };

  const handleSavePost = async () => {
    const contentToSave = generatedPost.trim();
    if (!contentToSave || !user) return;
    try {
      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({ content: contentToSave, user_id: user.id, status: "Idée" })
        .select()
        .single();
      if (error) throw error;
      alert("Idée sauvegardée !");
      handleReset();
      onPostSaved(newPost);
    } catch (err: any) {
      alert("Erreur de sauvegarde.");
      console.error(err);
    }
  };

  const handleSafeReset = () => {
    // Si c'est une erreur technique, on reset direct sans demander
    if (error) {
      handleReset();
      return;
    }

    // Sinon, on ouvre le popup de confirmation
    setIsResetModalOpen(true);
  };

  const handleReset = () => {
    setGeneratedPost("");
    setError(null);
    setTextAreaContent("");
    setUploadedFile(null);
    setSelectedFileName(null);
  };

  return (
    <main className="w-1/3 p-6 flex flex-col gap-6" id="tour-step-3">
      <h2 className="text-2xl font-bold text-gray-800 flex-shrink-0">
        Générateur de Posts
      </h2>

      {isGenerating || generatedPost || error ? (
        <div className="flex-1 bg-white rounded-lg border p-4 flex flex-col min-h-0">
          <h4 className="font-semibold text-gray-700 mb-2">
            Suggestion de l'IA :
          </h4>
          <div className="flex-grow pr-2 w-full">
            {isGenerating ? (
              <p className="text-center animate-pulse">
                Génération en cours...
              </p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <Textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
              />
            )}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <button
              onClick={handleSafeReset}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {error ? "Réessayer" : "Nouveau Post"}
            </button>
            {generatedPost && !isGenerating && (
              <button
                onClick={handleSavePost}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700"
              >
                Enregistrer l'idée
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full flex-shrink-0 bg-white p-4 space-y-4">
          <div className="w-full flex-shrink-0 bg-white p-4 rounded-lg border space-y-4">
            <DocumentInput
              onTextChange={setTextAreaContent}
              onFileChange={setUploadedFile}
              onFileSave={handleSaveFile}
            />
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                À partir d'une URL YouTube
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Collez l'URL YouTube..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="flex-1 p-2 border rounded-md text-sm"
                />
                <button
                  onClick={handleFetchTranscript}
                  disabled={isFetchingTranscript}
                  className="px-4 bg-red-600 text-white rounded-md"
                >
                  {isFetchingTranscript ? "..." : "Extraire"}
                </button>
              </div>
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style d'écriture :
              </label>
              <div className="flex flex-wrap gap-2">
                {WRITING_STYLE_OPTIONS
                  // On filtre la liste avant de l'afficher
                  .filter((style, index) => {
                    const isLastItem =
                      index === WRITING_STYLE_OPTIONS.length - 1;

                    // Si ce n'est pas le dernier élément, on l'affiche toujours
                    if (!isLastItem) return true;

                    // Si c'est le dernier, on l'affiche UNIQUEMENT si custom_writing_style existe
                    return profile?.custom_writing_style;
                  })
                  .map((style) => (
                    <button
                      key={style}
                      onClick={() => setWritingStyle(style)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        writingStyle === style
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
              </div>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intention :
              </label>
              <div className="flex flex-wrap gap-2">
                {["Par défaut", "Éduquer", "Inspirer", "Promouvoir"].map(
                  (int) => (
                    <button
                      key={int}
                      onClick={() => setIntention(int)}
                      className={`px-3 py-1 text-sm rounded-full ${
                        intention === int
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100"
                      }`}
                    >
                      {int}
                    </button>
                  )
                )}
              </div>
            </div> */}

            <button
              onClick={handleGeneratePost}
              disabled={
                isGenerating || (!textAreaContent.trim() && !uploadedFile)
              }
              className="w-full px-5 py-3 bg-blue-600 text-white font-semibold rounded-lg"
            >
              {isGenerating ? "Génération..." : "Transformer avec l'IA"}
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <DocumentList
              onGenerateClick={handleFullGenerationProcess}
              onDeleteDocument={handleDeleteDocument} // Assurez-vous d'avoir cette fonction
            />
          </div>
        </div>
      )}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* En-tête */}
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900">
                Attention, post non enregistré
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Si vous n’enregistrez pas le post, il sera perdu.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col gap-3 sm:flex-row-reverse sm:items-center border-t border-gray-100">
              {/* 1. Enregistrer */}
              <button
                onClick={handleSaveAndReset}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Enregistrer le post
              </button>

              {/* 2. Continuer sans enregistrer */}
              <button
                onClick={() => {
                  setIsResetModalOpen(false);
                  handleReset();
                }}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors"
              >
                Continuer sans enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
