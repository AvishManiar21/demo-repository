"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function GalleryManager() {
  const bucketNameInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [createStatus, setCreateStatus] = useState("");
  const [toast, setToast] = useState({ message: "", ok: true, show: false });
  const [images, setImages] = useState([]);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  const studioBucketUrl = useMemo(() => {
    return selectedBucket
      ? `https://studio-vanilla.maniar.xyz/project/default/storage/buckets/${selectedBucket}`
      : "";
  }, [selectedBucket]);

  const showToast = useCallback((message, ok = true, timeoutMs = 3000) => {
    setToast({ message, ok, show: true });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast((t) => ({ ...t, show: false })), timeoutMs);
  }, []);

  const loadBuckets = useCallback(async () => {
    try {
      const res = await fetch("/api/buckets", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load buckets");
      setBuckets(json.buckets || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error loading buckets", e);
      showToast("Failed to load buckets", false);
    }
  }, [showToast]);

  const createBucket = useCallback(async () => {
    const name = (bucketNameInputRef.current?.value || "").trim();
    if (!name) {
      showToast("Please enter a bucket name", false);
      return;
    }
    showToast("Creating bucket...", true);
    setCreateStatus("Creating bucket...");
    const res = await fetch("/api/buckets", { method: "POST", body: JSON.stringify({ name }) });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      const msg = String(error || "Failed");
      const exists = /already exists|duplicate|conflict/i.test(msg);
      showToast(exists ? `Bucket "${name}" already exists` : `Error: ${msg}`, !exists);
      setCreateStatus(exists ? `Bucket "${name}" already exists` : `Error: ${msg}`);
      if (exists) setSelectedBucket(name);
      return;
    }
    showToast(`Bucket "${name}" created successfully!`, true);
    setCreateStatus(`Bucket "${name}" created successfully!`);
    setSelectedBucket(name);
    if (bucketNameInputRef.current) bucketNameInputRef.current.value = "";
    await loadBuckets();
  }, [loadBuckets, showToast]);

  const onFileInputChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    const imagesOnly = files.filter((f) => f.type.startsWith("image/"));
    if (imagesOnly.length === 0) {
      showToast("Please select image files only", false);
      setSelectedFiles([]);
      return;
    }
    if (imagesOnly.length !== files.length) {
      showToast(`Only ${imagesOnly.length} of ${files.length} files are images`, false);
    }
    setSelectedFiles(imagesOnly);
  }, [showToast]);

  const uploadFiles = useCallback(async () => {
    if (!selectedBucket) {
      showToast("Please select a bucket first", false);
      return;
    }
    if (selectedFiles.length === 0) {
      showToast("No files selected", false);
      return;
    }
    showToast(`Uploading ${selectedFiles.length} image(s)...`, true);
    setUploadStatus(`Uploading ${selectedFiles.length} image(s)...`);

    const uploaded = [];
    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFiles) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("bucket", selectedBucket);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
        successCount += 1;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Upload error", e);
        errorCount += 1;
      }
    }

    if (successCount > 0) {
      showToast(`Successfully uploaded ${successCount} image(s)!`, true);
      setUploadStatus(`Uploaded ${successCount} file(s) to "${selectedBucket}".`);
      await loadGallery();
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (errorCount > 0) {
      showToast(`${errorCount} file(s) failed to upload`, false);
    }
  }, [selectedBucket, selectedFiles, showToast]);

  const loadGallery = useCallback(async () => {
    if (!selectedBucket) {
      showToast("Please select a bucket first", false);
      return;
    }
    showToast(`Loading images from "${selectedBucket}"...`, true);
    try {
      const res = await fetch(`/api/files?bucket=${encodeURIComponent(selectedBucket)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load files");
      const imgs = (json.files || []).map((f) => ({ name: f.name, url: f.url }));
      setImages(imgs);
      showToast(`Loaded ${imgs.length} image(s) from "${selectedBucket}"`, true);
    } catch (e) {
      showToast("Error loading images from bucket", false);
    }
  }, [selectedBucket, showToast]);

  const openLightbox = useCallback((idx) => setLightbox({ open: true, index: idx }), []);
  const closeLightbox = useCallback(() => setLightbox({ open: false, index: 0 }), []);
  const prevImage = useCallback(() => {
    if (!images.length) return;
    setLightbox((l) => ({ open: true, index: (l.index - 1 + images.length) % images.length }));
  }, [images.length]);
  const nextImage = useCallback(() => {
    if (!images.length) return;
    setLightbox((l) => ({ open: true, index: (l.index + 1) % images.length }));
  }, [images.length]);

  useEffect(() => {
    loadBuckets();
  }, [loadBuckets]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeLightbox, prevImage, nextImage]);

  return (
    <div className="min-h-[calc(100vh-0px)] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="mx-auto max-w-7xl p-5 md:p-8 flex gap-5 md:gap-6">
        {/* Left panel */}
        <div className="w-[440px] shrink-0 space-y-6 hidden md:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-indigo-950/50 p-6 ring-1 ring-indigo-400/10">
            <div className="mb-4">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent flex items-center gap-2"><span>🌩️</span> Cloud Storage Manager</h1>
              <p className="text-slate-300/80 mt-1">Create buckets, upload images, and manage your cloud storage</p>
            </div>
            <div className="space-y-5">
              <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Step 1: Create Bucket</h3>
              <div className="space-y-3">
                <input ref={bucketNameInputRef} type="text" placeholder="Enter bucket name" className="w-full rounded-xl bg-white/5 border-2 border-white/10 focus:border-violet-400/60 focus:outline-none focus:ring-4 focus:ring-violet-500/20 px-4 py-3 placeholder:text-slate-400" />
                <button onClick={createBucket} className="w-full rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-semibold py-3 shadow-lg shadow-violet-900/30 transition-transform active:scale-[0.99]">Create Bucket</button>
              </div>
              {createStatus && (
                <div className="rounded-lg px-3 py-2 text-sm text-center bg-white/5 border border-white/10">{createStatus}</div>
              )}
              {selectedBucket && (
                <a className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-white font-semibold shadow-md hover:from-violet-400 hover:to-indigo-400" href={studioBucketUrl} target="_blank">View Bucket in Studio: {selectedBucket}</a>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-indigo-950/50 p-6 ring-1 ring-indigo-400/10">
            <h3 className="text-lg font-semibold border-b border-white/10 pb-2">Step 2: Select & Upload</h3>
            <div className="space-y-3 mt-4">
              <div className="flex gap-3">
                <select className="flex-1 rounded-xl bg-white/5 border-2 border-white/10 focus:border-violet-400/60 focus:outline-none focus:ring-4 focus:ring-violet-500/20 px-4 py-3" value={selectedBucket} onChange={(e) => setSelectedBucket(e.target.value)}>
                  <option value="">Select a bucket</option>
                  {buckets.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                <button className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 px-4 py-3 font-semibold shadow-md" onClick={loadGallery}>Load Gallery</button>
              </div>

              {/* Dropzone */}
              <div className="rounded-2xl border-2 border-dashed border-white/15 bg-white/5 hover:border-violet-400/40 transition p-6 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer?.files || [];
                onFileInputChange({ target: { files } });
              }}>
                <div className="space-y-2">
                  <p className="text-lg">☐ Drag & Drop Images</p>
                  <p className="text-slate-400">or</p>
                  <button className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 px-4 py-2 font-semibold shadow" onClick={() => fileInputRef.current?.click()}>Choose Files</button>
                </div>
              </div>

              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={onFileInputChange} />

              {selectedFiles.length > 0 && (
                <button className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-50 font-semibold py-3 shadow" onClick={uploadFiles}>Upload Selected Files ({selectedFiles.length})</button>
              )}

              {uploadStatus && (
                <div className="rounded-lg px-3 py-2 text-sm text-center bg-white/5 border border-white/10">{uploadStatus}</div>
              )}

              {selectedBucket && (
                <a className="inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-white font-semibold shadow-md hover:from-violet-400 hover:to-indigo-400" href={studioBucketUrl} target="_blank">View Bucket in Studio</a>
              )}
            </div>
          </div>
        </div>

        {/* Right panel / gallery */}
        <div className="flex-1 min-w-0 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-indigo-950/50 ring-1 ring-indigo-400/10">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
            <h2 className="text-xl font-semibold">🖼️ Gallery View</h2>
          </div>
          <div className="p-6">
            {images.length === 0 ? (
              <div className="text-center text-slate-400 py-24">No images loaded. Click "Load Gallery" to view images.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button key={img.url} className="group relative overflow-hidden rounded-xl ring-1 ring-white/10 bg-white/5 hover:ring-white/20 shadow transition" onClick={() => openLightbox(idx)}>
                    <img src={img.url} alt={img.name} loading="lazy" className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed left-1/2 -translate-x-1/2 top-6 z-50 rounded-xl px-4 py-2 font-semibold shadow-xl ${toast.ok ? "bg-emerald-500 text-emerald-950" : "bg-rose-500 text-rose-950"}`}>{toast.message}</div>
      )}

      {/* Lightbox */}
      {lightbox.open && images[lightbox.index] && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}>
          <div className="relative max-w-[90%] max-h-[90%] flex flex-col items-center">
            <button className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/20 text-white text-2xl grid place-items-center" onClick={closeLightbox}>✕</button>
            {images.length > 1 && <button className="absolute left-0 -ml-16 h-12 w-12 rounded-full bg-white/20 text-white text-2xl" onClick={prevImage}>&lt;</button>}
            {images.length > 1 && <button className="absolute right-0 -mr-16 h-12 w-12 rounded-full bg-white/20 text-white text-2xl" onClick={nextImage}>&gt;</button>}
            <img src={images[lightbox.index].url} alt={images[lightbox.index].name} className="max-h-[80vh] max-w-full rounded-lg shadow-2xl" />
            <div className="mt-3 text-white/90 text-sm px-3 py-1 rounded bg-black/50">{images[lightbox.index].name}</div>
          </div>
        </div>
      )}
    </div>
  );
}


