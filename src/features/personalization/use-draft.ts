"use client";
import { useRef, useState } from "react";
import type { DraftReply } from "./actions";
/** Serializes writes, coalesces fast edits, and uses DB versions to reject stale tabs. No browser storage. */
export function useDraft<T>(initial: T, version: number, persist: (value: T, version: number) => Promise<DraftReply>) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"saved" | "saving" | "error" | "conflict">("saved");
  const current = useRef(initial), pending = useRef<T | null>(null), revision = useRef(version);
  const running = useRef<Promise<boolean> | null>(null);
  const blocked = useRef(false);
  async function drain(): Promise<boolean> {
    setStatus("saving");
    while (pending.current !== null) {
      const snapshot = pending.current; pending.current = null;
      let result: DraftReply;
      try { result = await persist(snapshot, revision.current); } catch { result = { error: "error" }; }
      if (result.error || result.version === undefined) {
        pending.current ??= snapshot;
        blocked.current = result.error === "conflict";
        setStatus(result.error ?? "error"); return false;
      }
      revision.current = result.version;
    }
    setStatus("saved"); return true;
  }
  function flush(): Promise<boolean> {
    if (blocked.current) return Promise.resolve(false);
    if (running.current) return running.current;
    running.current = drain().finally(() => { running.current = null; });
    return running.current;
  }
  function update(next: T) { current.current = next; setValue(next); pending.current = next; void flush(); }
  return { value, current, status, update, flush };
}
