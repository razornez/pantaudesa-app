"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, RotateCw } from "lucide-react";
import UserAvatar from "@/components/user/UserAvatar";
import { uploadUserAvatar } from "./api";
import { compressImage } from "./image-utils";

interface AvatarEditorProps {
  nama: string;
  current?: string;
  onUploaded: (url: string) => void;
  onError: (message: string) => void;
}

export function AvatarEditor({ nama, current, onUploaded, onError }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>(current);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    objectUrlRef.current = URL.createObjectURL(file);
    setPreview(objectUrlRef.current);
    setLoading(true);

    try {
      let uploadFile: File | Blob = file;
      if (file.size > 500 * 1024 && file.type !== "image/gif") {
        uploadFile = await compressImage(file, 1280, 0.8);
      }

      const data = await uploadUserAvatar(uploadFile, file.name);
      setPreview(data.avatarUrl);
      onUploaded(data.avatarUrl);
    } catch (error) {
      setPreview(current);
      onError(error instanceof Error ? error.message : "Gagal mengupload foto. Pastikan koneksi stabil lalu coba lagi.");
    } finally {
      setLoading(false);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      event.target.value = "";
    }
  }

  const displayUrl = preview ?? current;

  return (
    <div className="relative w-fit">
      {displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayUrl} alt={nama} className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-200" />
      ) : (
        <UserAvatar nama={nama} size="xl" />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
          <RotateCw size={14} className="animate-spin text-white" />
        </div>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-indigo-600 shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        <Camera size={12} className="text-white" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
