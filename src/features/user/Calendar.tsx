import { useEffect, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { type DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import { PostStatus } from "../../constants/postStatus";
import Modal from "../../components/Modal";
import PostPopup from "../../components/post/PostPopup";
import CalendarSideBar from "../../components/calendar/CalendarSideBar";
import CalendarView from "../../components/calendar/CalendarView";

export default function Calendrier() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id, content, status, last_status_date, scheduled_at, main_theme, sub_theme"
      )
      .eq("user_id", user.id);

    if (error) console.error("Erreur :", error);
    else setPosts(data || []);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const postId = parseInt(draggableId);
    const previousPosts = posts;

    // Si on remet dans "À planifier"
    if (destination.droppableId === "unscheduled") {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, scheduled_at: null } : post
        )
      );

      const { error } = await supabase
        .from("posts")
        .update({ scheduled_at: null })
        .eq("id", postId)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Erreur :", error.message);
        setPosts(previousPosts);
      }
    } else {
      // Si on programme sur une date
      const dropDate = destination.droppableId;

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, scheduled_at: dropDate } : post
        )
      );

      const { error } = await supabase
        .from("posts")
        .update({ scheduled_at: dropDate })
        .eq("id", postId)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Erreur :", error.message);
        setPosts(previousPosts);
      }
    }
  };

  const generateCalendar = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    const days = [];

    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const getPostsForDay = (date: Date) =>
    posts.filter(
      (p) => p.scheduled_at && isSameDay(new Date(p.scheduled_at), date)
    );

  const unscheduled = posts.filter(
    (p) => p.status === PostStatus.EnCours && !p.scheduled_at
  );

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const test = () => {
    console.log("a");
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-screen bg-gray-50">
          <CalendarSideBar
            posts={unscheduled}
            onPostClick={setSelectedPost}
          ></CalendarSideBar>

          {/* Calendar */}
          <CalendarView
            currentMonth={currentMonth}
            posts={posts}
            onNavigateMonth={navigateMonth}
            onGoToToday={goToToday}
            onPostClick={handlePostClick}
          />
        </div>
      </DragDropContext>

      {/* Modal pour afficher les détails du post */}
      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)}>
        {selectedPost && (
          <PostPopup
            post={selectedPost}
            userId={user?.id || ""}
            onClose={() => setSelectedPost(null)}
            onUpdate={fetchPosts}
          />
        )}
      </Modal>
    </>
  );
}
