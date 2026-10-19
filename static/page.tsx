import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import { Check, LockKeyhole } from "lucide-react";
import {
  ActivityIcon,
  DiaryIcon,
  InsightIcon,
  PrivacyIcon,
  WellbeingIcon,
} from "@/components/moodify-icons";

import { isValidLocale, type Locale } from "@/i18n/config";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

/*
  Palet
  paper  #F2F3EF  latar
  ink    #23263A  teks utama
  muted  #5A5D70  teks sekunder
  indigo #5C6B9C  warna brand
  coral  #C8523B  hanya untuk aksi utama
  mood   sage #A9C6A8 (tenang), indigo (baik), peach #F2B49A (lelah)
*/

const MOOD_COLOR: Record<string, string> = {
  c: "bg-[#A9C6A8]",
  b: "bg-[#5C6B9C]",
  t: "bg-[#F2B49A]",
  x: "bg-[#E1E4EA]",
};

// Lima minggu check-in contoh. Kamis (kolom ke-4) cenderung lelah.
// c = tenang, b = baik, t = lelah, x = tidak check-in
const PAST_WEEKS = ["cbctbxc", "bbctcbb", "cbbtbcc", "bxctbcb", "cbb"];
const PAST_DAYS = PAST_WEEKS.join("").split("");
const FUTURE_CELLS = 35 - PAST_DAYS.length - 1;

