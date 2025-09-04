import { format, isSameDay, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { Droppable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import PostCardCalendar from "../post/PostCardCalendar"; // Assurez-vous que le chemin est correct

// Définition des props que le composant attend
interface CalendarViewProps {
  viewMode: "month" | "week";
  onViewChange: (view: "month" | "week") => void;
  currentDate: Date;
  days: Date[];
  posts: Post[];
  onNavigate: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
  onPostClick: (post: Post) => void;
  headerText: string;
}

export default function CalendarView({
  viewMode,
  onViewChange,
  currentDate,
  days,
  posts,
  onNavigate,
  onGoToToday,
  onPostClick,
  headerText,
}: CalendarViewProps) {
  const getPostsForDay = (date: Date) =>
    posts.filter(
      (p) => p.scheduled_at && isSameDay(new Date(p.scheduled_at), date)
    );

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex-1 p-6 flex flex-col">
      {/* En-tête avec navigation et changement de vue */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg"
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
          <h1 className="text-2xl font-bold text-gray-800 min-w-[300px] text-center capitalize">
            {headerText}
          </h1>
          <button
            onClick={() => onNavigate("next")}
            className="p-2 hover:bg-gray-100 rounded-lg"
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
        <div className="flex items-center gap-4">
          <div className="p-1 bg-gray-200 rounded-lg flex text-sm font-semibold">
            <button
              onClick={() => onViewChange("month")}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === "month"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => onViewChange("week")}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Semaine
            </button>
          </div>
          <button
            onClick={onGoToToday}
            className="px-4 py-2 bg-white border border-gray-300 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* En-têtes des jours */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-500 text-sm py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille du calendrier */}
      <div
        className={`grid grid-cols-7 flex-grow border-r border-b border-gray-200 ${
          viewMode === "month" ? "grid-rows-5" : "grid-rows-1"
        }`}
      >
        {days.map((date, i) => (
          <Droppable droppableId={format(date, "yyyy-MM-dd")} key={i}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-2 border-t border-l border-gray-200 ${
                  isSameMonth(date, currentDate) ? "bg-white" : "bg-gray-50"
                } ${snapshot.isDraggingOver ? "bg-green-50" : ""}`}
              >
                <div
                  className={`text-sm text-right ${
                    isSameDay(date, new Date())
                      ? "text-blue-600 font-bold"
                      : isSameMonth(date, currentDate)
                      ? "text-gray-800"
                      : "text-gray-400"
                  }`}
                >
                  {format(date, "d")}
                </div>

                <div className="space-y-1 mt-1">
                  {getPostsForDay(date).map((post, index) => (
                    <PostCardCalendar
                      key={post.id}
                      post={post}
                      index={index}
                      onClick={onPostClick}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </div>
  );
}
