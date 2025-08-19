import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Post } from "../../types/Post";
import PostCardCalendar from "../post/PostCardCalendar";

// La fonction pour les couleurs est nécessaire ici, car les posts sont affichés ici.
const getStatusColor = (status: string) => {
  const colors = {
    Idée: "bg-gray-500 hover:bg-gray-600",
    "A faire": "bg-orange-500 hover:bg-orange-600",
    "En cours": "bg-yellow-500 hover:bg-yellow-600",
    "A publier": "bg-blue-500 hover:bg-blue-600",
    Publié: "bg-green-500 hover:bg-green-600",
  };
  return (
    colors[status as keyof typeof colors] || "bg-gray-500 hover:bg-gray-600"
  );
};

// Définition des props que le composant attend
interface CalendarViewProps {
  currentMonth: Date;
  posts: Post[];
  onNavigateMonth: (direction: "prev" | "next") => void;
  onGoToToday: () => void;
  onPostClick: (post: Post) => void;
}

export default function CalendarView({
  currentMonth,
  posts,
  onNavigateMonth,
  onGoToToday,
  onPostClick,
}: CalendarViewProps) {
  // La logique de génération et de filtrage est interne au composant
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

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="flex-1 p-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigateMonth("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {/* SVG flèche gauche */}
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

          <h1 className="text-2xl font-bold text-gray-800 min-w-[200px] text-center capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h1>

          <button
            onClick={() => onNavigateMonth("next")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {/* SVG flèche droite */}
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
          onClick={onGoToToday}
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
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, new Date());
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <Droppable droppableId={format(date, "yyyy-MM-dd")} key={i}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[140px] p-2 rounded-lg border transition-all duration-200 ${
                    isCurrentMonth
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-100"
                  } ${isToday ? "ring-2 ring-blue-500 border-blue-300" : ""} ${
                    isWeekend && isCurrentMonth ? "bg-blue-50" : ""
                  } ${
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
          );
        })}
      </div>
    </div>
  );
}
