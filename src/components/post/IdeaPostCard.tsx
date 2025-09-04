import React from "react";
import type { Post } from "../../types/Post";
import { differenceInDays, parseISO } from "date-fns";

// Fonction pour associer une couleur à chaque grand thème
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

const getLifecycleVignette = (post: Post) => {
  // On calcule l'âge de l'idée depuis sa dernière modification
  const postAgeInDays = differenceInDays(
    new Date(),
    new Date(post.last_status_date)
  );

  if (postAgeInDays <= 14) {
    return "bg-green-500"; // 🟢 Vert (Actif)
  }
  if (postAgeInDays <= 29) {
    return "bg-orange-500"; // 🟠 Orange (À risque)
  }
  return "bg-red-500"; // 🔴 Rouge (Inactif / À supprimer)
};

interface IdeaPostCardProps {
  post: Post;
  onClick: (post: Post) => void;
  isNew?: boolean;
}

export default function IdeaPostCard({
  post,
  onClick,
  isNew = false,
}: IdeaPostCardProps) {
  return (
    <div
      onClick={() => onClick(post)}
      // ▼▼▼ 2. UTILISER LA PROP 'isNew' POUR CHANGER LE STYLE ▼▼▼
      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-300 relative ${
        isNew
          ? "bg-slate-100 border-blue-500 shadow-md"
          : "bg-white border-gray-200 hover:border-blue-500"
      }`}
    >
      <div
        className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getLifecycleVignette(
          post
        )}`}
      ></div>

      <div className="flex items-center gap-2 mb-2">
        {post.main_theme && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getThemeColor(
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
      <p className="text-gray-700 text-sm line-clamp-3">{post.content}</p>
    </div>
  );
}
