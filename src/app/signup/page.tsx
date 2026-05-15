"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { hasUserProfile, saveUserProfile } from "@/lib/userProfile";
import type { PlatformPurpose, SignupProfile } from "@/types/user";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent transition";

type StepId = "basic" | "student" | "purpose" | "account";

function buildStepList(googlePending: boolean): StepId[] {
  const steps: StepId[] = ["basic", "student", "purpose"];
  if (!googlePending) steps.push("account");
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
  const { signupWithEmail, loginWithGoogle, logout, resendVerificationEmail, reloadUser } =
    useAuth();
  const router = useRouter();

  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase | null>(null);
  const [sentEmail, setSentEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const [googlePending, setGooglePending] = useState(false);
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

  const steps = useMemo(() => buildStepList(googlePending), [googlePending]);
  const currentStep = steps[stepIndex] ?? "basic";
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    if (verifyPhase !== "pending" || !auth?.currentUser) return;

    const poll = async () => {
      try {
        const verified = await reloadUser();
        if (verified) {
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
    try {
      if (googlePending) {
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
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
        const accountIdx = steps.indexOf("account");
        if (accountIdx >= 0) setStepIndex(accountIdx);
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.");
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

      const nextSteps = buildStepList(true);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentStep !== "purpose") {
      e.preventDefault();
      void handleNext();
    }
  };

  const handleCheckVerification = async () => {
    setError("");
    setResendMessage("");
    const verified = await reloadUser();
    if (verified) {
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

          {googlePending && currentStep !== "account" && (
            <p className="text-xs text-xiio-accent mb-4">Google 계정이 연결되었습니다.</p>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center" onKeyDown={handleKeyDown}>
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

                <div className="flex items-center gap-3 mt-6">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-xiio-muted">또는</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded-lg border border-white/20 text-white text-sm font-medium flex items-center justify-center gap-3 hover:bg-white/5 disabled:opacity-50 transition"
                >
                  <GoogleIcon />
                  Google로 가입
                </button>
              </StepShell>
            )}
          </div>

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
              type="button"
              onClick={() => void handleNext()}
              disabled={loading}
              className={`py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition ${
                stepIndex === 0 ? "w-full" : "flex-1"
              }`}
            >
              {loading ? "처리 중..." : isLastStep ? "가입하기" : "다음"}
            </button>
          </div>
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

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
