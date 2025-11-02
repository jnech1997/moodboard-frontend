import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { api } from "../api";
import FloatingInputBar from "./FloatingBarInput";

export default function BoardView() {
  const { id } = useParams();
  const location = useLocation() as any;

  // Fallback title if navigation state not provided
  const initialTitle = location?.state?.title || `Board #${id}`;

  // --- State Management --- //

  const [items, setItems] = useState<any[]>([]);
  const [renderedItems, setRenderedItems] = useState<any[]>([]);
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

  const titleInputRef = useRef<HTMLTextAreaElement>(null);

  // --- Effects --- //

  useEffect(() => {
    const initBoard = async () => {
      try {
        await fetchBoardTitle();
        await pollItemsUntilProcessed();
      } finally {
        setLoading(false);
      }
    };
    initBoard();
  }, [id]);

  // Auto-resize textarea when editing title
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.style.height = "0px";
      const height = titleInputRef.current.scrollHeight;
      titleInputRef.current.style.height = `${height}px`;
    }
  }, [newTitle, editingTitle]);

  // Randomize item style props whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const randomized = items.map((item) => ({
        ...item,
        font: randomClass(fontCombos),
        size: randomClass(sizeClasses),
        img: randomClass(imageSizeClasses),
        shadow: randomClass(shadowClasses),
      }));
      setRenderedItems(randomized);
    } else {
      setRenderedItems([]);
    }
  }, [items]);

  // --- Fetch / Poll Functions --- //

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
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await api.get(`/boards/${id}/items`);
      const updatedItems = res.data;
      setItems(updatedItems);

      if (updatedItems.every((item: any) => item.embedding !== null)) {
        return;
      }
    }
  };

  const pollClustersUntilUpdated = async () => {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await api.get(`/boards/${id}/clusters`);
      const newClusters = res.data.filter((c: any) => c.label);

      if (
        newClusters.length > 0 &&
        JSON.stringify(newClusters) !== JSON.stringify(clusters)
      ) {
        setClusters(newClusters);
        return;
      }
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

  const fetchClusters = async () => {
    const res = await api.get(`/boards/${id}/clusters`);
    const validClusters = res.data.filter(
      (c: any) => c.label && !/^Cluster \d+$/.test(c.label)
    );
    setClusters(validClusters);
  };

  const handleComputeClusters = async () => {
    setClustering(true);
    await api.post(`/boards/${id}/cluster`);
    await pollClustersUntilUpdated();
    setClustering(false);
    setShowClusters(true);
  };

  // --- Item Handlers --- //

  const deleteItem = async (itemId: number) => {
    setDeleting(itemId);
    try {
      await api.delete(`/boards/${id}/items/${itemId}`);
      await pollItemsUntilProcessed();

      if (showClusters) {
        setShowClusters(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        await fetchClusters();
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    } finally {
      setDeleting(null);
    }
  };

  // --- Helpers for Randomized Styles --- //

  const fontCombos = useMemo(
    () => [
      "font-serif italic tracking-tight",
      "font-sans font-light uppercase",
      "font-mono text-sm",
      "font-serif text-2xl leading-snug",
      "font-semibold text-base tracking-wide",
    ],
    []
  );

  const sizeClasses = useMemo(
    () => [
      "text-2xl p-10 min-h-96 w-[110%] relative left-[-5%]",
      "text-3xl p-12 min-h-[28rem] w-full",
      "text-4xl p-12 min-h-[28rem] w-full",
    ],
    []
  );

  const imageSizeClasses = useMemo(
    () => ["h-48", "h-64", "h-80", "h-96", "h-[28rem]"],
    []
  );

  const shadowClasses = useMemo(
    () => [
      "shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
      "shadow-[0_6px_10px_rgba(0,0,0,0.25)]",
      "shadow-[0_4px_16px_rgba(0,0,0,0.4)]",
    ],
    []
  );

  const randomClass = (arr: string[]) =>
    arr[Math.floor(Math.random() * arr.length)];

  // --- Render Functions --- //

  const renderItemCard = (item: any) => (
    <div
      key={item.id}
      className={`group relative inline-block w-full mb-8 break-inside-avoid rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-800 ${item.shadow} hover:shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:-translate-y-1 transition-all duration-200 before:absolute before:inset-0 before:bg-[url('/noise.png')] before:opacity-10 before:pointer-events-none`}
    >
      {/* Processing Banner */}
      {item.embedding === null && (
        <div className="absolute top-0 left-0 right-0 h-8 bg-neutral-900/80 pointer-events-none text-gray-300 text-xs px-2 py-1 z-10 text-center flex items-center justify-center">
          Processing...
        </div>
      )}

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteItem(item.id);
        }}
        disabled={deleting === item.id}
        className={`absolute top-2 right-2 z-20 text-red-500 hover:text-red-400 text-xl leading-none transition-opacity duration-200 ${
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

      {/* Item Content */}
      {item.type === "image" ? (
        <>
          <img
            src={
              item.image_url && item.image_url.includes("static")
                ? `${import.meta.env.VITE_STATIC_URL}${item.image_url}`
                : item.image_url
            }
            alt={item.content}
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
          className={`flex items-center justify-center text-gray-300 text-center ${item.font} ${item.size}`}
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
        className={`absolute top-2 right-2 z-20 text-red-500 hover:text-red-400 text-xl leading-none transition-opacity duration-200 ${
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
          alt={item.content}
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
      {/* Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4 w-full">
        {/* Editable Title */}
        {editingTitle ? (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center animate-fadeIn">
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
              className="w-full sm:w-auto bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2 text-3xl font-bold text-white focus:ring-2 focus:ring-blue-500 resize-none leading-tight outline-none"
              autoFocus
            />
            {savingTitle && (
              <span className="text-xs text-blue-400 animate-pulse ml-2">
                Saving...
              </span>
            )}
          </div>
        ) : (
          <h1
            className="text-4xl font-extrabold text-white cursor-pointer hover:text-blue-300 transition"
            onClick={() => setEditingTitle(true)}
            title="Click to edit title"
          >
            {title}
          </h1>
        )}

        {/* Clustering + Control Buttons */}
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={handleComputeClusters}
            disabled={clustering}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition disabled:opacity-50"
          >
            {clustering ? (
              <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              "Compute Clusters"
            )}
          </button>

          {clusters.length > 0 && !clustering && (
            <button
              onClick={() => setShowClusters(!showClusters)}
              className="bg-neutral-800 px-4 py-2 border border-neutral-700 text-gray-200 rounded-md hover:bg-neutral-700 transition"
            >
              {showClusters ? "Hide Clusters" : "View Clusters"}
            </button>
          )}
        </div>
      </div>

      {/* Content Section */}
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
          <p className="text-gray-400 mt-10 text-center">
            Clustering in progress...
          </p>
        )
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-3 2xl:columns-4 gap-8 [column-fill:balance]">
          {renderedItems.map((item) => renderItemCard(item))}
        </div>
      )}

      {/* Floating Input Bar */}
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
            await api.post(`/boards/${id}/items`, {
              type: "text",
              content,
            });
            await pollItemsUntilProcessed();
          } finally {
            setAddingText(false);
          }
        }}
      />
    </div>
  );
}
