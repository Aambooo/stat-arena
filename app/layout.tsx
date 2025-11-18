import type { Metadata } from "next";
import "./globals.css";
import { Archivo_Narrow, Oswald } from "next/font/google";
import { Providers } from "./providers";
import { ClerkProvider } from "@clerk/nextjs";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  variable: "--font-archivo-narrow",
});

export const metadata: Metadata = {
  title: "STAT ARENA - PUBG Stats",
  description:
    "Track your PUBG PC performance with detailed statistics and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${oswald.variable} ${archivoNarrow.variable}`}>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
