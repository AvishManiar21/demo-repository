"use client";
import { useEffect, useRef, useState } from "react";

export default function Uploader({ buckets }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef();

  async function handleUpload(e) {
    e.preventDefault();
    if (!files.length) return;
    const formData = new FormData();
    for (const file of files) formData.append("file", file);
    setIsUploading(true);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setIsUploading(false);
    setFiles([]);
    // trigger refresh of gallery grid
    window.dispatchEvent(new Event("gallery:refresh"));
  }

  return (
    <section className="space-y-8">
      <form
        className={`relative border-2 border-dashed p-8 rounded-xl flex flex-col items-center gap-4 transition-colors ${
          isDragging ? "border-emerald-400 bg-emerald-400/10" : "border-slate-500/50 hover:border-slate-300/70"
        }`}
        onSubmit={handleUpload}
        onDrop={(e) => {
          e.preventDefault();
          setFiles(Array.from(e.dataTransfer.files));
          setIsDragging(false);
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
      >
        <input
          type="file"
          multiple
          hidden
          ref={inputRef}
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />
        <button
          type="button"
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold px-5 py-2 rounded-lg shadow transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          Select Images
        </button>
        <div className="text-slate-600">
          {files.length ? `${files.length} file(s) ready to upload.` : "Or drop images here."}
        </div>
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-400 text-indigo-950 font-semibold px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
          disabled={!files.length || isUploading}
        >
          {isUploading ? "Uploading…" : "Upload"}
        </button>

        {files.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full mt-2">
            {files.map((f) => (
              <div key={f.name} className="rounded-md overflow-hidden ring-1 ring-white/10">
                <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-24 object-cover" />
              </div>
            ))}
          </div>
        )}
      </form>

      <div>
        <h2 className="font-semibold mb-3 text-slate-800">Images</h2>
        <GalleryGrid />
      </div>
    </section>
  );
}

function GalleryGrid() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/files", { cache: "no-store" });
    const data = await res.json();
    setImages(data.files || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("gallery:refresh", handler);
    return () => window.removeEventListener("gallery:refresh", handler);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 md:h-40 rounded-lg skeleton" />
        ))}
      </div>
    );
  }

  if (!images.length) return <div className="text-slate-400">No images found.</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {images.map(({ name, url }) => (
        <figure key={name} className="overflow-hidden rounded-lg shadow-lg ring-1 ring-white/10 hover:ring-white/20 transition">
          <img src={url} alt={name} className="w-full object-cover h-36 md:h-40 transition-transform duration-300 hover:scale-105" />
        </figure>
      ))}
    </div>
  );
}


