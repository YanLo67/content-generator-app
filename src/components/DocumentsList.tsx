import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { FiTrash2 } from "react-icons/fi";

interface DocumentInfo {
  file_name: string;
}

interface DocumentListProps {
  onDeleteDocument: (fileName: string) => void;
  onGenerateClick: (fileName: string) => void;
}

export default function DocumentList({
  onGenerateClick,
  onDeleteDocument,
}: DocumentListProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
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
          new Map(data.map((item: any) => [item.file_name, item])).values()
        ) as DocumentInfo[];

        setDocuments(uniqueDocuments);
      } catch (error) {
        console.error("Erreur de récupération des documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [user]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fileName = e.target.value;
    setSelectedFile(fileName);
  };

  return (
    <div className="bg-white p-4 rounded-lg border w-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Documents</h3>
      {loading ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : documents.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun document sauvegardé.</p>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedFile}
            onChange={handleSelectChange}
            className="flex-1 p-2 border border-gray-300 rounded-md text-sm bg-white w-full"
          >
            <option value="" disabled>
              -- Choisissez un document --
            </option>
            {documents.map((doc) => (
              <option key={doc.file_name} value={doc.file_name}>
                {doc.file_name}
              </option>
            ))}
          </select>
          <button
            onClick={() => onGenerateClick(selectedFile)}
            disabled={!selectedFile}
            className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
            title="Utiliser ce document pour générer un post"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
            onClick={() => {
              if (selectedFile) {
                onDeleteDocument(selectedFile);
                setSelectedFile("");
              }
            }}
            disabled={!selectedFile}
            className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
            title="Supprimer le document sélectionné"
          >
            <FiTrash2 />
          </button>
        </div>
      )}
    </div>
  );
}
