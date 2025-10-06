import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { FiFileText, FiTrash2 } from "react-icons/fi";

interface DocumentInfo {
  file_name: string;
}

export default function DocumentList() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("file_name")
          .eq("user_id", user.id);

        if (error) throw error;

        const uniqueDocuments = Array.from(
          new Map(data.map((item) => [item.file_name, item])).values()
        );

        setDocuments(uniqueDocuments);
      } catch (error) {
        console.error("Erreur lors de la récupération des documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  return (
    <div className="bg-white p-4 rounded-lg border h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">
        Documents
      </h3>
      {loading ? (
        <p className="text-gray-500">Chargement des documents...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun document sauvegardé.</p>
      ) : (
        <div className="overflow-y-auto flex-grow">
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.file_name} // On utilise le nom du fichier comme clé
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FiFileText className="text-gray-500 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {doc.file_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Générer un post"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Supprimer"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
