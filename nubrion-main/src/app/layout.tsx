import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const title = "Nubrion – AI, která ve firmě opravdu běží";
const description =
  "Nubrion pomáhá firmám šetřit čas a peníze pomocí umělé inteligence. Administrativa, time management, faktury a firemní inteligence.";

export const metadata: Metadata = {
  // makes the og:image URL absolute, which WhatsApp and Messenger require
  metadataBase: new URL("https://nubrion.cz"),
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Nubrion",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

// Runs before paint: enables motion-only initial states, with a safety net
// that reveals everything if the client bundle never takes over.
const motionFlag = `(function(){var d=document.documentElement;
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('anim');
setTimeout(function(){if(!window.__motion)d.classList.remove('anim')},4000);}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="cs"
      className={`${bricolage.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlag }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
