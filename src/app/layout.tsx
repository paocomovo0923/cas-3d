import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Criar um Sim — CAS 3D | The Sims-inspired Character Creator",
  description:
    "Sistema CAS (Create-A-Sim) interativo em 3D inspirado em The Sims 4: morfologia facial com morph targets, animações F_/M_, catálogo de roupas e edição direta por hotspots.",
  keywords: ["CAS", "Create-A-Sim", "The Sims 4", "Three.js", "glTF", "criador de personagens"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Criar um Sim — CAS 3D",
    description: "Criador de personagens 3D inspirado em The Sims 4",
    siteName: "CAS 3D",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
