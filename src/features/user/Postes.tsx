import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import Modal from "../../components/Modal";
import PostModalContent from "../../components/post/PostPopup";
import { PostStatus } from "../../constants/postStatus";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import PostColumn from "../../components/post/PostColumn";
import type { Post } from "../../types/Post";

const STATUSES = [
  PostStatus.Idee,
  PostStatus.Afaire,
  PostStatus.EnCours,
  PostStatus.APublier,
  PostStatus.Publie,
];

export default function Postes() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("posts")
      .select("id, content, last_status_date, status, scheduled_at")
      .eq("user_id", user.id)
      .order("last_status_date", { ascending: false });

    if (error) {
      console.error("Erreur lors du chargement des posts :", error.message);
    } else {
      setPosts(data || []);
    }
  };

  const getPostsByStatus = (status: string) =>
    posts.filter((post) => post.status === status);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) return;

    const postId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    const previousPosts = posts;

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              status: newStatus,
              last_status_date: new Date().toISOString(),
            }
          : post
      )
    );

    const { error } = await supabase
      .from("posts")
      .update({
        status: newStatus,
        last_status_date: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("user_id", user?.id);

    if (error) {
      console.error("Erreur lors du changement de statut :", error.message);
      setPosts(previousPosts);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Mes posts générés</h1>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {STATUSES.map((status) => (
            <PostColumn
              key={status}
              status={status}
              posts={getPostsByStatus(status)}
              onClickPost={(post) => setSelectedPost(post)}
            />
          ))}
        </div>
      </DragDropContext>

      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
        {selectedPost && (
          <PostModalContent
            post={selectedPost}
            userId={user?.id || ""}
            onClose={() => setSelectedPost(null)}
            onUpdate={fetchPosts}
          />
        )}
      </Modal>
    </div>
  );
}
