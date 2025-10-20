// components/DocumentInput.tsx

import React, { useState } from "react";
import { useFileDrop } from "../hooks/useFileDrop"; // Utilise le hook simplifié

type DocumentInputProps = {
  onTextChange: (text: string) => void;
  onFileChange: (file: File | null) => void;
  onFileSave: (file: File) => Promise<boolean>;
};

// Mettre vos icônes ici (UploadIcon, etc.)

export default function DocumentInput({
  onTextChange,
  onFileChange,
  onFileSave,
}: DocumentInputProps) {
  const [typedText, setTypedText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "pending" | "saving" | "saved" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileValidation = (selectedFile: File | null) => {
    if (!selectedFile) return;

    // 1. On vérifie la taille
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setStatus("error");
      setStatusMessage(
        `Fichier trop volumineux (max: ${MAX_FILE_SIZE_MB} Mo).`
      );
      setFile(null);
      onFileChange(null);
      return;
    }

    // 2. Si la taille est bonne, on continue
    setFile(selectedFile);
    onFileChange(selectedFile);
    setStatus("pending");
    setStatusMessage("");
  };

  const { isDragging, ...dragHandlers } = useFileDrop({
    onFileDrop: (droppedFile) => {
      handleFileValidation(droppedFile);
    },
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTypedText(newText);
    onTextChange(newText);
  };

  const handleConfirmSave = async () => {
    if (!file) return;
    setStatus("saving");
    setStatusMessage("Sauvegarde en cours...");
    const success = await onFileSave(file);
    if (success) {
      setStatus("saved");
      setStatusMessage("Fichier sauvegardé avec succès !");
    } else {
      setStatus("error");
      setStatusMessage("Erreur lors de la sauvegarde.");
    }
  };

  const handleCancelFile = () => {
    setFile(null);
    onFileChange(null);
    setStatus("idle");
  };

  return (
    <div
      {...dragHandlers}
      className="relative w-full border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all duration-300"
    >
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-80 flex items-center justify-center rounded-lg z-10">
          <p className="font-semibold text-blue-600">Déposez un fichier</p>
        </div>
      )}

      {/* --- Section pour le fichier uploadé --- */}
      {file && (
        <div className="bg-gray-100 p-3 rounded-lg mb-4">
          <p className="font-semibold text-gray-800">
            Fichier ajouté : {file.name}
          </p>

          {status === "pending" && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Voulez-vous sauvegarder ce fichier ?
              </p>
              <button
                onClick={handleConfirmSave}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm mt-1 mr-2 hover:bg-green-600"
              >
                Oui, sauvegarder
              </button>
              <button
                onClick={handleCancelFile}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm mt-1 hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          )}

          {status === "saving" && (
            <p className="text-sm text-blue-600 mt-2">{statusMessage}</p>
          )}
          {status === "saved" && (
            <p className="text-sm text-green-600 mt-2">{statusMessage}</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600 mt-2">{statusMessage}</p>
          )}
        </div>
      )}

      {/* --- Section pour l'écriture de texte --- */}
      <textarea
        className="w-full h-full p-2 border border-gray-300 rounded-lg resize-none min-h-[100px] focus:ring-1 focus:ring-blue-500"
        placeholder="Uploadez un fichier ou copier coller votre texte ici..."
        value={typedText}
        onChange={handleTextChange}
      />
      <div className="text-center mt-2">
        <label
          htmlFor="file-input-hidden"
          className="text-sm text-blue-600 hover:underline cursor-pointer"
        >
          Uploader un document
        </label>
        <input
          id="file-input-hidden"
          type="file"
          className="hidden"
          onChange={dragHandlers.handleFileChange}
        />
      </div>
    </div>
  );
}
