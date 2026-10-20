import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sai Dwarak — UI/UX Designer & AI Product Builder",
  description:
    "Sai Dwarak — UI/UX Designer & AI Product Builder exploring product design, thoughtful digital experiences, and AI-powered tools.",
  keywords: [
    "Sai Dwarak",
    "UI/UX Designer",
    "AI Product Builder",
    "Product Design",
    "Prototyping",
    "Design Systems",
    "AI Tools",
  ],
  authors: [{ name: "Sai Dwarak" }],
  openGraph: {
    title: "Sai Dwarak — UI/UX Designer & AI Product Builder",
    description:
      "Sai Dwarak — UI/UX Designer & AI Product Builder exploring product design, thoughtful digital experiences, and AI-powered tools.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF7F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="scroll-smooth antialiased selection:bg-[#EC2929] selection:text-white"
    >
      <body className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] font-sans antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
