import { useAuth } from "../../hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const { user } = useAuth();
  const [postCount, setPostCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchPostCount = async () => {
      if (!user) {
        setPostCount(null);
        return;
      }
      const { count, error } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur lors du comptage des posts :", error.message);
        setPostCount(null);
      } else {
        setPostCount(count || 0);
      }
    };

    fetchPostCount();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Tableau de bord</h1>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bloc nombre de posts */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <p className="text-gray-600 mb-2">Nombre de posts créés</p>
          <div className="inline-block bg-blue-600 text-white text-2xl font-bold rounded px-6 py-3">
            {postCount !== null ? postCount : "…"}
          </div>
        </div>

        {/* Autre bloc d’info */}
      </div>
    </div>
  );
}
