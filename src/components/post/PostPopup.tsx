import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import type { Post } from "../../types/Post";
import { PostStatus } from "../../constants/postStatus";
import { differenceInDays, format } from "date-fns";

type Props = {
  post: Post;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
};

// Couleurs et icônes par statut
const getStatusStyle = (status: string) => {
  const styles = {
    Idée: { bg: "bg-gray-100", text: "text-gray-700", icon: "💡" },
    "À faire": { bg: "bg-blue-100", text: "text-blue-700", icon: "📝" },
    "En cours": { bg: "bg-yellow-100", text: "text-yellow-700", icon: "⚡" },
    "À publier": { bg: "bg-orange-100", text: "text-orange-700", icon: "🚀" },
    Publié: { bg: "bg-green-100", text: "text-green-700", icon: "✅" },
  };
  return styles[status as keyof typeof styles] || styles["Idée"];
};

const getThemeColor = (mainTheme: string) => {
  const colors = {
    Actionnable: "bg-blue-100 text-blue-800",
    Inspirationnel: "bg-purple-100 text-purple-800",
    Anthropologique: "bg-orange-100 text-orange-800",
    Analytique: "bg-green-100 text-green-800",
  };
  return (
    colors[mainTheme as keyof typeof colors] || "bg-gray-100 text-gray-800"
  );
};

const getLifecycleInfo = (post: Post): { color: string; text: string } => {
  const postAgeInDays = differenceInDays(
    new Date(),
    new Date(post.last_status_date)
  );
  if (postAgeInDays <= 14) return { color: "bg-green-500", text: "Nouveau" };
  if (postAgeInDays <= 29) return { color: "bg-orange-500", text: "À risque" };
  return { color: "bg-red-500", text: "Inactif" };
};

export default function PostModalContent({
  post,
  userId,
  onClose,
  onUpdate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [status, setStatus] = useState(post.status);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusStyle = getStatusStyle(status);
  const lifecycle = getLifecycleInfo(post);

  useEffect(() => {
    setEditedContent(post.content);
    setStatus(post.status);
  }, [post]);

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from("posts")
      .update({ status: newStatus, last_status_date: new Date().toISOString() })
      .eq("id", post.id);
    if (error) {
      alert("Erreur lors du changement de statut.");
    } else {
      onUpdate();
      onClose();
    }
    setIsLoading(false);
  };

  const updatePost = async (newContent: string) => {
    setIsLoading(true);
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("posts")
      .update({ content: newContent, last_status_date: now })
      .eq("id", post.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Erreur lors de la mise à jour :", error.message);
    } else {
      onUpdate();
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    if (editedContent.trim()) {
      updatePost(editedContent);
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Voulez-vous vraiment supprimer ce post ?")) return;

    setIsLoading(true);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Erreur lors de la suppression :", error.message);
      setIsLoading(false);
    } else {
      onUpdate();
      onClose();
    }
  };

  const handleCancel = () => {
    setEditedContent(post.content);
    setEditing(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie :", err);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-2xl mx-auto">
      {/* En-tête avec statut */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{statusStyle.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Détails du post
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
            >
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {post.main_theme && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getThemeColor(
                  post.main_theme
                )}`}
              >
                {post.main_theme}
              </span>
            )}
            {post.sub_theme && (
              <span className="text-xs font-medium text-gray-500">
                {post.sub_theme}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full ${lifecycle.color}`}></div>
          <span>{lifecycle.text}</span>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden">
        {editing ? (
          <div className="h-full flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">
              Contenu du post
            </label>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 w-full border border-gray-300 rounded-lg p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Écrivez votre contenu ici..."
              disabled={isLoading}
            />
            <div className="text-xs text-gray-500 mt-2">
              {editedContent.length} caractères
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="bg-gray-50 rounded-lg p-6 h-full">
              <div className="whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
                {post.content}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pied de page */}
      {lifecycle.text !== "Inactif" ? (
        <>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Modifié le{" "}
                    {new Date(post.last_status_date).toLocaleDateString(
                      "fr-FR",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                  {post.scheduled_at && (
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Publication prévue le{" "}
                      {new Date(post.scheduled_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                      disabled={isLoading || !editedContent.trim()}
                    >
                      {isLoading ? (
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      Enregistrer
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2 ${
                        copied
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      disabled={isLoading}
                    >
                      {copied ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Copié !
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copier
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => handleStatusChange(PostStatus.Afaire)}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Relancer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
