"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LocaleContext";
import { formatLastActive } from "@/lib/formatLastActive";
import type { ProfilePost } from "@/types/profilePost";

type Props = {
  handle: string;
  isSelf: boolean;
};

export default function ProfileOwnerPostsPanel({ handle, isSelf }: Props) {
  const { user } = useAuth();
  const { t, locale } = useTranslations();
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = {};
      if (user) {
        const token = await user.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`/api/people/${encodeURIComponent(handle)}/posts`, { headers });
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = (await res.json()) as { posts?: ProfilePost[] };
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [handle, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const authHeaders = async (): Promise<HeadersInit> => {
    if (!user) throw new Error("no_user");
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const handlePost = async () => {
    if (!draft.trim() || !isSelf) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/people/${encodeURIComponent(handle)}/posts`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ text: draft }),
      });
      if (res.ok) {
        setDraft("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editDraft.trim() || !isSelf) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/people/${encodeURIComponent(handle)}/posts/${encodeURIComponent(postId)}`,
        {
          method: "PATCH",
          headers: await authHeaders(),
          body: JSON.stringify({ text: editDraft }),
        }
      );
      if (res.ok) {
        setEditingId(null);
        setEditDraft("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!isSelf) return;
    if (!window.confirm(t("network.people.posts.deleteConfirm"))) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/people/${encodeURIComponent(handle)}/posts/${encodeURIComponent(postId)}`,
        { method: "DELETE", headers: await authHeaders() }
      );
      if (res.ok) await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="min-w-0 w-full xl:w-[340px] xl:shrink-0">
      <h2 className="mb-4 text-lg font-semibold text-white">{t("network.people.posts.title")}</h2>

      {isSelf ? (
        <div className="mb-6 space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("network.people.posts.placeholder")}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-xiio-accent/50 focus:outline-none"
          />
          <button
            type="button"
            disabled={busy || !draft.trim() || !user}
            onClick={() => void handlePost()}
            className="rounded-lg bg-xiio-accent px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40"
          >
            {t("network.people.posts.publish")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-white/40">{t("common.loading")}</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-white/40">{t("network.people.posts.empty")}</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              {editingId === post.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={4}
                    className="w-full resize-y rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-white focus:border-xiio-accent/50 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || !editDraft.trim()}
                      onClick={() => void handleSaveEdit(post.id)}
                      className="rounded-lg bg-xiio-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                    >
                      {t("network.people.posts.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft("");
                      }}
                      className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/70"
                    >
                      {t("common.cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                    {post.text}
                  </p>
                  {post.createdAt ? (
                    <p className="mt-2 text-xs text-white/35">
                      {formatLastActive(post.createdAt, locale)}
                    </p>
                  ) : null}
                  {isSelf ? (
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(post.id);
                          setEditDraft(post.text);
                        }}
                        className="text-xs text-white/50 hover:text-white"
                      >
                        {t("network.people.posts.edit")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(post.id)}
                        className="text-xs text-red-400/80 hover:text-red-400"
                      >
                        {t("network.people.posts.delete")}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
