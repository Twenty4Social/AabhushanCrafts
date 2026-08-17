import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aabhushan-crafts-kathmandu.business-in24hr.chatgpt.site"),
  title: "Aabhushan Crafts | Believe in Design",
  description:
    "Discover handcrafted gold, gemstone and 925 silver jewellery by Aabhushan Crafts in Naxal, Kathmandu.",
  openGraph: {
    title: "Aabhushan Crafts — Believe in Design",
    description: "Handcrafted jewellery shaped by thought, detail and design in Kathmandu.",
    type: "website",
    locale: "en_NP",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "Aabhushan Crafts — Believe in Design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aabhushan Crafts — Believe in Design",
    description: "Handcrafted jewellery shaped by thought, detail and design in Kathmandu.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
