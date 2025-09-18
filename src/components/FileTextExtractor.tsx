import React, { useState } from "react";
import { extractTextFromFile } from "../utils/extractTextFromFile";
import { supabase } from "../lib/supabase";

type FileTextExtractorProps = {
  onExtract?: (text: string) => void;
};

// Icônes SVG pour un meilleur feedback visuel
const UploadIcon = () => (
  <svg
    className="w-10 h-10 mb-4 text-gray-500"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 20 16"
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg
    className="w-10 h-10 text-green-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);

const ErrorIcon = () => (
  <svg
    className="w-10 h-10 text-red-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);

export default function FileTextExtractor({
  onExtract,
}: FileTextExtractorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setError(null);
    setFileName(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const sourceId = crypto.randomUUID();

      const text = await extractTextFromFile(file);
      setFileName(file.name);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous devez être connecté.");

      const response = await fetch(
        "https://cifoadnztfjbdeyycrov.supabase.co/functions/v1/embed-document",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            documentText: text,
            sourceId: sourceId,
            user_id: session.user.id,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "L'embedding a échoué.");
      }

      setSuccessMessage(responseData.message || `${file.name} a été traité.`);

      if (onExtract) onExtract(text);
    } catch (err) {
      setError(
        (err as Error).message || "Erreur inconnue lors de l'extraction"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragEvents = (
    e: React.DragEvent<HTMLLabelElement>,
    isEntering: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelect(file || null);
  };

  const reset = () => {
    setError(null);
    setFileName(null);
    const input = document.getElementById(
      "file-input-dnd"
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  // Détermine la couleur de la bordure en fonction de l'état
  const getBorderColor = () => {
    if (isDragging) return "border-blue-500";
    if (error) return "border-red-500";
    if (fileName) return "border-green-500";
    return "border-gray-300";
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <label
        htmlFor="file-input-dnd"
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 ${getBorderColor()} border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-300`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          {loading ? (
            <>
              <svg
                aria-hidden="true"
                className="w-8 h-8 text-gray-200 animate-spin fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <p className="mt-4 text-lg font-semibold text-gray-700">
                Extraction en cours...
              </p>
            </>
          ) : error ? (
            <>
              <ErrorIcon />
              <p className="mt-4 text-lg font-semibold text-red-600">
                Erreur d'extraction
              </p>
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={reset}
                type="button"
                className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Réessayer
              </button>
            </>
          ) : successMessage ? (
            <>
              <SuccessIcon />
              <p className="mt-4 text-lg font-semibold text-green-600">
                Document traité !
              </p>
              <p className="text-sm text-gray-500">{successMessage}</p>
              <button
                onClick={reset}
                type="button"
                className="mt-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Uploader un autre fichier
              </button>
            </>
          ) : fileName ? (
            <>
              <SuccessIcon />
              <p className="mt-4 text-lg font-semibold text-green-600">
                Fichier extrait !
              </p>
              <p className="text-sm text-gray-500">{fileName}</p>
              <button
                onClick={reset}
                type="button"
                className="mt-4 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Uploader un autre fichier
              </button>
            </>
          ) : (
            <>
              <UploadIcon />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Cliquez pour uploader</span> ou
                glissez-déposez
              </p>
              <p className="text-xs text-gray-500">.txt, .pdf, ou .docx</p>
            </>
          )}
        </div>
        <input
          id="file-input-dnd"
          type="file"
          className="hidden"
          accept=".txt,.pdf,.docx"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
