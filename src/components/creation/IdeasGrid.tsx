import React, { useState, useMemo } from "react";
import type { Post } from "../../types/Post";
import IdeaPostCard from "../post/IdeaPostCard";
import { differenceInDays } from "date-fns";

const getLifecycleStatus = (post: Post): "Vert" | "Orange" | "Rouge" => {
  const postAgeInDays = differenceInDays(
    new Date(),
    new Date(post.last_status_date)
  );
  if (postAgeInDays <= 14) return "Vert";
  if (postAgeInDays <= 29) return "Orange";
  return "Rouge";
};

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

interface IdeasGridProps {
  posts: Post[];
  newPostIds: Set<number>;
  onPostSelect: (post: Post) => void;
  onBulkGenerate: () => void;
  isBulkGenerating: boolean;
}

export default function IdeasGrid({
  posts,
  newPostIds,
  onPostSelect,
  onBulkGenerate,
  isBulkGenerating,
}: IdeasGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
        const dateA = new Date(a.last_status_date).getTime();
        const dateB = new Date(b.last_status_date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [posts, searchTerm, statusFilter, sortOrder]);

  return (
    <aside className="w-2/3 border-r border-gray-200 p-4 flex flex-col bg-white">
      <div className="flex-shrink-0 mb-4 sticky top-0 bg-white/80 backdrop-blur-sm py-2 z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Mes Idées de posts
          </h3>
          <button
            onClick={onBulkGenerate}
            disabled={isBulkGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <SparklesIcon />
            {isBulkGenerating ? "Génération..." : "Générer 4 idées"}
          </button>
        </div>

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
        <div className="flex items-center justify-end text-sm">
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
              onClick={() => onPostSelect(post)}
              isNew={newPostIds.has(post.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
