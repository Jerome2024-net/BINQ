"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Camera, X, Upload, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentAvatar?: string;
  userName: string;
  onUploadComplete: (url: string) => void;
}

export default function AvatarUpload({ userId, currentAvatar, userName, onUploadComplete }: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) return;

    // Max 5MB
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
  }, []);

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
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      if (currentAvatar) formData.append("oldAvatar", currentAvatar);

      const res = await fetch("/api/avatar/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");

      onUploadComplete(data.url);
      handleClose();
    } catch (error: any) {
      console.error("Erreur upload avatar:", error);
      const msg = error?.message || "Erreur inconnue";
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

  const initials = `${userName.split(" ")[0]?.[0] || "?"}${userName.split(" ")[1]?.[0] || "?"}`.toUpperCase();

  return (
    <>
      {/* Trigger button — overlay on avatar */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
        aria-label="Changer la photo de profil"
      >
        <Camera className="w-6 h-6 text-white" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Photo de profil</h3>
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
                  {/* Current avatar preview */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-gray-100">
                      {currentAvatar ? (
                        <Image
                          src={currentAvatar}
                          alt={userName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-600 flex items-center justify-center">
                          <span className="text-3xl font-semibold text-white">{initials}</span>
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
                    <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-primary-100 shadow-lg">
                      <Image
                        src={preview}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <p className="text-center text-sm text-gray-500 mb-2">
                    Aperçu de votre nouvelle photo
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
                      disabled={uploading}
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
