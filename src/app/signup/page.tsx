"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "firebase/auth";
import {
  SIGNUP_VERIFY_EMAIL_FAILED,
  useAuth,
} from "@/context/AuthContext";
import { formatAuthError, formatSignupErrorMessage } from "@/lib/authErrors";
import { auth, db } from "@/lib/firebase";
import {
  FIRESTORE_PERMISSION_DENIED,
  hasUserProfile,
  markEmailVerified,
  saveUserProfile,
} from "@/lib/userProfile";
import type { PlatformPurpose, SignupProfile } from "@/types/user";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent transition";

type StepId = "basic" | "student" | "purpose" | "account";

function buildStepList(googlePending: boolean, profileOnly: boolean): StepId[] {
  const steps: StepId[] = ["basic", "student", "purpose"];
  if (!googlePending && !profileOnly) steps.push("account");
  return steps;
}

const STEP_LABELS: Record<StepId, string> = {
  basic: "기본 정보",
  student: "학생 정보",
  purpose: "이용 목적",
  account: "계정 만들기",
};

type VerifyPhase = "pending" | "verified";

export default function SignupPage() {
  const {
    signupWithEmail,
    resumeEmailSignup,
    loginWithGoogle,
    logout,
    resendVerificationEmail,
    reloadUser,
  } = useAuth();
  const router = useRouter();

  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase | null>(null);
  const [sentEmail, setSentEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const [googlePending, setGooglePending] = useState(false);
  /** Auth에는 있으나 Firestore users 문서가 없을 때 (로그인만 한 경우) */
  const [profileOnlyMode, setProfileOnlyMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [isStudent, setIsStudent] = useState<boolean | null>(null);
  const [school, setSchool] = useState("");
  const [platformPurpose, setPlatformPurpose] = useState<PlatformPurpose | "">("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = useMemo(
    () => buildStepList(googlePending, profileOnlyMode),
    [googlePending, profileOnlyMode]
  );
  const currentStep = steps[stepIndex] ?? "basic";
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (verifyPhase !== "pending" || !auth?.currentUser) return;

    const poll = async () => {
      try {
        const verified = await reloadUser();
        if (verified && auth?.currentUser) {
          await markEmailVerified(auth.currentUser.uid);
          await logout();
          setVerifyPhase("verified");
        }
      } catch {
        // reload 실패 시 무시하고 다음 폴링에서 재시도
      }
    };

    const interval = setInterval(() => void poll(), 4000);
    return () => clearInterval(interval);
  }, [verifyPhase, reloadUser, logout]);

  // 가입은 됐는데 화면 전환 전 새로고침·멈춤 시 인증 대기 화면 복구
  useEffect(() => {
    const currentUser = auth?.currentUser;
    if (!currentUser || verifyPhase || googlePending) return;
    if (currentUser.emailVerified) return;
    const isEmailProvider = currentUser.providerData.some((p) => p.providerId === "password");
    if (!isEmailProvider || !currentUser.email) return;

    setSentEmail(currentUser.email);
    setVerifyPhase("pending");
    setLoading(false);
  }, [verifyPhase, googlePending]);

  // 로그인만 하고 Firestore 프로필이 없는 경우 → 가입 단계만 이어서 진행
  useEffect(() => {
    const currentUser = auth?.currentUser;
    if (!currentUser || verifyPhase) return;

    let cancelled = false;
    (async () => {
      const exists = await hasUserProfile(currentUser.uid);
      if (cancelled || exists) return;
      if (currentUser.displayName) setName(currentUser.displayName);
      if (currentUser.email) setEmail(currentUser.email);
      const isGoogle = currentUser.providerData.some((p) => p.providerId === "google.com");
      setGooglePending(isGoogle);
      setProfileOnlyMode(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [verifyPhase]);

  const buildProfile = (): SignupProfile | null => {
    const ageNum = parseInt(age, 10);
    if (!name.trim() || !age || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) return null;
    if (isStudent === null || !platformPurpose) return null;
    if (isStudent && !school.trim()) return null;
    return {
      displayName: name.trim(),
      age: ageNum,
      isStudent,
      schoolName: isStudent ? school.trim() : undefined,
      platformPurpose,
    };
  };

  const validateStep = (step: StepId): boolean => {
    switch (step) {
      case "basic": {
        if (!name.trim()) {
          setError("이름을 입력해주세요.");
          return false;
        }
        const ageNum = parseInt(age, 10);
        if (!age || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          setError("올바른 나이를 입력해주세요.");
          return false;
        }
        return true;
      }
      case "student":
        if (isStudent === null) {
          setError("학생 여부를 선택해주세요.");
          return false;
        }
        if (isStudent && !school.trim()) {
          setError("학교명을 입력해주세요.");
          return false;
        }
        return true;
      case "purpose":
        if (!platformPurpose) {
          setError("이용 목적을 선택해주세요.");
          return false;
        }
        return true;
      case "account":
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError("올바른 이메일을 입력해주세요.");
          return false;
        }
        if (password.length < 6) {
          setError("비밀번호는 6자 이상이어야 합니다.");
          return false;
        }
        if (password !== confirm) {
          setError("비밀번호가 일치하지 않습니다.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const finishSignup = async (profile: SignupProfile) => {
    setLoading(true);
    setError("");

    if (!auth || !db) {
      setError(
        "Firebase가 연결되지 않았습니다. 환경 변수와 NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID=xiio 설정을 확인하세요."
      );
      setLoading(false);
      return;
    }

    try {
      if (googlePending || profileOnlyMode) {
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          setError("로그인 세션이 만료되었습니다. 다시 시도해주세요.");
          return;
        }
        await updateProfile(currentUser, { displayName: profile.displayName });
        await saveUserProfile(currentUser.uid, profile, currentUser.email);
      } else {
        await signupWithEmail(email, password, profile);
        setSentEmail(email);
        setVerifyPhase("pending");
        setLoading(false);
        return;
      }
      router.push("/profiles");
    } catch (err: unknown) {
      const { code, message } = formatAuthError(err);
      console.error("[signup] failed", { code, message, err });

      if (message === SIGNUP_VERIFY_EMAIL_FAILED) {
        setSentEmail(email);
        setVerifyPhase("pending");
        setError("인증 메일 전송에 실패했습니다. 아래 «인증 메일 다시 보내기»를 눌러주세요.");
        setLoading(false);
        return;
      }

      if (code === "auth/email-already-in-use") {
        try {
          const { needsVerification } = await resumeEmailSignup(email, password, profile);
          if (needsVerification) {
            setSentEmail(email);
            setVerifyPhase("pending");
            setLoading(false);
            return;
          }
          router.push("/profiles");
          return;
        } catch (resumeErr) {
          console.error("[signup] resume failed", resumeErr);
          setError(formatSignupErrorMessage(resumeErr));
          const accountIdx = steps.indexOf("account");
          if (accountIdx >= 0) setStepIndex(accountIdx);
          setLoading(false);
          return;
        }
      }

      if (message === FIRESTORE_PERMISSION_DENIED || code === "permission-denied") {
        setError(
          "프로필을 Firestore에 저장하지 못했습니다. Console → Firestore → DB «xiio» → 규칙 탭에서 firestore.rules를 게시하세요."
        );
      } else {
        setError(formatSignupErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError("");
    if (!validateStep(currentStep)) return;

    if (isLastStep) {
      const profile = buildProfile();
      if (!profile) {
        setError("입력 정보를 다시 확인해주세요.");
        return;
      }
      await finishSignup(profile);
      return;
    }

    setStepIndex((i) => i + 1);
  };

  const handleBack = () => {
    setError("");
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const googleUser = await loginWithGoogle();
      if (await hasUserProfile(googleUser.uid)) {
        router.push("/profiles");
        return;
      }
      if (googleUser.displayName) setName(googleUser.displayName);
      setGooglePending(true);

      const profile = buildProfile();
      if (profile) {
        await finishSignup(profile);
        return;
      }

      const nextSteps = buildStepList(true, false);
      if (!name.trim() || !age) setStepIndex(nextSteps.indexOf("basic"));
      else if (isStudent === null || (isStudent && !school.trim()))
        setStepIndex(nextSteps.indexOf("student"));
      else if (!platformPurpose) setStepIndex(nextSteps.indexOf("purpose"));
    } catch {
      setError("Google 가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleNext();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    if (currentStep === "purpose" && !platformPurpose) return;
    if (currentStep === "student" && isStudent === null) return;
    if (currentStep === "student" && isStudent && !school.trim()) return;
    e.preventDefault();
    void handleNext();
  };

  const handleCheckVerification = async () => {
    setError("");
    setResendMessage("");
    const verified = await reloadUser();
    if (verified && auth?.currentUser) {
      await markEmailVerified(auth.currentUser.uid);
      await logout();
      setVerifyPhase("verified");
    } else {
      setError("아직 이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.");
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setResendMessage("");
    try {
      await resendVerificationEmail();
      setResendMessage("인증 메일을 다시 보냈습니다.");
    } catch {
      setError("인증 메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-xiio-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black tracking-widest text-white">
            X<span className="text-xiio-accent">II</span>O
          </Link>
        </div>

        {verifyPhase === "pending" && (
          <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10">
            <h1 className="text-xl font-bold text-white text-center mb-2">인증 메일을 보냈습니다</h1>
            <p className="text-sm text-xiio-muted text-center mb-6">
              <span className="text-white">{sentEmail}</span>
              (으)로 인증 메일을 발송했습니다. 메일함을 열어 인증 링크를 눌러 주세요.
            </p>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            {resendMessage && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                {resendMessage}
              </div>
            )}
            <button
              type="button"
              onClick={() => void handleCheckVerification()}
              className="w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition mb-3"
            >
              인증 완료 확인
            </button>
            <button
              type="button"
              onClick={() => void handleResendVerification()}
              className="w-full py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition text-sm"
            >
              인증 메일 다시 보내기
            </button>
          </div>
        )}

        {verifyPhase === "verified" && (
          <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10 text-center">
            <h1 className="text-xl font-bold text-white mb-2">이메일 인증이 완료되었습니다</h1>
            <p className="text-sm text-xiio-muted mb-6">로그인을 완료해 주세요.</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition"
            >
              로그인하기
            </Link>
          </div>
        )}

        {verifyPhase === null && (
        <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10 min-h-[420px] flex flex-col">
          <div className="mb-6">
            <div className="flex justify-between text-xs text-xiio-muted mb-2">
              <span>{STEP_LABELS[currentStep]}</span>
              <span>
                {stepIndex + 1} / {steps.length}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-xiio-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {(googlePending || profileOnlyMode) && currentStep !== "account" && (
            <p className="text-xs text-xiio-accent mb-4">
              {profileOnlyMode && !googlePending
                ? "프로필 정보를 입력하면 Firestore에 저장됩니다."
                : "Google 계정이 연결되었습니다."}
            </p>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            onKeyDown={handleFormKeyDown}
            className="flex-1 flex flex-col justify-center"
          >
            {currentStep === "basic" && (
              <StepShell title="기본 정보를 알려주세요" subtitle="이름과 나이를 입력해주세요">
                <div className="flex flex-col gap-4">
                  <Field label="이름">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      placeholder="홍길동"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="나이">
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="예: 20"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </StepShell>
            )}

            {currentStep === "student" && (
              <StepShell title="학생이신가요?" subtitle="해당되는 항목을 선택해주세요">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <ChoiceButton
                      selected={isStudent === true}
                      onClick={() => setIsStudent(true)}
                      label="네, 학생이에요"
                    />
                    <ChoiceButton
                      selected={isStudent === false}
                      onClick={() => {
                        setIsStudent(false);
                        setSchool("");
                      }}
                      label="아니요"
                    />
                  </div>

                  {isStudent === true && (
                    <Field label="학교">
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        autoFocus
                        placeholder="예: 서울대학교"
                        className={inputClass}
                      />
                    </Field>
                  )}
                </div>
              </StepShell>
            )}

            {currentStep === "purpose" && (
              <StepShell title="XIIO에 오신 목적은?" subtitle="하나를 선택해주세요">
                <div className="flex flex-col gap-3">
                  <PurposeOption
                    selected={platformPurpose === "watch"}
                    onClick={() => setPlatformPurpose("watch")}
                    title="영상을 보러 왔어요"
                    description="콘텐츠를 시청하고 즐기고 싶어요"
                  />
                  <PurposeOption
                    selected={platformPurpose === "upload"}
                    onClick={() => setPlatformPurpose("upload")}
                    title="영상을 올리러 왔어요"
                    description="직접 콘텐츠를 업로드하고 싶어요"
                  />
                </div>
              </StepShell>
            )}

            {currentStep === "account" && (
              <StepShell title="계정을 만들어주세요" subtitle="로그인에 사용할 정보입니다">
                <div className="flex flex-col gap-4">
                  <Field label="이메일">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="비밀번호">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6자 이상"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="비밀번호 확인">
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </Field>
                </div>

              </StepShell>
            )}

            <div className="flex gap-3 mt-auto pt-6">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 disabled:opacity-50 transition"
              >
                이전
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition ${
                stepIndex === 0 ? "w-full" : "flex-1"
              }`}
            >
              {loading ? "처리 중..." : isLastStep ? "가입하기" : "다음"}
            </button>
          </div>
          </form>

          {!googlePending && (
            <>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-xiio-muted">또는</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={loading}
                className="w-full mt-4 py-3 rounded-lg border border-white/20 text-white text-sm font-medium flex items-center justify-center gap-3 hover:bg-white/5 disabled:opacity-50 transition"
              >
                <GoogleIcon />
                Google로 가입
              </button>
            </>
          )}
        </div>
        )}

        {verifyPhase === null && (
          <p className="mt-6 text-center text-sm text-xiio-muted">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-xiio-accent hover:underline">
              로그인
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-xiio-muted mb-6">{subtitle}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-xiio-muted mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition ${
        selected
          ? "border-xiio-accent bg-xiio-accent/20 text-white"
          : "border-white/10 text-xiio-muted hover:border-white/30 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function PurposeOption({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
        selected
          ? "border-xiio-accent bg-xiio-accent/15"
          : "border-white/10 hover:border-white/25"
      }`}
    >
      <span className="block text-sm font-medium text-white">{title}</span>
      <span className="block text-xs text-xiio-muted mt-0.5">{description}</span>
    </button>
  );
}

