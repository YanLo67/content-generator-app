import { useEffect, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { type DropResult } from "@hello-pangea/dnd";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import { PostStatus } from "../../constants/postStatus";

export default function Calendrier() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("posts")
      .select("id, content, status, last_status_date, scheduled_at")
      .eq("user_id", user.id);

    if (error) console.error("Erreur :", error);
    else setPosts(data || []);
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

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">À planifier</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {unscheduled.length}
            </span>
          </div>

          <Droppable droppableId="unscheduled">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[300px] p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
                  snapshot.isDraggingOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                {unscheduled.map((post, index) => (
                  <Draggable
                    key={post.id.toString()}
                    draggableId={post.id.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-4 bg-white rounded-lg border border-gray-200 text-sm cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
                          snapshot.isDragging
                            ? "shadow-xl rotate-3 scale-105 bg-white z-50"
                            : "shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div
                          className="line-clamp-3 text-gray-700"
                          title={post.content}
                        >
                          {post.content}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {unscheduled.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-sm">Aucun post à planifier</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>

        {/* Calendar */}
        <div className="flex-1 p-6">
          {/* En-tête avec navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <h1 className="text-2xl font-bold text-gray-800 min-w-[200px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: fr })}
              </h1>

              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              Aujourd'hui
            </button>
          </div>

          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-3 mb-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 py-3"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-3">
            {generateCalendar().map((date, i) => {
              const postsForDay = getPostsForDay(date);
              const isCurrentMonth =
                date.getMonth() === currentMonth.getMonth();
              const isToday = isSameDay(date, new Date());
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <Droppable droppableId={date.toISOString()} key={i}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[140px] p-2 rounded-lg border transition-all duration-200 ${
                        isCurrentMonth
                          ? "bg-white border-gray-200"
                          : "bg-gray-50 border-gray-100"
                      } ${
                        isToday ? "ring-2 ring-blue-500 border-blue-300" : ""
                      } ${isWeekend && isCurrentMonth ? "bg-blue-50" : ""} ${
                        snapshot.isDraggingOver
                          ? "bg-green-50 border-green-300 border-2"
                          : ""
                      }`}
                    >
                      <div
                        className={`text-sm font-medium mb-2 ${
                          isCurrentMonth
                            ? isToday
                              ? "text-blue-600 font-bold"
                              : "text-gray-700"
                            : "text-gray-400"
                        }`}
                      >
                        {format(date, "d")}
                      </div>

                      <div className="space-y-1">
                        {postsForDay.map((post, index) => (
                          <Draggable
                            key={post.id.toString()}
                            draggableId={post.id.toString()}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-blue-500 text-white text-xs p-2 rounded cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                  snapshot.isDragging
                                    ? "shadow-xl rotate-2 scale-105 z-50"
                                    : "hover:shadow-md hover:bg-blue-600"
                                }`}
                                title={post.content}
                              >
                                <div className="line-clamp-2 font-medium">
                                  {post.content}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
