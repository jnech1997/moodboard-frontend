import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { api } from "../api";

export default function BoardList() {
  // --- State Management ---
  const [boards, setBoards] = useState<any[]>([]);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [addStatus, setAddStatus] = useState<Record<number, string>>({});

  const navigate = useNavigate();

  // --- Data Fetching ---
  const fetchBoards = async () => {
    try {
      setInitialLoad(true);
      const res = await api.get("/boards");
      setBoards(res.data);
    } catch (err) {
      console.error("Error fetching boards:", err);
    } finally {
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // --- Search Handling ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

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

  // --- Item + Board Operations ---
  const handleAddToBoard = async (item: any, boardId: number) => {
    setAddStatus((prev) => ({ ...prev, [item.id]: "loading" }));

    try {
      const payload =
        item.type === "image"
          ? { type: "image", image_url: item.image_url, content: item.content, source_item_id: item.id }
          : { type: "text", content: item.content, source_item_id: item.id };

      await api.post(`/boards/${boardId}/items`, payload);

      setAddStatus((prev) => ({ ...prev, [item.id]: "success" }));
      setTimeout(() => {
        setAddStatus((prev) => ({ ...prev, [item.id]: "" }));
      }, 1200);
    } catch (err) {
      console.error("Failed to add item to board:", err);
      setAddStatus((prev) => ({ ...prev, [item.id]: "error" }));
    }
  };

  const addBoard = async () => {
    const title = newBoardTitle.trim();
    const tempBoard = {
      id: "temp",
      title: title || "Creating...",
      preview_items: [],
      isGenerating: true,
    };

    setBoards((prev) => [tempBoard, ...prev]);
    setNewBoardTitle("");

    try {
      const res = await api.post("/boards", { title: newBoardTitle });
      const newBoard = res.data;

      setBoards((prev) => prev.map((b) => (b.id === "temp" ? newBoard : b)));
    } catch (err) {
      console.error("Error creating board:", err);
      setBoards((prev) => prev.filter((b) => b.id !== "temp"));
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

  // --- Helpers ---
  const handleBoardClick = (
    e: React.MouseEvent,
    id: number,
    title: string
  ) => {
    if ((e.target as HTMLElement).closest("[draggable='true']")) return;
    navigate(`/boards/${id}`, { state: { title } });
  };

  // --- UI Rendering ---
  return (
    <div className="mt-6 flex flex-col items-center text-center space-y-6 px-4">
      {/* Hero Header */}
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-[0_3px_20px_rgba(59,130,246,0.35)] leading-tight">
          Your vision, your board
        </h1>
        <p className="text-gray-400 text-base sm:text-lg">
          What mood are you curating today?
        </p>
      </div>

      {/* Create Board Input */}
      <div className="w-full max-w-xl mx-auto bg-neutral-800/70 backdrop-blur-lg border border-neutral-700 rounded-2xl shadow-[0_8px_25px_rgba(30,60,114,0.4)] p-3 sm:p-4 flex flex-col sm:flex-row items-stretch gap-3 hover:shadow-[0_10px_30px_rgba(30,60,114,0.6)] transition-all duration-300">
        <input
          type="text"
          value={newBoardTitle}
          onChange={(e) => setNewBoardTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBoard()}
          placeholder="Enter a mood..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-base sm:text-lg text-gray-200 placeholder:text-gray-500 outline-none"
        />
        <button
          onClick={addBoard}
          disabled={loading}
          className={`w-full sm:w-auto px-5 py-2 rounded-md font-semibold text-white transition-all duration-200 ${
            loading
              ? "bg-gray-600 opacity-50 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-400 active:scale-95 shadow-md"
          }`}
        >
          Create
        </button>
      </div>

      {/* Boards Section */}
      {initialLoad ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : boards.length === 0 ? (
        <p className="text-gray-500 mt-10">No boards yet. Create one above!</p>
      ) : (
        <div className="w-full grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {boards.map((b) => (
            <div
              key={b.id}
              onClick={
                !b.isGenerating
                  ? (e) => handleBoardClick(e, b.id, b.title)
                  : undefined
              }
              className={`group relative flex flex-col rounded-2xl cursor-pointer h-[420px] overflow-hidden border transition-all duration-200 shadow-lg hover:shadow-[0_8px_24px_rgba(59,130,246,0.25)] hover:-translate-y-1 ${
                b.isGenerating
                  ? "bg-neutral-800/60 border-neutral-600"
                  : "bg-neutral-800 border-neutral-700"
              }`}
            >
              {b.isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="w-10 h-10 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></span>
                  <p className="mt-4 text-lg">Generating...</p>
                </div>
              ) : (
                <>
                  {/* Preview Items */}
                  <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-2 px-2 py-2 bg-neutral-900">
                    {b.preview_items?.length > 0 ? (
                      b.preview_items.slice(0, 6).map((item: any) => (
                        <div
                          key={item.id}
                          className="relative w-full h-[100px] overflow-hidden rounded-md"
                        >
                          {item.image_url ? (
                            <img
                              src={
                                item.image_url.includes("static")
                                  ? `${import.meta.env.VITE_STATIC_URL}${item.image_url}`
                                  : item.image_url
                              }
                              alt={item.content || ""}
                              className="w-full h-full object-cover absolute inset-0"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-300 bg-neutral-800 p-1 text-center line-clamp-3">
                              {item.content}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 flex items-center justify-center italic text-sm text-gray-500">
                        No previews
                      </div>
                    )}
                  </div>

                  {/* Board Title */}
                  <div className="w-full px-4 py-3 bg-neutral-900/80 flex justify-between items-center">
                    <div className="flex flex-col">
                      <h2 className="text-left text-lg font-semibold text-white break-words line-clamp-1">
                        {b.title}
                      </h2>
                      <p className="text-left text-xs text-neutral-400">
                        Board #{b.id}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBoard(b.id);
                      }}
                      className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition duration-200"
                      title="Delete board"
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

      {/* Floating Search Button */}
      <button
        onClick={() => setIsSearchModalOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 p-4 rounded-full shadow-lg hover:bg-blue-500 transition duration-300"
      >
        <FiSearch className="text-white text-xl" />
      </button>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="relative w-[90%] max-w-4xl max-h-[85vh] p-6 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Search Items</h2>
              <button onClick={() => setIsSearchModalOpen(false)}>
                <FiX className="text-gray-300 hover:text-white text-2xl" />
              </button>
            </div>

            {/* Search Form */}
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
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                ) : (
                  "Search"
                )}
              </button>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {searchResults.map((item) => {
                  const addedToBoard = addStatus[item.id] === "success";

                  return (
                    <div
                      key={item.id}
                      className="group relative bg-neutral-800 border border-neutral-700 rounded-lg h-64 overflow-hidden shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing transition-all"
                    >
                      {/* Delete Button */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await api.delete(
                              `/boards/${item.board_id}/items/${item.id}`
                            );
                            setSearchResults((prev) =>
                              prev.filter((resItem) => resItem.id !== item.id)
                            );
                          } catch (err) {
                            console.error("Error deleting item:", err);
                          }
                        }}
                        className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-400 text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Delete item"
                      >
                        ✕
                      </button>

                      {/* Thumbnail / Text Display */}
                      {item.image_url ? (
                        <>
                          <img
                            src={
                              item.image_url.includes("static")
                                ? `${import.meta.env.VITE_API_URL}${item.image_url}`
                                : item.image_url
                            }
                            alt={item.content || "item-image"}
                            className="w-full h-[65%] object-cover pointer-events-none"
                          />
                          <div className="px-2 py-1 text-xs text-gray-400 line-clamp-2">
                            {item.content}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-[65%] p-4 pointer-events-none">
                          <p className="text-gray-300 text-center text-sm">
                            {item.content}
                          </p>
                        </div>
                      )}

                      {/* Add to Board Selector */}
                      <div className="absolute bottom-2 inset-x-2 flex flex-col gap-1 z-10 pointer-events-auto">
                        {addedToBoard ? (
                          <span className="text-green-400 text-xs animate-pulse">
                            ✓ Added!
                          </span>
                        ) : (
                          <>
                          <label className="block w-full">
                            <select
                              className="w-full bg-neutral-700 border border-neutral-600 text-xs text-gray-200 rounded-md px-3 py-2 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                              onChange={(e) => handleAddToBoard(item, Number(e.target.value))}
                              defaultValue=""
                              style={{ minHeight: "38px", WebkitAppearance: "none" }} // WebKit fix
                            >
                              <option value="" disabled>
                                Add to board...
                              </option>
                              {boards.map((board) => (
                                <option key={board.id} value={board.id}>
                                  {board.title}
                                </option>
                              ))}
                            </select>
                            </label>
                          </>
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
      )}
    </div>
  );
}
