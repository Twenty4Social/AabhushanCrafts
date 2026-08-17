import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aabhushan Crafts | Handcrafted Jewellery in Kathmandu",
  description:
    "Gold, diamond and silver jewellery handcrafted in Kathmandu for weddings, festivals and every meaningful moment.",
  openGraph: {
    title: "Aabhushan Crafts — Jewellery that feels like home",
    description: "Handcrafted gold, diamond and silver jewellery from Naxal, Kathmandu.",
    type: "website",
    locale: "en_NP",
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
