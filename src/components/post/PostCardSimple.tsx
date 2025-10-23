import type { Post } from "../../types/Post";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = {
  post: Post;
  onClick: (post: Post) => void;
};

// Fonction pour définir le style de la pilule de statut
const getStatusStyles = (status: string) => {
  const styles = {
    Idée: { bg: "bg-gray-100", text: "text-gray-700" },
    "À faire": { bg: "bg-blue-100", text: "text-blue-700" },
    "En cours": { bg: "bg-yellow-100", text: "text-yellow-700" },
    "À publier": { bg: "bg-orange-100", text: "text-orange-700" },
    Publié: { bg: "bg-green-100", text: "text-green-700" },
  };
  return styles[status as keyof typeof styles] || styles["Idée"];
};

export default function PostCardSimple({ post, onClick }: Props) {
  const statusStyle = getStatusStyles(post.status);

  return (
    <div
      onClick={() => onClick(post)}
      className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-32"
    >
      {/* Contenu du post */}
      <div className="text-sm font-medium text-gray-800 line-clamp-3">
        {post.content}
      </div>

      {/* Pied de page de la carte avec statut et date */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}
        >
          {post.status}
        </span>
        <div className="text-gray-400 text-xs">
          {format(new Date(post.last_status_date), "d MMM yyyy", {
            locale: fr,
          })}
        </div>
      </div>
    </div>
  );
}
