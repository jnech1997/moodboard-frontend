import { useState } from "react";
import { FiX } from "react-icons/fi";
import { api } from "../api";

interface SearchAndAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => Promise<void>;
  boardId?: number;
  boards?: any[];
}

export default function SearchAndAddModal({
  isOpen,
  onClose,
  onAdd,
  boardId,
  boards = [],
}: SearchAndAddModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addStatus, setAddStatus] = useState<Record<number, string>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.get(`/search`, { params: { q: searchQuery } });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Error searching:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (item: any, targetBoardId: number) => {
    setAddStatus((prev) => ({ ...prev, [item.id]: "loading" }));
    try {
      await onAdd({
        ...item,
        boardId: targetBoardId,
      });
      setAddStatus((prev) => ({ ...prev, [item.id]: "success" }));
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, [item.id]: "" }));
      }, 1000);
    } catch {
      setAddStatus((prev) => ({ ...prev, [item.id]: "error" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80"
      onClick={onClose}
    >
      <div
        className="relative w-[90%] max-w-4xl max-h-[85vh] p-6 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Search Items</h2>
          <button onClick={onClose}>
            <FiX className="text-gray-300 hover:text-white text-2xl" />
          </button>
        </div>

        {/* Search Input */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across your entire collection..."
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-md px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 px-4 py-2 text-white rounded-md hover:bg-blue-500 transition w-full sm:w-auto"
          >
            {searching ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {searchResults.map((item: any) => {
              const added = addStatus[item.id] === "success";

              return (
                <div
                  key={item.id}
                  className="group relative bg-neutral-800 border border-neutral-700 rounded-lg h-64 overflow-hidden shadow-lg hover:shadow-xl"
                >
                  {/* Thumbnail */}
                  {item.image_url ? (
                    <img
                      src={
                        item.image_url.includes("static")
                          ? `${import.meta.env.VITE_STATIC_URL}${item.image_url}`
                          : item.image_url
                      }
                      alt={item.content || ""}
                      className="w-full h-[65%] object-cover pointer-events-none"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[65%] p-4 pointer-events-none">
                      <p className="text-gray-300 text-center text-sm">
                        {item.content}
                      </p>
                    </div>
                  )}

                  {/* Content Snippet */}
                  {item.content && (
                    <div className="px-2 py-1 text-xs text-gray-400 line-clamp-2">
                      {item.content}
                    </div>
                  )}

                  {/* Add to Board */}
                  <div className="absolute bottom-2 inset-x-2 flex flex-col gap-1 z-50">
                    {added ? (
                      <span className="text-green-400 text-xs animate-pulse text-center">
                        ✓ Added!
                      </span>
                    ) : boardId ? (
                      <button
                        onClick={() => handleAdd(item, boardId)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md hover:bg-blue-500 transition"
                      >
                        {addStatus[item.id] === "loading"
                          ? "Adding..."
                          : "Add to this board"}
                      </button>
                    ) : (
                      <select
                        className="w-full bg-neutral-700 border border-neutral-600 text-xs text-gray-200 rounded-md px-2 py-1"
                        onChange={(e) =>
                          handleAdd(item, Number(e.target.value))
                        }
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Add to board...
                        </option>
                        {boards.map((board: any) => (
                          <option key={board.id} value={board.id}>
                            {board.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 mt-6 text-center">
            {searching ? "Searching..." : "No results found yet."}
          </p>
        )}
      </div>
    </div>
  );
}
