import { useState } from "react";
import UploadImage from "./UploadImage";

interface FloatingInputBarProps {
  boardId: number;
  onAddText: (text: string) => Promise<void>;
  onUpload: () => Promise<void>;
  addingText: boolean;
}

export default function FloatingInputBar({
  boardId,
  onAddText,
  onUpload,
  addingText,
}: FloatingInputBarProps) {
  const [text, setText] = useState("");

  const handleAdd = async () => {
    if (!text.trim()) return;
    await onAddText(text);
    setText("");
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-[440px] z-50">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-neutral-900 border border-neutral-700 shadow-lg px-4 py-3 rounded-lg">
        
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
          <button
            onClick={handleAdd}
            disabled={addingText}
            className="bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-2 rounded-md transition disabled:opacity-50 active:scale-95 w-full sm:w-auto"
          >
            {addingText ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Add"
            )}
          </button>

          <div className="flex items-center justify-center w-full sm:w-auto">
            <UploadImage boardId={boardId} onUpload={onUpload} />
          </div>
        </div>
      </div>
    </div>
  );
}
