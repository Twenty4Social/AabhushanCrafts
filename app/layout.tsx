import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.aabhushancrafts.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,300..900;1,6..96,300..900&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Italiana&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
