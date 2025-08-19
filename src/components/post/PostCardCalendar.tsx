import { Draggable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";

interface PostCardCalendarProps {
  post: Post;
  index: number;
  onClick: (post: Post) => void;
}

// ▼▼ 1. Une fonction de style plus complète ▼▼
const getStatusStyles = (status: string) => {
  const styles = {
    Idée: {
      bg: "bg-gray-100",
      border: "border-gray-400",
      text: "text-gray-600",
      dot: "bg-gray-400",
    },
    "A faire": {
      bg: "bg-orange-50",
      border: "border-orange-400",
      text: "text-orange-700",
      dot: "bg-orange-400",
    },
    "En cours": {
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      text: "text-yellow-700",
      dot: "bg-yellow-400",
    },
    "A publier": {
      bg: "bg-blue-50",
      border: "border-blue-400",
      text: "text-blue-700",
      dot: "bg-blue-400",
    },
    Publié: {
      bg: "bg-green-50",
      border: "border-green-400",
      text: "text-green-700",
      dot: "bg-green-400",
    },
  };
  return styles[status as keyof typeof styles] || styles["Idée"];
};

export default function PostCardCalendar({
  post,
  index,
  onClick,
}: PostCardCalendarProps) {
  const styles = getStatusStyles(post.status);

  return (
    <Draggable draggableId={post.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(post)}
          title={post.content}
          // ▼▼ 2. Utilisation des nouveaux styles ▼▼
          className={`p-2.5 rounded-md cursor-grab active:cursor-grabbing transition-all duration-200 flex flex-col gap-2 border-l-4 shadow-sm hover:shadow-md ${
            styles.bg
          } ${styles.border} ${
            snapshot.isDragging ? "shadow-lg rotate-2 scale-105 z-50" : ""
          }`}
        >
          {/* ▼▼ 3. Un affichage de statut plus subtil ▼▼ */}
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${styles.dot}`}></span>
            <span
              className={`font-semibold uppercase text-[10px] ${styles.text}`}
            >
              {post.status}
            </span>
          </div>

          {/* On affiche le contenu du post avec un texte bien lisible */}
          <div className="line-clamp-2 font-medium text-gray-800 text-xs">
            {post.content}
          </div>
        </div>
      )}
    </Draggable>
  );
}
