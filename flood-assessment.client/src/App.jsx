import { useEffect, useMemo, useRef, useState } from "react";
import { deleteOffline, getOfflineData, saveOffline } from "./db";
import { sendAssessment } from "./api";
import { getLocation } from "./location";
import { toBase64 } from "./image";

function formatTime(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

function withTimeout(promise, ms, message) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function App() {
  const [form, setForm] = useState({
    address: "",
    condition: "",
    chickenCount: "",
    photos: [],
  });

  const [online, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [autoSync, setAutoSync] = useState(() => {
    try {
      return localStorage.getItem("autoSync") === "true";
    } catch {
      return false;
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [toast, setToast] = useState(null);

  const syncingRef = useRef(false);

  const photoPreviews = useMemo(() => {
    return form.photos.map((b64, idx) => ({
      id: `${idx}-${b64.slice(0, 24)}`,
      src: b64,
    }));
  }, [form.photos]);

  async function refreshPending() {
    const data = await getOfflineData();
    setPendingCount(data.length);
    return data;
  }

  useEffect(() => {
    let cancelled = false;
    getOfflineData()
      .then((data) => {
        if (cancelled) return;
        setPendingCount(data.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const handleImage = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const images = files.filter((f) => (f?.type ?? "").startsWith("image/"));
    const rejected = files.filter((f) => !(f?.type ?? "").startsWith("image/"));

    if (rejected.length > 0) {
      setToast({
        type: "warn",
        message: `Ignored ${rejected.length} non-image file(s). Please select images only.`,
      });
    }

    const base64Images = await Promise.all(images.map(toBase64));
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ...base64Images] }));

    // allow selecting same file again
    e.target.value = "";
  };

  const handleSubmit = async () => {
    setToast(null);
    setIsSaving(true);
    try {
      let loc;
      try {
        loc = await getLocation();
      } catch {
        // Location is optional; still allow saving.
        loc = { latitude: 0, longitude: 0 };
        setToast({
          type: "warn",
          message:
            "Location not available (permission denied or insecure connection). Saved without GPS.",
        });
      }

      const record = {
        id: Date.now().toString(),
        address: form.address.trim(),
        condition: form.condition,
        chickenCount: Number(form.chickenCount) || 0,
        photosBase64: form.photos,
        ...loc,
        syncStatus: "PENDING",
        retryCount: 0,
        createdAt: Date.now(),
      };

      await withTimeout(
        saveOffline(record),
        12_000,
        "Offline save is taking too long (storage blocked)."
      );
      await withTimeout(refreshPending(), 12_000, "Reading offline queue timed out.");

      setToast({ type: "ok", message: "Saved offline. You can sync later when online." });
      setForm((prev) => ({ ...prev, address: "", chickenCount: "", photos: [] }));
    } catch (err) {
      setToast({ type: "err", message: `Save failed: ${err?.message ?? String(err)}` });
    } finally {
      setIsSaving(false);
    }
  };

  async function syncData({ reason } = {}) {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setToast(null);

    try {
      const data = await refreshPending();
      if (data.length === 0) {
        setToast({ type: "ok", message: "Nothing to sync." });
        return;
      }

      let ok = 0;
      let failed = 0;

      for (const item of data) {
        try {
          await sendAssessment(item);
          await deleteOffline(item.id);
          ok += 1;
        } catch (err) {
          console.warn("Sync failed", err);
          failed += 1;
          const next = {
            ...item,
            retryCount: (Number(item.retryCount) || 0) + 1,
            lastError: err?.message ?? String(err),
          };
          await saveOffline(next);
        }
      }

      await refreshPending();
      setLastSyncAt(Date.now());
      setToast({
        type: failed === 0 ? "ok" : "warn",
        message:
          failed === 0
            ? `Synced ${ok} assessment(s) successfully.`
            : `Synced ${ok}. Failed ${failed}. You can try again later.`,
      });
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      if (reason === "online") {
        // no-op: keep toast shown
      }
    }
  }

  useEffect(() => {
    if (!autoSync) return;
    if (!online) return;

    // When connectivity returns, sync once.
    syncData({ reason: "online" }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, online]);

  const removePhoto = (idx) => {
    setForm((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="topBarInner">
          <div className="brandRow">
            <div>
              <h1 className="title">Flood Damage Assessment</h1>
              <p className="subtitle">Madison County, NC • Offline-first field capture</p>
            </div>
          </div>

          <div className="pillRow">
            <span className="pill">
              <span className={`dot ${online ? "ok" : "down"}`} />
              {online ? "Online" : "Offline"}
            </span>
            <span className="pill">
              <strong style={{ color: "var(--text)" }}>{pendingCount}</strong>
              <span>pending</span>
            </span>
            <span className="pill">Last sync: {formatTime(lastSyncAt)}</span>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">New farm assessment</h2>
          </div>
          <div className="cardBody">
            <div className="field">
              <div className="label">Address</div>
              <textarea
                rows={1}
                placeholder="Farm address (or nearest landmark)"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>

            <div className="grid2" style={{ marginTop: 6 }}>
              <div className="field">
                <div className="label">Condition</div>
                <select
                  value={form.condition}
                  onChange={(e) => setForm((p) => ({ ...p, condition: e.target.value }))}
                >
                  <option value="Good">Good</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Bad">Bad</option>
                </select>
              </div>

              <div className="field">
                <div className="label">Total number of chickens</div>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="e.g. 1200"
                  value={form.chickenCount}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      chickenCount: e.target.value === "" ? "" : e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 6 }}>
              <div className="label">Photos (images only)</div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImage}
              />
              <div className="hint">
                Only image files are allowed. Selected: {form.photos.length}
              </div>
            </div>

            {photoPreviews.length > 0 && (
              <div className="thumbs" style={{ marginTop: 6 }}>
                {photoPreviews.map((p, idx) => (
                  <div className="thumb" key={p.id}>
                    <img src={p.src} alt={`Selected photo ${idx + 1}`} />
                    <button type="button" onClick={() => removePhoto(idx)} aria-label="Remove photo">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flex: 1 }}>
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setAutoSync(v);
                    try {
                      localStorage.setItem("autoSync", String(v));
                    } catch {
                      // ignore
                    }
                  }}
                  disabled={isSyncing}
                  aria-label="Auto-sync when online"
                  style={{ width: 18, height: 18, cursor: isSyncing ? "not-allowed" : "pointer" }}
                />
                <span style={{ fontSize: "0.95rem", color: "var(--text)" }}>Auto-sync</span>
              </label>
            </div>

            <div className="actions" style={{ marginTop: 8 }}>
              <button
                className="btn btnPrimary"
                onClick={handleSubmit}
                disabled={isSaving || form.address.trim() === "" || form.photos.length === 0}
              >
                {isSaving ? "Saving..." : "Save Offline"}
              </button>
              <button
                className="btn"
                onClick={() => syncData({ reason: "manual" })}
                disabled={isSyncing || pendingCount === 0 || !online}
              >
                {isSyncing ? "Syncing..." : online ? "Sync now" : "Offline"}
              </button>
            </div>



            {toast && (
              <div className={`toast ${toast.type}`}>
                {toast.message}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="footer" />
    </div>
  );
}

export default App;

