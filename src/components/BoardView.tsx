// BoardView.tsx
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { api } from "../api";
import FloatingInputBar from "./FloatingBarInput";
import SearchAndAddModal from "./SearchAndAddModal";

export default function BoardView() {
  const { id } = useParams();
  const location = useLocation() as any;

  const initialTitle = location?.state?.title || `Board #${id}`;

  // --- State Management --- //
  const [items, setItems] = useState<any[]>([]);
  const [renderedItems, setRenderedItems] = useState<any[]>([]);
  const [styleMap, setStyleMap] = useState<{ [id: number]: any }>({});
  const [clusters, setClusters] = useState<any[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [newTitle, setNewTitle] = useState(initialTitle);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [addingText, setAddingText] = useState(false);
  const [clustering, setClustering] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // --- Effects --- //
  useEffect(() => {
    const initBoard = async () => {
      try {
        await fetchBoardTitle();
        const res = await api.get(`/boards/${id}/items`);
        setItems(res.data);
        setLoading(false);
        pollItemsUntilProcessed();
      } catch {
        setLoading(false);
      }
    };
    initBoard();
  }, [id]);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.style.height = "0px";
      const height = titleInputRef.current.scrollHeight;
      titleInputRef.current.style.height = `${height}px`;
    }
  }, [newTitle, editingTitle]);

  useEffect(() => {
    if (items.length > 0) {
      setRenderedItems(() => {
        const updatedStyleMap = { ...styleMap };

        items.forEach((item) => {
          if (!updatedStyleMap[item.id]) {
            updatedStyleMap[item.id] = {
              font: randomClass(fontCombos),
              size: randomClass(sizeClasses),
              img: randomClass(imageSizeClasses),
              shadow: randomClass(shadowClasses),
            };
          }
        });

        setStyleMap(updatedStyleMap);

        return items.map((item) => ({
          ...item,
          ...updatedStyleMap[item.id],
        }));
      });
    } else {
      setRenderedItems([]);
    }
  }, [items]);

  // --- Fetch / Poll Logic --- //
  const fetchBoardTitle = async () => {
    try {
      const res = await api.get(`/boards/${id}`);
      setTitle(res.data.title);
      setNewTitle(res.data.title);
    } catch (err) {
      console.error("Error fetching board title:", err);
    }
  };

  const pollItemsUntilProcessed = async () => {
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      const res = await api.get(`/boards/${id}/items`);
      const updatedItems = res.data;

      setItems((prevItems) => {
        let somethingChanged = false;

        const nextItems = updatedItems.map((newItem: any) => {
          const oldItem = prevItems.find((i) => i.id === newItem.id);
          if (!oldItem) {
            somethingChanged = true;
            return newItem;
          }
          if (
            (oldItem.embedding === null && newItem.embedding !== null) ||
            (oldItem.content === null && newItem.content !== null)
          ) {
            somethingChanged = true;
            return newItem;
          }
          return oldItem;
        });

        if (prevItems.length !== nextItems.length) somethingChanged = true;

        return somethingChanged ? nextItems : prevItems;
      });

      if (updatedItems.every((item: any) => item.embedding !== null && item.content)) break;
    }
  };

  // --- Search + Add Logic --- //
  const handleAddFromSearch = async (item: any) => {
    try {
      const payload =
        item.type === "image"
          ? { type: "image", image_url: item.image_url, content: item.content, source_item_id: item.id }
          : { type: "text", content: item.content, source_item_id: item.id };

      await api.post(`/boards/${id}/items`, payload);
      await pollItemsUntilProcessed();
    } catch (err) {
      console.error("Error adding search item:", err);
    }
  };

  // --- Title Editing --- //
  const saveTitle = async () => {
    if (savingTitle || newTitle.trim() === "") return;

    setSavingTitle(true);
    try {
      setTitle(newTitle);
      await api.patch(`/boards/${id}`, { title: newTitle });
    } catch (err) {
      console.error("Failed to update title:", err);
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  };

  // --- Clustering --- //
  const handleComputeClusters = async () => {
    setClustering(true);
    await api.post(`/boards/${id}/cluster`);
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await api.get(`/boards/${id}/clusters`);
      const validClusters = res.data.filter(
        (c: any) => c.label && !/^Cluster \d+$/.test(c.label)
      );

      if (validClusters.length > clusters.length) {
        setClusters(validClusters);
        break;
      }
    }
    setClustering(false);
    setShowClusters(true);
  };

  const deleteItem = async (itemId: number) => {
    setDeleting(itemId);
    try {
      await api.delete(`/boards/${id}/items/${itemId}`);
      await pollItemsUntilProcessed();
      if (showClusters) {
        setShowClusters(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const res = await api.get(`/boards/${id}/clusters`);
        setClusters(res.data.filter((c: any) => c.label));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    } finally {
      setDeleting(null);
    }
  };

  // --- Helpers --- //
  const randomClass = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  const fontCombos = useMemo(() => ["font-serif italic tracking-tight", "font-sans font-light uppercase", "font-mono text-sm", "font-serif text-2xl leading-snug", "font-semibold text-base tracking-wide"], []);
  const sizeClasses = useMemo(() => ["text-2xl p-10 min-h-96 w-[110%] relative left-[-5%]", "text-3xl p-12 min-h-[28rem] w-full", "text-4xl p-12 min-h-[28rem] w-full"], []);
  const imageSizeClasses = useMemo(() => ["h-48", "h-64", "h-80", "h-96", "h-[28rem]"], []);
  const shadowClasses = useMemo(() => ["shadow-[0_3px_6px_rgba(0,0,0,0.3)]", "shadow-[0_6px_10px_rgba(0,0,0,0.25)]", "shadow-[0_4px_16px_rgba(0,0,0,0.4)]"], []);

  // --- Render Functions --- //
  const renderItemCard = (item: any) => (
    <div
      key={item.id}
      className={`group relative inline-block w-full mb-8 rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-800 ${item.shadow} hover:shadow-lg hover:-translate-y-1 transition-all`}
    >
      {(item.embedding === null || !item.content) && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-neutral-900/80 text-gray-300 text-xs px-2 z-10 flex items-center justify-center">
          Processing Embedding...
        </div>
      )}

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteItem(item.id);
        }}
        disabled={deleting === item.id}
        className={`absolute top-2 right-2 z-20 text-red-500 hover:text-red-400 text-xl transition-opacity duration-200 ${
          deleting === item.id
            ? "opacity-50 cursor-not-allowed"
            : "opacity-0 group-hover:opacity-100 cursor-pointer"
        }`}
        title="Delete item"
      >
        {deleting === item.id ? (
          <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          "✕"
        )}
      </button>

      {item.type === "image" ? (
        <>
          <img
            src={
              item.image_url.includes("static")
                ? `${import.meta.env.VITE_STATIC_URL}${item.image_url}`
                : item.image_url
            }
            alt={item.content || ""}
            className={`object-cover w-full ${item.img}`}
          />
          {item.content && (
            <div className={`p-3 text-gray-300 text-sm ${item.font} text-center`}>
              {item.content}
            </div>
          )}
        </>
      ) : (
        <div
          className={`flex items-center justify-center text-gray-300 ${item.font} ${item.size}`}
        >
          <p>{item.content}</p>
        </div>
      )}
    </div>
  );

  const renderClusterItem = (item: any) => (
    <div
      key={item.id}
      className="relative bg-neutral-800 border border-neutral-700 rounded-2xl overflow-hidden h-64 flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.25)] transition-all duration-200"
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteItem(item.id);
        }}
        disabled={deleting === item.id}
        className={`absolute top-2 right-2 z-20 text-red-500 hover:text-red-400 text-xl ${
          deleting === item.id
            ? "opacity-50 cursor-not-allowed"
            : "opacity-100 cursor-pointer"
        }`}
        title="Delete item"
      >
        {deleting === item.id ? (
          <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
        ) : (
          "✕"
        )}
      </button>

      {/* Item Content */}
      {item.image_url && (
        <img
          src={
            item.image_url.includes("static")
              ? `${import.meta.env.VITE_STATIC_URL}${item.image_url}`
              : item.image_url
          }
          alt={item.content || ""}
          className={`object-cover w-full ${
            item.content ? "h-40" : "h-full"
          }`}
        />
      )}

      {item.content && (
        <div
          className={`flex items-center justify-center text-gray-300 text-center px-4 py-2 text-sm ${
            item.image_url ? "h-24" : "h-full"
          } overflow-hidden`}
        >
          <p>{item.content}</p>
        </div>
      )}
    </div>
  );

  // --- Page Render --- //
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-100 px-10 py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        {editingTitle ? (
          <textarea
            ref={titleInputRef}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveTitle();
              }
              if (e.key === "Escape") {
                setEditingTitle(false);
                setNewTitle(title);
              }
            }}
            className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-3xl font-bold text-white focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
        ) : (
          <h1
            className="text-4xl font-extrabold text-white cursor-pointer hover:text-blue-300 transition"
            onClick={() => setEditingTitle(true)}
          >
            {title}
          </h1>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleComputeClusters}
            disabled={clustering}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition disabled:opacity-50"
          >
            {clustering ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Compute Clusters"
            )}
          </button>

          {clusters.length > 0 && !clustering && (
            <button
              onClick={() => setShowClusters(!showClusters)}
              className="bg-neutral-800 px-4 py-2 border border-neutral-700 rounded-md text-gray-200 hover:bg-neutral-700"
            >
              {showClusters ? "Hide Clusters" : "View Clusters"}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {showClusters ? (
        clusters.length > 0 ? (
          <div className="space-y-10 mt-6">
            {clusters.map((cluster, ci) => (
              <div key={ci}>
                <h2 className="text-2xl font-bold text-white mb-3 border-b border-neutral-700 pb-1">
                  {cluster.label}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
                  {cluster.items.map((item: any) => renderClusterItem(item))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 mt-10 text-center">Clustering in progress...</p>
        )
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8">
          {renderedItems.map((item) => renderItemCard(item))}
        </div>
      )}

      {/* Floating Bar for adding items */}
      <FloatingInputBar
        boardId={Number(id)}
        addingText={addingText}
        onUpload={async () => {
          if (showClusters) {
            setShowClusters(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          await pollItemsUntilProcessed();
        }}
        onAddText={async (content: string) => {
          if (showClusters) {
            setShowClusters(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
          setAddingText(true);
          try {
            await api.post(`/boards/${id}/items`, { type: "text", content });
            await pollItemsUntilProcessed();
          } finally {
            setAddingText(false);
          }
        }}
        onSearch={() => setIsSearchModalOpen(true)}
      />

      <SearchAndAddModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAdd={handleAddFromSearch}
        boardId={Number(id)}
      />
    </div>
  );
}
