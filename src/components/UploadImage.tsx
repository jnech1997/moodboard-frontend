import { useState, useRef } from "react";
import { api } from "../api";

interface UploadImageProps {
  boardId: number;
  onUpload: () => void;
}

export default function UploadImage({ boardId, onUpload }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/boards/${boardId}/items/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUpload();
      setFileName(null); // Reset for re-upload
    } catch (err) {
      console.error("Error uploading image:", err);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={handleButtonClick}
        disabled={uploading}
        className="bg-neutral-800 border border-neutral-700 text-white px-4 py-2 rounded-md hover:bg-neutral-700 transition disabled:opacity-50"
      >
        {uploading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
        ) : fileName ? (
          `Selected: ${fileName}`
        ) : (
          "Upload Image"
        )}
      </button>
    </div>
  );
}
