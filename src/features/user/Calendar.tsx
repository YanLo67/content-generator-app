import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  addWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { type DropResult } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import { PostStatus } from "../../constants/postStatus";
import Modal from "../../components/Modal";
import PostPopup from "../../components/post/PostPopup";
import CalendarSideBar from "../../components/calendar/CalendarSideBar";
import CalendarView from "../../components/calendar/CalendarView";

export default function Calendrier() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
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

  const onDragEnd = async (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const postId = parseInt(draggableId);
    const newDate =
      destination.droppableId === "unscheduled"
        ? null
        : destination.droppableId;

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId ? { ...post, scheduled_at: newDate } : post
      )
    );

    const { error } = await supabase
      .from("posts")
      .update({ scheduled_at: newDate })
      .eq("id", postId);

    if (error) {
      console.error("Erreur :", error.message);
      // Optionnel : restaurer l'état précédent en cas d'erreur
      fetchPosts();
    }
  };

  // --- Logique de génération et navigation ---

  const generateMonthDays = (date: Date) => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  };

  const generateWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    return days;
  };

  const navigate = (direction: "prev" | "next") => {
    const handler = direction === "next" ? 1 : -1;
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, handler));
    } else {
      setCurrentDate((prev) => addWeeks(prev, handler));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getHeaderText = () => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      if (start.getMonth() === end.getMonth()) {
        return `Semaine du ${format(start, "d")} au ${format(
          end,
          "d MMMM yyyy",
          { locale: fr }
        )}`;
      }
      return `Semaine du ${format(start, "d MMM")} au ${format(
        end,
        "d MMM yyyy",
        { locale: fr }
      )}`;
    }
  };

  const daysToDisplay =
    viewMode === "month"
      ? generateMonthDays(currentDate)
      : generateWeekDays(currentDate);
  const unscheduled = posts.filter(
    (p) => p.status === PostStatus.EnCours && !p.scheduled_at
  );

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-screen bg-gray-50">
          <div id="tour-step-6" className="w-80 h-full">
            <CalendarSideBar
              posts={unscheduled}
              onPostClick={setSelectedPost}
            />
          </div>

          <div id="tour-step-7" className="flex-1 flex flex-col min-h-0">
            <CalendarView
              viewMode={viewMode}
              onViewChange={setViewMode}
              currentDate={currentDate}
              days={daysToDisplay}
              posts={posts}
              onNavigate={navigate}
              onGoToToday={goToToday}
              onPostClick={setSelectedPost}
              headerText={getHeaderText()}
            />
          </div>
        </div>
      </DragDropContext>

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
