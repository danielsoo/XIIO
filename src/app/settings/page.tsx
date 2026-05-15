"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import ProfileAvatar from "@/components/ProfileAvatar";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { activeProfile, clearActiveProfile } = useProfile();
  const router = useRouter();

  const handleLogout = async () => {
    clearActiveProfile();
    await logout();
    router.push("/");
  };

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-xiio-bg text-xiio-muted">
        <Link href="/login" className="text-xiio-accent hover:underline">
          로그인이 필요합니다
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 bg-xiio-bg">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">설정</h1>

        {activeProfile && (
          <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 mb-6">
            <h2 className="text-sm font-semibold text-xiio-muted mb-4">시청 프로필</h2>
            <div className="flex items-center gap-4">
              <ProfileAvatar profile={activeProfile} size="lg" />
              <div>
                <p className="text-white font-medium">{activeProfile.name}</p>
                <Link href="/profiles" className="text-sm text-xiio-accent hover:underline mt-1 inline-block">
                  프로필 변경
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="bg-xiio-surface rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-sm font-semibold text-xiio-muted mb-4">계정</h2>
          <p className="text-sm text-white mb-1">{user.email}</p>
          <p className="text-xs text-xiio-muted">
            {user.emailVerified ? "이메일 인증 완료" : "이메일 미인증"}
          </p>
        </section>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
