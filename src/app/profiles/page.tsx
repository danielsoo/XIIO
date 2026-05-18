"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useTranslations } from "@/context/LocaleContext";
import type { WatchProfile } from "@/types/profile";
import { MAX_WATCH_PROFILES } from "@/types/profile";

export default function ProfilesPage() {
  const { t } = useTranslations();
  const { user, loading: authLoading } = useAuth();
  const {
    profiles,
    loading,
    selectProfile,
    addProfile,
    editProfile,
    removeProfile,
    canAddProfile,
  } = useProfile();
  const router = useRouter();

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<WatchProfile | null>(null);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setAvatarFile(null);
    setPreview(null);
    setError("");
    setModal("add");
  };

  const openEdit = (p: WatchProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(p);
    setName(p.name);
    setAvatarFile(null);
    setPreview(p.avatarUrl);
    setError("");
    setModal("edit");
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("profiles.errorImageOnly"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("profiles.errorImageSize"));
      return;
    }
    setError("");
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setAvatarFile(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t("profiles.errorNameRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (modal === "add") {
        await addProfile(name, avatarFile ?? undefined);
      } else if (editing) {
        await editProfile(editing.id, {
          name,
          avatarFile: avatarFile ?? undefined,
        });
      }
      closeModal();
    } catch {
      setError(t("profiles.errorSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm(t("profiles.confirmDelete", { name: editing.name }))) return;
    setSaving(true);
    try {
      await removeProfile(editing.id);
      closeModal();
    } catch {
      setError(t("profiles.errorDeleteFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (p: WatchProfile) => {
    selectProfile(p);
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
        {t("common.loading")}
      </main>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-xiio-bg">
      <Link href="/" className="text-3xl font-black tracking-widest text-white mb-12">
        X<span className="text-xiio-accent">II</span>O
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
        {t("profiles.title")}
      </h1>
      <p className="text-sm text-xiio-muted mb-10 text-center">
        {t("profiles.subtitle")}
      </p>

      <div className="flex flex-wrap justify-center gap-6 md:gap-10 max-w-3xl">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelect(p)}
            className="group flex flex-col items-center gap-3 focus:outline-none"
          >
            <div className="relative">
              <ProfileAvatar
                profile={p}
                size="xl"
                className="group-hover:ring-4 group-hover:ring-white transition-all duration-200"
              />
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => openEdit(p, e)}
                onKeyDown={(e) => e.key === "Enter" && openEdit(p, e as unknown as React.MouseEvent)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-xiio-surface border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs text-white"
                aria-label={t("profiles.editAria")}
              >
                ✎
              </span>
            </div>
            <span className="text-sm text-xiio-muted group-hover:text-white transition">
              {p.name}
            </span>
          </button>
        ))}

        {canAddProfile && (
          <button
            type="button"
            onClick={openAdd}
            className="flex flex-col items-center gap-3 focus:outline-none group"
          >
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-4xl text-xiio-muted group-hover:border-white group-hover:text-white transition">
              +
            </div>
            <span className="text-sm text-xiio-muted group-hover:text-white transition">
              {t("profiles.add")}
            </span>
          </button>
        )}
      </div>

      <p className="mt-12 text-xs text-xiio-muted">
        {t("profiles.maxHint", { max: MAX_WATCH_PROFILES })}
      </p>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70">
          <div className="w-full max-w-md bg-xiio-surface rounded-2xl p-8 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">
              {modal === "add" ? t("profiles.modalAdd") : t("profiles.modalEdit")}
            </h2>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center mb-6">
              <label className="cursor-pointer group">
                {preview ? (
                  <img
                    src={preview}
                    alt={t("profiles.previewAlt")}
                    className="w-28 h-28 rounded-full object-cover border-2 border-white/20 group-hover:border-xiio-accent transition"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-dashed border-white/30 flex items-center justify-center text-xiio-muted group-hover:border-xiio-accent transition text-sm text-center px-2">
                    {t("profiles.uploadPhoto")}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
              <p className="text-xs text-xiio-muted mt-2">{t("profiles.uploadPhotoHint")}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-xiio-muted mb-1.5">{t("profiles.nameLabel")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder={t("profiles.namePlaceholder")}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent transition"
              />
            </div>

            <div className="flex gap-3">
              {modal === "edit" && (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={saving}
                  className="px-4 py-3 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition text-sm"
                >
                  {t("common.delete")}
                </button>
              )}
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex-1 py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
