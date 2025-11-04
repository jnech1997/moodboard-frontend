// BoardList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { api } from "../api";
import axios from "axios";
import type { CancelTokenSource } from "axios";
import SearchAndAddModal from "../components/SearchAndAddModal";

export default function BoardList() {
  const [boards, setBoards] = useState<any[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const navigate = useNavigate();
  let cancelTokenSource: CancelTokenSource | null = null;

  const fetchBoards = async (retryCount = 0) => {
    if (cancelTokenSource) {
      cancelTokenSource.cancel("New request initiated, canceling previous one.");
    }
    cancelTokenSource = axios.CancelToken.source();

    try {
      setInitialLoad(true);
      const res = await api.get("/boards", {
        cancelToken: cancelTokenSource.token,
        timeout: 5000,
      });
      setBoards(res.data);
    } catch (err) {
      if (!axios.isCancel(err) && retryCount < 5) {
        const delay = Math.min(1000 * 2 ** retryCount, 10000);
        setTimeout(() => fetchBoards(retryCount + 1), delay);
      }
    } finally {
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const addBoard = async () => {
    const trimmedTitle = newBoardTitle.trim();
    if (!trimmedTitle) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const tempBoard = { id: tempId, title: trimmedTitle, preview_items: [], isGenerating: true };
    setBoards((prev) => [tempBoard, ...prev]);
    setNewBoardTitle("");

    try {
      const res = await api.post("/boards", { title: trimmedTitle });
      const newBoard = res.data;
      setBoards((prev) => prev.map((b) => (b.id === tempId ? { ...newBoard, isGenerating: false } : b)));
    } catch (err) {
      setBoards((prev) => prev.filter((b) => b.id !== tempId));
    }
  };

  const deleteBoard = async (id: number) => {
    try {
      await api.delete(`/boards/${id}`);
      fetchBoards();
    } catch (err) {
      console.error("Error deleting board:", err);
    }
  };

  const handleBoardClick = (e: React.MouseEvent, id: number, title: string) => {
    if ((e.target as HTMLElement).closest("[draggable='true']")) return;
    navigate(`/boards/${id}`, { state: { title } });
  };

  return (
    <div className="mt-6 flex flex-col items-center text-center space-y-6 px-4">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Your vision, your board</h1>
        <p className="text-gray-400 text-base sm:text-lg">What mood are you curating today?</p>
      </div>

      <div className="w-full max-w-xl mx-auto bg-neutral-800/70 border border-neutral-700 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch gap-3 hover:shadow-md transition-all">
        <input
          type="text"
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBoard()}
          placeholder="Enter a mood..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-base sm:text-lg text-gray-200 outline-none"
        />
        <button
          onClick={addBoard}
          className="w-full sm:w-auto px-5 py-2 rounded-md font-semibold text-white bg-green-500 hover:bg-green-400"
        >
          Create
        </button>
      </div>

      {initialLoad ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : boards.length === 0 ? (
        <p className="text-gray-500 mt-10">No boards yet. Create one above!</p>
      ) : (
        <div className="w-full grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {boards.map((b, idx) => (
            <div
              key={b.id}
              onClick={
                !b.isGenerating
                  ? (e) => handleBoardClick(e, b.id, b.title)
                  : undefined
              }
              className={`group relative flex flex-col rounded-2xl cursor-pointer h-[420px] overflow-hidden border border-neutral-700 bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1 ${
                b.isGenerating ? "opacity-60" : ""
              }`}
            >
              {b.isGenerating ? (
                <div className="flex items-center justify-center h-full text-gray-400">Generating...</div>
              ) : (
                <>
                  <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-2 px-2 py-2 bg-neutral-900">
                    {b.preview_items?.length > 0 ? (
                      b.preview_items.slice(0, 6).map((item: any) => (
                        <div key={item.id} className="relative w-full h-[100px] overflow-hidden rounded-md">
                          {item.image_url ? (
                            <img
                              src={
                                item.image_url.includes("static")
                                  ? `${import.meta.env.VITE_STATIC_URL}${item.image_url}`
                                  : item.image_url
                              }
                              alt={item.content || ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-gray-300">
                              {item.content}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex items-center justify-center italic text-sm text-gray-500">No previews</div>
                    )}
                  </div>

                  <div className="w-full px-4 py-3 bg-neutral-900/80 flex justify-between items-center">
                    <div>
                      <h2 className="text-left text-lg font-semibold text-white break-words line-clamp-1">
                        {b.title}
                      </h2>
                      <p className="text-left text-xs text-neutral-400">Board #{idx + 1}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBoard(b.id);
                      }}
                      className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsSearchModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 p-4 rounded-full shadow-lg hover:bg-blue-500"
      >
        <FiSearch className="text-white text-xl" />
      </button>

      <SearchAndAddModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAdd={async (item) => {
          const payload =
            item.type === "image"
              ? { type: "image", image_url: item.image_url, content: item.content, source_item_id: item.id }
              : { type: "text", content: item.content, source_item_id: item.id };

          await api.post(`/boards/${item.boardId}/items`, payload);
        }}
        boards={boards}
      />
    </div>
  );
}
