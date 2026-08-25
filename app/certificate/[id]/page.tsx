import type { Metadata } from "next";
import CertificateClient from "./CertificateClient";
import { readServerCertificate } from "@/app/lib/server-certificates";

type CertificatePageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CertificatePageProps): Promise<Metadata> {
  const { id } = await params;
  const certificateId = decodeURIComponent(id).toUpperCase();
  return {
    title: `Certificate ${certificateId} | Aabhushan Crafts`,
    description: `Aabhushan Crafts certificate of authenticity for ${certificateId}.`,
  };
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const { id } = await params;
  const certificateId = decodeURIComponent(id).toUpperCase();
  const record = await readServerCertificate(certificateId);
  return <CertificateClient certificateId={certificateId} initialRecord={record} />;
}
