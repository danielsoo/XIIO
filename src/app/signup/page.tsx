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
import { resolvePostLoginPath } from "@/lib/activeWatchProfile";
import {
  FIRESTORE_PERMISSION_DENIED,
  hasUserProfile,
  markEmailVerified,
  saveUserProfile,
} from "@/lib/userProfile";
import type { PlatformPurpose, SignupProfile } from "@/types/user";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { useTranslations } from "@/context/LocaleContext";

const inputClass =
  "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-xiio-accent transition";

type StepId = "basic" | "student" | "purpose" | "account";

/** Google(또는 이미 {t("common.login")}된) 가입은 프로필·설문만 — 이메일/비밀번호 단계 없음 */
function buildStepList(skipAccountStep: boolean): StepId[] {
  const steps: StepId[] = ["basic", "student", "purpose"];
  if (!skipAccountStep) steps.push("account");
  return steps;
}

function isGoogleAuthUser(user: { providerData: { providerId: string }[] } | null): boolean {
  return !!user?.providerData.some((p) => p.providerId === "google.com");
}

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
  const { t } = useTranslations();
  const router = useRouter();

  const stepLabels: Record<StepId, string> = useMemo(
    () => ({
      basic: t("auth.signup.stepBasic"),
      student: t("auth.signup.stepStudent"),
      purpose: t("auth.signup.stepPurpose"),
      account: t("auth.signup.stepAccount"),
    }),
    [t]
  );

  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase | null>(null);
  const [sentEmail, setSentEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const [googlePending, setGooglePending] = useState(false);
  /** Auth에는 있으나 Firestore users 문서가 없을 때 ({t("common.login")}만 한 경우) */
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

  const googleSignup = useMemo(() => {
    if (googlePending) return true;
    if (profileOnlyMode && isGoogleAuthUser(auth?.currentUser ?? null)) return true;
    return isGoogleAuthUser(auth?.currentUser ?? null);
  }, [googlePending, profileOnlyMode, auth?.currentUser]);

  const steps = useMemo(() => buildStepList(googleSignup), [googleSignup]);
  const currentStep = steps[stepIndex] ?? "basic";
  const googleEmail = auth?.currentUser?.email ?? email;
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

  // Google 연결 후 account 단계로 남지 않도록
  useEffect(() => {
    if (!googleSignup) return;
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [googleSignup, stepIndex, steps.length]);

  // {t("common.login")}만 하고 Firestore 프로필이 없는 경우 → 가입 단계만 이어서 진행
  useEffect(() => {
    const currentUser = auth?.currentUser;
    if (!currentUser || verifyPhase) return;

    let cancelled = false;
    (async () => {
      const exists = await hasUserProfile(currentUser.uid);
      if (cancelled || exists) return;
      if (currentUser.displayName) setName(currentUser.displayName);
      if (currentUser.email) setEmail(currentUser.email);
      const isGoogle = isGoogleAuthUser(currentUser);
      if (isGoogle) {
        setGooglePending(true);
        setProfileOnlyMode(true);
      } else {
        setProfileOnlyMode(true);
      }
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
          setError(t("auth.signup.errorNameRequired"));
          return false;
        }
        const ageNum = parseInt(age, 10);
        if (!age || Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          setError(t("auth.signup.errorAgeInvalid"));
          return false;
        }
        return true;
      }
      case "student":
        if (isStudent === null) {
          setError(t("auth.signup.errorStudentRequired"));
          return false;
        }
        if (isStudent && !school.trim()) {
          setError(t("auth.signup.errorSchoolRequired"));
          return false;
        }
        return true;
      case "purpose":
        if (!platformPurpose) {
          setError(t("auth.signup.errorPurposeRequired"));
          return false;
        }
        return true;
      case "account":
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError(t("auth.signup.errorEmailInvalid"));
          return false;
        }
        if (password.length < 6) {
          setError(t("auth.signup.errorPasswordMin"));
          return false;
        }
        if (password !== confirm) {
          setError(t("auth.signup.errorPasswordMismatch"));
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
      setError(t("auth.signup.errorFirebaseNotConfigured"));
      setLoading(false);
      return;
    }

    try {
      if (googleSignup || profileOnlyMode) {
        const currentUser = auth?.currentUser;
        if (!currentUser) {
          setError(t("auth.signup.errorSessionExpired"));
          return;
        }
        await updateProfile(currentUser, { displayName: profile.displayName });
        await saveUserProfile(currentUser.uid, profile, currentUser.email, {
          emailVerified: isGoogleAuthUser(currentUser) || currentUser.emailVerified,
        });
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
        setError(t("auth.signup.errorVerifySendFailedResend"));
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
          router.push(resolvePostLoginPath(auth!.currentUser!.uid, "/profiles"));
          return;
        } catch (resumeErr) {
          console.error("[signup] resume failed", resumeErr);
          setError(formatSignupErrorMessage(resumeErr, t));
          const accountIdx = steps.indexOf("account");
          if (accountIdx >= 0) setStepIndex(accountIdx);
          setLoading(false);
          return;
        }
      }

      if (message === FIRESTORE_PERMISSION_DENIED || code === "permission-denied") {
        setError(t("auth.signup.errorFirestoreRules"));
      } else {
        setError(formatSignupErrorMessage(err, t));
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
        setError(t("auth.signup.errorReviewInput"));
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
        router.push(resolvePostLoginPath(googleUser.uid, "/profiles"));
        return;
      }
      if (googleUser.displayName) setName(googleUser.displayName);
      if (googleUser.email) setEmail(googleUser.email);
      setGooglePending(true);
      setProfileOnlyMode(true);

      const profile = buildProfile();
      if (profile) {
        await finishSignup(profile);
        return;
      }

      setStepIndex(0);
    } catch (err) {
      setError(formatSignupErrorMessage(err, t));
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
      setError(t("auth.signup.errorVerifyPending"));
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setResendMessage("");
    try {
      await resendVerificationEmail();
      setResendMessage(t("auth.signup.verifyResent"));
    } catch (err) {
      setError(formatSignupErrorMessage(err, t));
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
            <h1 className="text-xl font-bold text-white text-center mb-2">{t("auth.signup.verifyPendingTitle")}</h1>
            <p className="text-sm text-xiio-muted text-center mb-6">
              {t("auth.signup.verifyPendingBody", { email: sentEmail })}
            </p>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm whitespace-pre-wrap break-words">
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
              {t("auth.signup.verifyCheck")}
            </button>
            <button
              type="button"
              onClick={() => void handleResendVerification()}
              className="w-full py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition text-sm"
            >
              {t("auth.signup.verifyResend")}
            </button>
          </div>
        )}

        {verifyPhase === "verified" && (
          <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10 text-center">
            <h1 className="text-xl font-bold text-white mb-2">{t("auth.signup.verifyDoneTitle")}</h1>
            <p className="text-sm text-xiio-muted mb-6">{t("auth.signup.verifyDoneSubtitle")}</p>
            <Link
              href="/login"
              className="inline-block w-full py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover text-white font-semibold transition"
            >
              {t("auth.signup.verifyDoneCta")}
            </Link>
          </div>
        )}

        {verifyPhase === null && (
        <div className="bg-xiio-surface rounded-2xl p-8 border border-white/10 min-h-[420px] flex flex-col">
          {!googleSignup ? (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={loading}
                className="w-full py-3 rounded-lg border border-white/20 text-white font-medium flex items-center justify-center gap-3 hover:bg-white/5 disabled:opacity-50 transition"
              >
                <GoogleIcon />
                {t("auth.signup.googleSignup")}
              </button>
              <p className="text-xs text-xiio-muted text-center mt-2">
                {t("auth.signup.googleSignupHint")}
              </p>
              <div className="flex items-center gap-3 mt-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-xiio-muted">{t("auth.signup.emailSignupDivider")}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-xiio-accent/30 bg-xiio-accent/10 px-4 py-3">
              <p className="text-sm text-white font-medium">{t("auth.signup.googleConnected")}</p>
              <p className="text-xs text-xiio-muted mt-1">{googleEmail}</p>
              <p className="text-xs text-xiio-muted mt-2">
                {t("auth.signup.googleConnectedHint")}
              </p>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between text-xs text-xiio-muted mb-2">
              <span>{stepLabels[currentStep]}</span>
              <span>{t("auth.signup.stepProgress", { current: stepIndex + 1, total: steps.length })}</span>
            </div>
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-xiio-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm whitespace-pre-wrap break-words">
              {error}
            </div>
          )}

          <form
            onSubmit={handleFormSubmit}
            onKeyDown={handleFormKeyDown}
            className="flex-1 flex flex-col justify-center"
          >
            {currentStep === "basic" && (
              <StepShell title={t("auth.signup.basicTitle")} subtitle={t("auth.signup.basicSubtitle")}>
                <div className="flex flex-col gap-4">
                  <Field label={t("auth.signup.nameLabel")}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                      placeholder={t("auth.signup.namePlaceholder")}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("auth.signup.ageLabel")}>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={t("auth.signup.agePlaceholder")}
                      className={inputClass}
                    />
                  </Field>
                </div>
              </StepShell>
            )}

            {currentStep === "student" && (
              <StepShell title={t("auth.signup.studentTitle")} subtitle={t("auth.signup.studentSubtitle")}>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3">
                    <ChoiceButton
                      selected={isStudent === true}
                      onClick={() => setIsStudent(true)}
                      label={t("auth.signup.studentYes")}
                    />
                    <ChoiceButton
                      selected={isStudent === false}
                      onClick={() => {
                        setIsStudent(false);
                        setSchool("");
                      }}
                      label={t("auth.signup.studentNo")}
                    />
                  </div>

                  {isStudent === true && (
                    <Field label={t("auth.signup.schoolLabel")}>
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        autoFocus
                        placeholder={t("auth.signup.schoolPlaceholder")}
                        className={inputClass}
                      />
                    </Field>
                  )}
                </div>
              </StepShell>
            )}

            {currentStep === "purpose" && (
              <StepShell title={t("auth.signup.purposeTitle")} subtitle={t("auth.signup.purposeSubtitle")}>
                <div className="flex flex-col gap-3">
                  <PurposeOption
                    selected={platformPurpose === "watch"}
                    onClick={() => setPlatformPurpose("watch")}
                    title={t("auth.signup.purposeWatchTitle")}
                    description={t("auth.signup.purposeWatchDesc")}
                  />
                  <PurposeOption
                    selected={platformPurpose === "upload"}
                    onClick={() => setPlatformPurpose("upload")}
                    title={t("auth.signup.purposeUploadTitle")}
                    description={t("auth.signup.purposeUploadDesc")}
                  />
                </div>
              </StepShell>
            )}

            {currentStep === "account" && !googleSignup && (
              <StepShell title={t("auth.signup.accountTitle")} subtitle={t("auth.signup.accountSubtitle")}>
                <div className="flex flex-col gap-4">
                  <Field label={t("auth.signup.emailLabel")}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("auth.signup.passwordLabel")}>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("auth.signup.passwordPlaceholder")}
                      className={inputClass}
                    />
                  </Field>
                  <Field label={t("auth.signup.confirmPasswordLabel")}>
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
                {t("common.previous")}
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`py-3 rounded-lg bg-xiio-accent hover:bg-xiio-accent-hover disabled:opacity-50 text-white font-semibold transition ${
                stepIndex === 0 ? "w-full" : "flex-1"
              }`}
            >
              {loading ? t("common.processing") : isLastStep ? t("auth.signup.submitSignup") : t("common.next")}
            </button>
          </div>
          </form>

        </div>
        )}

        {verifyPhase === null && (
          <p className="mt-6 text-center text-sm text-xiio-muted">
            {t("auth.signup.hasAccount")}{" "}
            <Link href="/login" className="text-xiio-accent hover:underline">
              {t("common.login")}
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

