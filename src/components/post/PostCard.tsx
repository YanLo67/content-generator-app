import { Draggable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";

type Props = {
  post: Post;
  index: number;
  onClick: (post: Post) => void;
};

export default function PostCard({ post, index, onClick }: Props) {
  return (
    <Draggable draggableId={post.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(post)}
          className="bg-white p-3 rounded shadow cursor-pointer hover:bg-gray-200 transition text-sm"
        >
          <div className="truncate">{post.content}</div>
          <div className="text-gray-400 text-xs mt-1">
            {new Date(post.last_status_date).toLocaleString()}
          </div>
        </div>
      )}
    </Draggable>
  );
}
