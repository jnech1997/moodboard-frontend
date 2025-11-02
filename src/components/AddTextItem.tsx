import { useState } from "react";
import { api } from "../api";

interface AddTextItemProps {
  boardId: number;
  onAdded: () => void;
}

export default function AddTextItem({ boardId, onAdded }: AddTextItemProps) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await api.post(
        `/boards/${boardId}/items`,
        { content, type: "text" },
        { headers: { "Content-Type": "application/json" } }
      );
      await api.post(`/boards/${boardId}/cluster`);

      setMessage("✅ Added text item");
      setContent("");
      onAdded();
    } catch (err: unknown) {
      const errorMessage =
        (err as any).response?.data?.detail || "Error adding item";
      setMessage(`❌ ${errorMessage}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 shadow-sm">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write something..."
        className="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
      >
        Add
      </button>
      {message && <p className="text-sm text-gray-500">{message}</p>}
    </form>
  );
}
