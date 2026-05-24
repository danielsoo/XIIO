/** 신규 vs 레거시 프로필 판정 (node scripts/verify-profile-policy.mjs) */

function isLegacyProfile(profile) {
  if (profile.birthDate?.trim()) return false;
  const age = profile.age;
  return age != null && age >= 13 && age <= 120;
}

function isProfileComplete(profile) {
  if (!profile.displayName?.trim()) return false;
  if (!profile.platformPurpose) return false;
  if (isLegacyProfile(profile)) return true;
  if (!profile.birthDate?.trim()) return false;
  if (!profile.locale) return false;
  if (!profile.gender) return false;
  return true;
}

const cases = [
  {
    name: "레거시 (age만)",
    profile: {
      displayName: "테스트",
      platformPurpose: "watch",
      age: 23,
      birthDate: null,
      locale: undefined,
      gender: null,
    },
    expectComplete: true,
    expectLegacy: true,
  },
  {
    name: "신규 미완성 (성별 없음)",
    profile: {
      displayName: "테스트",
      platformPurpose: "watch",
      birthDate: "2000-01-15",
      locale: "ko",
      gender: null,
      age: null,
    },
    expectComplete: false,
    expectLegacy: false,
  },
  {
    name: "신규 완료",
    profile: {
      displayName: "테스트",
      platformPurpose: "watch",
      birthDate: "2000-01-15",
      locale: "ko",
      gender: "undisclosed",
      age: null,
    },
    expectComplete: true,
    expectLegacy: false,
  },
];

let failed = 0;
for (const c of cases) {
  const legacy = isLegacyProfile(c.profile);
  const complete = isProfileComplete(c.profile);
  if (legacy !== c.expectLegacy || complete !== c.expectComplete) {
    console.error("FAIL:", c.name, { legacy, complete });
    failed += 1;
  } else {
    console.log("OK:", c.name);
  }
}

if (failed) process.exit(1);
console.log("All profile policy checks passed.");
