import { Droppable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import PostCard from "../post/PostCard";

interface CalendarSidebarProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export default function CalendarSidebar({
  posts,
  onPostClick,
}: CalendarSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">À planifier</h2>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
          {posts.length}
        </span>
      </div>

      <Droppable droppableId="unscheduled">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            // La hauteur minimale garantit que la zone est toujours visible
            className={`flex-grow space-y-3 min-h-[300px] p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
              snapshot.isDraggingOver
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                onClick={() => onPostClick(post)}
              />
            ))}
            {provided.placeholder}

            {/* Ce message s'affiche seulement si la liste est vide */}
            {posts.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-full text-center text-gray-400">
                <div>
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm">Glissez un post ici</p>
                  <p className="text-xs">ou créez-en un pour le planifier.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
