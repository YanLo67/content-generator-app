import React from "react";
import type { Post } from "../../types/Post";

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

interface IdeaPostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

export default function IdeaPostCard({ post, onClick }: IdeaPostCardProps) {
  return (
    <div
      onClick={() => onClick(post)}
      className="p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-500 transition-all"
    >
      {/* Affichage des thèmes */}
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

      {/* Aperçu du contenu du post */}
      <p className="text-gray-700 text-sm line-clamp-3">{post.content}</p>
    </div>
  );
}