const STRIP = "bcbbtcbbctbcbbtcbcbbt".split("");

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5C6B9C]";

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    redirect("/id");
  }

  const typedLocale = locale as Locale;
  const isEnglish = typedLocale === "en";
  const t = (en: string, id: string) => (isEnglish ? en : id);

  const weekdays = isEnglish
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const features = [
    {
      icon: <WellbeingIcon className="h-5 w-5" />,
      title: t("Daily check-in", "Check-in harian"),
      description: t(
        "Pick the closest feeling and add a note if you want.",
        "Pilih perasaan yang paling dekat, tambah catatan kalau mau.",
      ),
    },
    {
      icon: <DiaryIcon className="h-5 w-5" />,
      title: "Diary",
      description: t(
        "Write or record. Your entries stay with your account.",
        "Tulis atau rekam. Catatanmu tetap di akunmu.",
      ),
    },
    {
      icon: <InsightIcon className="h-5 w-5" />,
      title: t("Short reflections", "Refleksi singkat"),
      description: t(
        "Optional notes based on what you choose to share.",
        "Catatan opsional berdasarkan apa yang kamu bagikan.",
      ),
    },
    {
      icon: <InsightIcon className="h-5 w-5" />,
      title: t("Mood history", "Riwayat mood"),
      description: t(
        "See the ups and downs across days and weeks.",
        "Lihat naik turunnya dari hari ke minggu.",
      ),
    },
    {
      icon: <PrivacyIcon className="h-5 w-5" />,
      title: t("Your data", "Data kamu"),
      description: t(
        "Export or delete anything stored under your account.",
        "Export atau hapus data yang tersimpan di akunmu.",
      ),
    },
    {
      icon: <ActivityIcon className="h-5 w-5" />,
      title: t("Simple activities", "Aktivitas sederhana"),
      description: t(
        "A few ideas when you need a short pause.",
        "Beberapa ide saat kamu butuh jeda sebentar.",
      ),
    },
  ];

  const steps = [
    {
      title: t("Check in", "Check-in"),
      description: t(
        "Say how you’re feeling right now.",
        "Sebutkan perasaanmu sekarang.",
      ),
    },
    {
      title: t("Write", "Tulis"),
      description: t(
        "Add a thought or leave it blank.",
        "Tambah pikiran atau biarkan kosong.",
      ),
    },
    {
      title: t("Look back", "Lihat kembali"),
      description: t(
        "Notice what keeps showing up.",
        "Perhatikan apa yang sering muncul.",
      ),
    },
  ];

  const privacyPoints = [
    t("Entries stay on your account.", "Catatan tetap di akunmu."),
    t("You can export or delete your data.", "Kamu bisa export atau hapus datamu."),
    t("Any AI notes only use what you submit.", "Catatan AI hanya memakai yang kamu kirim."),
  ];

  return (
    <main
      className={`${display.variable} min-h-screen overflow-x-hidden bg-[#F2F3EF] text-[#23263A]`}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .mood-cell {
            animation: mood-in 0.45s cubic-bezier(0.2, 0.7, 0.3, 1) both;
          }
          @keyframes mood-in {
            from { opacity: 0; transform: scale(0.55); }
            to { opacity: 1; transform: none; }
          }
        }
      `}</style>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[#23263A]/10 bg-[#F2F3EF]">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href={`/${typedLocale}`}
            className={`flex shrink-0 items-center ${focusRing}`}
            aria-label="Moodify"
          >
            <Image
              src="/moodify-logo.webp"
              alt="Moodify"
              width={150}
              height={45}
              priority
              className="h-15 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className={`text-sm font-medium text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
            >
              {t("Features", "Fitur")}
            </a>
            <a
              href="#how-it-works"
              className={`text-sm font-medium text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
            >
              {t("How it works", "Cara kerja")}
            </a>
            <a
              href="#privacy"
              className={`text-sm font-medium text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
            >
              {t("Privacy", "Privasi")}
            </a>
          </nav>

          <div className="flex items-center gap-1">
            <Link
              href={`/${typedLocale}/login`}
              className={`hidden px-4 py-2.5 text-sm font-medium text-[#5A5D70] transition-colors hover:text-[#23263A] sm:inline-flex ${focusRing}`}
            >
              {t("Login", "Masuk")}
            </Link>
            <Link
              href={`/${typedLocale}/register`}
              className={`inline-flex rounded-md bg-[#23263A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5C6B9C] ${focusRing}`}
            >
              {t("Register", "Daftar")}
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section>
        <div className="mx-auto grid max-w-6xl items-start gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-28 lg:pt-24">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[44px] font-semibold leading-[1] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">
              {isEnglish ? (
                <>
                  Know what
                  <br />
                  you actually feel.
                </>
              ) : (
                <>
                  Tahu apa yang
                  <br />
                  kamu rasakan.
                </>
              )}
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-[#5A5D70]">
              {t(
                "A private place to check in, write things down, and notice how your mood changes over days and weeks.",
                "Tempat pribadi buat check-in, menulis, dan melihat bagaimana moodmu berubah dari hari ke hari.",
              )}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/${typedLocale}/register`}
                className={`inline-flex h-12 items-center justify-center rounded-md bg-[#C8523B] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#23263A] ${focusRing}`}
              >
                {t("Start free", "Mulai gratis")}
              </Link>
              <Link
                href={`/${typedLocale}/login`}
                className={`inline-flex h-12 items-center justify-center px-2 text-sm font-medium underline decoration-[#23263A]/30 underline-offset-4 transition-colors hover:decoration-[#23263A] ${focusRing}`}
              >
                {t("I already have an account", "Sudah punya akun")}
              </Link>
            </div>

            <p className="mt-8 flex items-center gap-2 text-sm text-[#5A5D70]">
              <LockKeyhole className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              {t(
                "Only you can see what you write.",
                "Hanya kamu yang bisa melihat apa yang kamu tulis.",
              )}
            </p>
          </div>

          {/* Mood log: lima minggu check-in */}
          <div className="w-full max-w-md lg:ml-auto">
            <div className="rounded-lg border border-[#23263A]/15 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <p className="text-sm font-semibold">
                  {t("Last five weeks", "Lima minggu terakhir")}
                </p>
                <ul className="flex items-center gap-3 text-xs text-[#5A5D70]">
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#A9C6A8]" />
                    {t("Calm", "Tenang")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#5C6B9C]" />
                    {t("Okay", "Baik")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#F2B49A]" />
                    {t("Low", "Lelah")}
                  </li>
                </ul>
              </div>

              <div
                className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs text-[#5A5D70]"
                aria-hidden="true"
              >
                {weekdays.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div
                className="mt-2 grid grid-cols-7 gap-1.5"
                role="img"
                aria-label={t(
                  "Daily mood for the last five weeks",
                  "Mood harian selama lima minggu terakhir",
                )}
              >
                {PAST_DAYS.map((mood, i) => (
                  <span
                    key={i}
                    className={`mood-cell aspect-square rounded-[5px] ${MOOD_COLOR[mood]}`}
                    style={{ animationDelay: `${i * 16}ms` }}
                  />
                ))}
                <span
                  className="mood-cell aspect-square rounded-[5px] border-2 border-[#C8523B] bg-white"
                  style={{ animationDelay: `${PAST_DAYS.length * 16}ms` }}
                />
                {Array.from({ length: FUTURE_CELLS }).map((_, i) => (
                  <span
                    key={`future-${i}`}
                    className="aspect-square rounded-[5px] border border-dashed border-[#23263A]/20"
                  />
                ))}
              </div>

              <div className="mt-6 border-t border-[#23263A]/10 pt-5">
                <p className="text-xs text-[#5A5D70]">
                  {t("Today, Thursday", "Hari ini, Kamis")}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em]">
                  {t("How are you?", "Gimana perasaanmu?")}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-md border border-[#23263A]/12 px-2 py-3 text-center">
                    <Image
                      src="/emotions-emoji/calm.png"
                      alt=""
                      width={36}
                      height={36}
                      className="mx-auto object-contain mix-blend-multiply"
                    />
                    <p className="mt-1.5 text-xs font-medium">
                      {t("Calm", "Tenang")}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#23263A]/12 px-2 py-3 text-center">
                    <Image
                      src="/emotions-emoji/happy.png"
                      alt=""
                      width={36}
                      height={36}
                      className="mx-auto object-contain mix-blend-multiply"
                    />
                    <p className="mt-1.5 text-xs font-medium">
                      {t("Okay", "Baik")}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#C8523B] bg-[#F2B49A]/25 px-2 py-3 text-center">
                    <Image
                      src="/emotions-emoji/tired.png"
                      alt=""
                      width={36}
                      height={36}
                      className="mx-auto object-contain mix-blend-multiply"
                    />
                    <p className="mt-1.5 text-xs font-medium">
                      {t("Low", "Lelah")}
                    </p>
                  </div>
                </div>

                <p className="mt-4 flex gap-2.5 text-sm leading-6 text-[#5A5D70]">
                  <InsightIcon className="mt-1 h-4 w-4 shrink-0 text-[#5C6B9C]" />
                  {t(
                    "Thursdays tend to run heavier for you. A short break might help.",
                    "Kamis sering terasa lebih berat buatmu. Istirahat sejenak mungkin membantu.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="scroll-mt-20 border-t border-[#23263A]/10"
      >
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="max-w-md font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
              {t(
                "The things you actually use.",
                "Hal-hal yang benar-benar kamu pakai.",
              )}
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-[#5A5D70]">
              {t(
                "Check-ins, a diary, and a simple view of how you’ve been feeling.",
                "Check-in, diary, dan tampilan sederhana tentang bagaimana perasaanmu belakangan.",
              )}
            </p>
          </div>

          <ul className="border-b border-[#23263A]/10">
            {features.map((feature) => (
              <li
                key={feature.title}
                className="grid gap-3 border-t border-[#23263A]/10 py-7 sm:grid-cols-[220px_1fr] sm:gap-8"
              >
                <div className="flex items-center gap-3 text-[#3F4C7A]">
                  {feature.icon}
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-[-0.01em] text-[#23263A]">
                    {feature.title}
                  </h3>
                </div>
                <p className="max-w-md text-[15px] leading-7 text-[#5A5D70]">
                  {feature.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="scroll-mt-20 bg-[#5C6B9C] text-white"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
            {t("Three steps. That’s it.", "Tiga langkah. Selesai.")}
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#E4E7F2]">
            {t(
              "You don’t need a plan. Just open it when you have a minute.",
              "Tidak perlu rencana. Buka saja saat ada waktu sebentar.",
            )}
          </p>

          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
            {steps.map((step, i) => (
              <li key={step.title} className="md:pr-10">
                <div className="flex items-center gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#5C6B9C]">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="hidden h-px flex-1 bg-white/40 md:block" />
                  )}
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.01em]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-[15px] leading-7 text-[#E4E7F2]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PRIVACY */}
      <section id="privacy" className="scroll-mt-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-28">
          <div>
            <h2 className="max-w-md font-[family-name:var(--font-display)] text-3xl font-semibold leading-[1.1] tracking-[-0.03em] sm:text-5xl">
              {t(
                "You control what’s stored.",
                "Kamu yang kontrol apa yang disimpan.",
              )}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#5A5D70]">
              {t(
                "Share only what you want. Export or delete your data whenever you need to.",
                "Bagikan hanya yang kamu mau. Export atau hapus datamu kapan saja.",
              )}
            </p>
            <Link
              href={`/${typedLocale}/register`}
              className={`mt-8 inline-flex text-sm font-semibold text-[#3F4C7A] underline decoration-[#3F4C7A]/30 underline-offset-4 transition-colors hover:decoration-[#3F4C7A] ${focusRing}`}
            >
              {t("Create account", "Buat akun")}
            </Link>
          </div>

          <div className="rounded-lg border border-[#23263A]/15 bg-white p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <LockKeyhole
                className="h-5 w-5 shrink-0 text-[#3F4C7A]"
                strokeWidth={1.8}
              />
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.02em]">
                {t("This is private by default.", "Ini privat dari awal.")}
              </h3>
            </div>
            <p className="mt-3 text-[15px] leading-7 text-[#5A5D70]">
              {t(
                "Your diary and check-ins are tied to your account. They’re not public and not shared with other users.",
                "Diary dan check-inmu terhubung ke akunmu. Tidak publik dan tidak dibagikan ke pengguna lain.",
              )}
            </p>
            <ul className="mt-6">
              {privacyPoints.map((point) => (
                <PrivacyPoint key={point} text={point} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-[#23263A]/10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
          <div>
            <h2 className="max-w-xl font-[family-name:var(--font-display)] text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
              {t("Start with one check-in.", "Mulai dari satu check-in.")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#5A5D70]">
              {t(
                "No long setup. Just open it and say how you feel.",
                "Tidak perlu setup panjang. Buka saja dan sebutkan perasaanmu.",
              )}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={`/${typedLocale}/register`}
                className={`inline-flex h-12 items-center justify-center rounded-md bg-[#C8523B] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#23263A] ${focusRing}`}
              >
                {t("Create account", "Buat akun")}
              </Link>
              <Link
                href={`/${typedLocale}/login`}
                className={`inline-flex h-12 items-center justify-center px-2 text-sm font-medium underline decoration-[#23263A]/30 underline-offset-4 transition-colors hover:decoration-[#23263A] ${focusRing}`}
              >
                {t("Login", "Masuk")}
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="grid w-fit grid-cols-7 gap-1.5 lg:ml-auto"
          >
            {STRIP.map((mood, i) => (
              <span
                key={i}
                className={`h-7 w-7 rounded-[5px] ${MOOD_COLOR[mood]}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#23263A]/10">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div className="max-w-xs">
              <Link
                href={`/${typedLocale}`}
                className={`inline-flex items-center ${focusRing}`}
                aria-label="Moodify"
              >
                <Image
                  src="/moodify-logo.webp"
                  alt="Moodify"
                  width={130}
                  height={40}
                  className="h-14 w-auto object-contain"
                />
              </Link>
              <p className="mt-3 text-sm leading-6 text-[#5A5D70]">
                {t(
                  "A place to check in and keep track of how you’ve been feeling.",
                  "Tempat untuk check-in dan mencatat bagaimana perasaanmu belakangan.",
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-14 gap-y-8 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold">{t("Product", "Produk")}</p>
                <div className="mt-3 space-y-2.5">
                  <a
                    href="#features"
                    className={`block text-sm text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
                  >
                    {t("Features", "Fitur")}
                  </a>
                  <a
                    href="#how-it-works"
                    className={`block text-sm text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
                  >
                    {t("How it works", "Cara kerja")}
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">{t("Account", "Akun")}</p>
                <div className="mt-3 space-y-2.5">
                  <Link
                    href={`/${typedLocale}/login`}
                    className={`block text-sm text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
                  >
                    {t("Login", "Masuk")}
                  </Link>
                  <Link
                    href={`/${typedLocale}/register`}
                    className={`block text-sm text-[#5A5D70] transition-colors hover:text-[#23263A] ${focusRing}`}
                  >
                    {t("Register", "Daftar")}
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">{t("Language", "Bahasa")}</p>
                <div className="mt-3 flex items-center gap-1">
                  <Link
                    href="/id"
                    aria-current={!isEnglish ? "true" : undefined}
                    className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      !isEnglish
                        ? "bg-[#23263A] font-semibold text-white"
                        : "text-[#5A5D70] hover:text-[#23263A]"
                    } ${focusRing}`}
                  >
                    ID
                  </Link>
                  <Link
                    href="/en"
                    aria-current={isEnglish ? "true" : undefined}
                    className={`rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                      isEnglish
                        ? "bg-[#23263A] font-semibold text-white"
                        : "text-[#5A5D70] hover:text-[#23263A]"
                    } ${focusRing}`}
                  >
                    EN
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-[#23263A]/10 pt-6 text-xs text-[#5A5D70] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Moodify.{" "}
              {t("All rights reserved.", "Semua hak dilindungi.")}
            </p>
            <p className="flex items-center gap-2">
              <PrivacyIcon className="h-3.5 w-3.5 shrink-0" />
              {t("Your data stays with you.", "Datamu tetap milikmu.")}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function PrivacyPoint({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 border-t border-[#23263A]/10 py-3.5 first:border-t-0">
      <Check
        className="h-4 w-4 shrink-0 text-[#3F4C7A]"
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <span className="text-sm text-[#23263A]">{text}</span>
    </li>
  );
}
