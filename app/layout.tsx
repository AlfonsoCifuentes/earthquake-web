import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Seismic Atlas — Global Earthquake Analysis",
  description:
    "Explore global earthquake records, recent USGS activity and historical seismic patterns through interactive maps and data visualizations.",
  keywords: ["earthquake", "seismic", "USGS", "geology", "spatial analysis", "geophysics"],
  openGraph: {
    title: "Seismic Atlas — Global Earthquake Analysis",
    description: "Explore global earthquake records, recent USGS activity and historical seismic patterns through interactive maps and data visualizations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
