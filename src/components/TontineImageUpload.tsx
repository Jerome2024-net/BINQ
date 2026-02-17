"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, X, Upload, Loader2, ImagePlus } from "lucide-react";

interface TontineImageUploadProps {
  tontineId?: string;
  currentImage?: string;
  currentEmoji?: string;
  onUploadComplete: (url: string) => void;
  /** Callback quand un fichier est sélectionné (mode inline) */
  onFileSelect?: (file: File | null) => void;
  /** Mode inline pour le formulaire de création (pas de modal, juste le drop zone) */
  inline?: boolean;
}

export default function TontineImageUpload({
  tontineId,
  currentImage,
  currentEmoji = "💰",
  onUploadComplete,
  onFileSelect,
  inline = false,
}: TontineImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Notifier le parent du fichier sélectionné
    if (onFileSelect) {
      onFileSelect(selectedFile);
    }
  }, [onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleUpload = async () => {
    if (!file || !tontineId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tontineId", tontineId);
      if (currentImage) formData.append("oldImage", currentImage);

      const res = await fetch("/api/tontine/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      onUploadComplete(data.url);
      handleClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur upload image tontine:", error);
      alert(`Erreur lors de l'envoi : ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreview(null);
    setFile(null);
    setDragOver(false);
  };

  // Expose le fichier pour un upload externe (mode création)
  const getFile = () => file;

  // ============ MODE INLINE (formulaire de création) ============
  if (inline) {
    return (
      <div className="space-y-3">
        {preview ? (
          <div className="relative">
            <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-primary-200">
              <Image
                src={preview}
                alt="Aperçu"
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                onUploadComplete("");
                if (onFileSelect) onFileSelect(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <p className="text-xs text-gray-500 mt-1.5 text-center">
              La photo sera uploadée à la création
            </p>
          </div>
        ) : (
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
              ${dragOver
                ? "border-primary-400 bg-primary-50"
                : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
              }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary-50 flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Ajouter une photo de profil
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPG, PNG ou WebP • Max 5 Mo • Optionnel
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // ============ MODE MODAL (page détail — overlay sur le banner) ============
  return (
    <>
      {/* Trigger button — overlay sur l'icône tontine */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
        aria-label="Changer la photo de la tontine"
      >
        <Camera className="w-6 h-6 text-white" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Photo de la tontine</h3>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!preview ? (
                <>
                  {/* Current image preview */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-gray-100">
                      {currentImage ? (
                        <Image
                          src={currentImage}
                          alt="Photo tontine"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                          <span className="text-5xl">{currentEmoji}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                      ${dragOver
                        ? "border-primary-400 bg-primary-50"
                        : "border-gray-200 hover:border-primary-300 hover:bg-gray-50"
                      }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-50 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Glissez une image ici ou <span className="text-primary-600">parcourir</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      JPG, PNG ou WebP • Max 5 Mo
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </>
              ) : (
                <>
                  {/* Preview */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-40 h-40 rounded-2xl overflow-hidden ring-4 ring-primary-100 shadow-lg">
                      <Image
                        src={preview}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <p className="text-center text-sm text-gray-500 mb-2">
                    Aperçu de la nouvelle photo
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setPreview(null);
                        setFile(null);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={uploading}
                    >
                      Changer
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading || !tontineId}
                      className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
