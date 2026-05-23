"use client";

import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { KakaoIcon } from "@/components/auth/KakaoIcon";
import { NaverIcon } from "@/components/auth/NaverIcon";
import { AppleIcon } from "@/components/auth/AppleIcon";
import { useTranslations } from "@/context/LocaleContext";

type Props = {
  disabled?: boolean;
  layout: "login" | "signup";
  onGoogle: () => void;
  onApple: () => void;
  onKakao: () => void;
  onNaver: () => void;
};

const btnBase =
  "w-full py-3 rounded-lg font-medium flex items-center justify-center gap-3 disabled:opacity-50 transition";

export default function SocialAuthButtons({
  disabled = false,
  layout,
  onGoogle,
  onApple,
  onKakao,
  onNaver,
}: Props) {
  const { t } = useTranslations();
  const prefix = layout === "login" ? "auth.login" : "auth.signup";

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={onGoogle}
        disabled={disabled}
        className={`${btnBase} border border-white/20 text-white hover:bg-white/5`}
      >
        <GoogleIcon />
        {t(`${prefix}.google`)}
      </button>

      <button
        type="button"
        onClick={onApple}
        disabled={disabled}
        className={`${btnBase} border border-white/20 text-white hover:bg-white/5`}
      >
        <AppleIcon />
        {t(`${prefix}.apple`)}
      </button>

      <button
        type="button"
        onClick={onKakao}
        disabled={disabled}
        className={`${btnBase} bg-[#FEE500] text-[#191919] hover:bg-[#f5dc00]`}
      >
        <KakaoIcon />
        {t(`${prefix}.kakao`)}
      </button>

      <button
        type="button"
        onClick={onNaver}
        disabled={disabled}
        className={`${btnBase} bg-[#03C75A] text-white hover:bg-[#02b351]`}
      >
        <NaverIcon />
        {t(`${prefix}.naver`)}
      </button>
    </div>
  );
}
