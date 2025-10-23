import { Draggable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = {
  post: Post;
  index: number;
  onClick: (post: Post) => void;
};

// Fonction pour définir le style de la pilule de statut
const getStatusStyles = (status: string) => {
  const styles = {
    Idée: { bg: "bg-gray-100", text: "text-gray-600" },
    "À faire": { bg: "bg-blue-100", text: "text-blue-600" },
    "En cours": { bg: "bg-yellow-100", text: "text-yellow-600" },
    "À publier": { bg: "bg-orange-100", text: "text-orange-600" },
    Publié: { bg: "bg-green-100", text: "text-green-700" },
  };
  return styles[status as keyof typeof styles] || styles["Idée"];
};

export default function PostCard({ post, index, onClick }: Props) {
  const statusStyle = getStatusStyles(post.status);

  return (
    <Draggable draggableId={post.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(post)}
          className={`bg-white p-3 rounded-md cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col justify-between ${
            snapshot.isDragging
              ? "shadow-xl scale-105"
              : "shadow-sm hover:shadow-lg"
          }`}
        >
          {/* Contenu du post plus petit */}
          <div className="text-xs font-medium text-gray-700 line-clamp-2">
            {post.content}
          </div>

          {/* Pied de page plus compact */}
          <div className="flex items-center justify-between mt-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}
            >
              {post.status}
            </span>
            <div className="text-gray-400 text-[10px]">
              {format(new Date(post.last_status_date), "d MMM", {
                locale: fr,
              })}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
