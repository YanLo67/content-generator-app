import { Droppable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import PostCard from "./PostCard";

type Props = {
  status: string;
  posts: Post[];
  onClickPost: (post: Post) => void;
};

// Couleurs par statut pour une meilleure identification visuelle
const getStatusColor = (status: string) => {
  const colors = {
    Idée: "bg-gray-50 border-gray-200",
    "À faire": "bg-blue-50 border-blue-200",
    "En cours": "bg-yellow-50 border-yellow-200",
    "À publier": "bg-orange-50 border-orange-200",
    Publié: "bg-green-50 border-green-200",
  };
  return colors[status as keyof typeof colors] || "bg-gray-50 border-gray-200";
};

// Icônes par statut
const getStatusIcon = (status: string) => {
  const icons = {
    Idée: "💡",
    "À faire": "📝",
    "En cours": "⚡",
    "À publier": "🚀",
    Publié: "✅",
  };
  return icons[status as keyof typeof icons] || "📄";
};

export default function PostKanban({ status, posts, onClickPost }: Props) {
  const colorClasses = getStatusColor(status);
  const icon = getStatusIcon(status);

  return (
    <Droppable droppableId={status}>
      {(provided, snapshot) => (
        <div
          className={`rounded-xl border-2 p-5 min-h-[400px] flex flex-col shadow-sm hover:shadow-md relative ${
            snapshot.isDraggingOver
              ? "border-blue-400 bg-blue-100 shadow-lg"
              : "transition-all duration-200"
          } ${colorClasses}`}
        >
          {/* En-tête de la colonne */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              <h2 className="text-lg font-semibold text-gray-800">{status}</h2>
            </div>
            <span className="bg-white bg-opacity-70 text-gray-600 text-sm font-medium px-2.5 py-1 rounded-full border">
              {posts.length}
            </span>
          </div>

          {/* Container pour les posts avec ref et props */}
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3 flex-1"
          >
            {posts.map((post, index) => (
              <PostCard
                key={post.id.toString()}
                post={post}
                index={index}
                onClick={onClickPost}
              />
            ))}

            {/* Zone de drop vide */}
            {posts.length === 0 && (
              <div className="flex-1 flex items-center justify-center py-12 text-gray-400">
                <div className="text-center">
                  <div className="text-3xl mb-2 opacity-50">{icon}</div>
                  <p className="text-sm">Aucun post</p>
                </div>
              </div>
            )}

            {provided.placeholder}
          </div>

          {/* Indicateur de zone de drop active */}
          {snapshot.isDraggingOver && (
            <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 bg-opacity-50 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Déposer ici
              </div>
            </div>
          )}
        </div>
      )}
    </Droppable>
  );
}
