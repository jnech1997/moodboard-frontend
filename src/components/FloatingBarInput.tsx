import { useState } from "react";
import UploadImage from "./UploadImage";
import { FiSearch } from "react-icons/fi";

interface FloatingInputBarProps {
  boardId: number;
  onAddText: (text: string) => Promise<void>;
  onUpload: () => Promise<void>;
  onSearch: () => void; // 🔍 new prop
  addingText: boolean;
}

export default function FloatingInputBar({
  boardId,
  onAddText,
  onUpload,
  onSearch, // 🔍 add this
  addingText,
}: FloatingInputBarProps) {
  const [text, setText] = useState("");

  const handleAdd = async () => {
    if (!text.trim()) return;
    await onAddText(text);
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 left-auto right-6 w-[440px] z-50">
      <div className="flex flex-col flex-row items-stretch items-center gap-2 gap-3 bg-neutral-900 border border-neutral-700 shadow-lg px-4 py-3 rounded-lg">

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add text..."
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
        />

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">

          {/* 🔍 Search button */}
          <button
            onClick={onSearch}
            className="bg-neutral-700 hover:bg-neutral-600 text-white font-medium px-4 py-2 rounded-md transition active:scale-95"
            title="Search items"
          >
            <FiSearch className="text-lg" />
          </button>

          <button
            onClick={handleAdd}
            disabled={addingText}
            className="bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-2 rounded-md transition disabled:opacity-50 active:scale-95 w-full w-auto"
          >
            {addingText ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Add"
            )}
          </button>

          <div className="flex items-center justify-center w-full w-auto">
            <UploadImage boardId={boardId} onUpload={onUpload} />
          </div>
        </div>
      </div>
    </div>
  );
}
