"use client";

import Script from "next/script";

const KAKAO_SDK = "https://developers.kakao.com/sdk/js/kakao.min.js";

export default function KakaoScript() {
  const jsKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim();
  if (!jsKey) return null;

  return (
    <Script
      src={KAKAO_SDK}
      strategy="lazyOnload"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          window.Kakao.init(jsKey);
        }
      }}
    />
  );
}
