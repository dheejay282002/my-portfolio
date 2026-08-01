import { queryOne } from "@/lib/db";
import { ensureCertificatesTable } from "@/lib/schema";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureCertificatesTable();
  const { slug } = await params;
  const cert = await queryOne(
    "SELECT * FROM certificates WHERE certificate_url = $1 AND is_public = TRUE",
    [slug]
  ) as any;

  if (!cert) notFound();

  const issueDate = new Date(cert.issued_date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-8 md:p-12 shadow-2xl shadow-cyan-500/5 overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 h-64 w-64 rounded-full bg-cyan-500 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500 blur-3xl" />
          </div>

          <div className="relative text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/70">
              Certificate of Completion
            </div>

            <div className="mx-auto my-6 h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <p className="text-sm text-zinc-400">This is to certify that</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {cert.recipient_name}
            </h1>

            <p className="mt-4 text-sm text-zinc-400">has successfully completed</p>
            <h2 className="mt-2 text-xl md:text-2xl font-semibold text-white">
              {cert.course_title}
            </h2>

            {cert.description && (
              <p className="mt-4 max-w-md mx-auto text-sm leading-relaxed text-zinc-400">
                {cert.description}
              </p>
            )}

            {cert.badge_image_url && (
              <div className="mt-6 flex justify-center">
                <img src={cert.badge_image_url} alt="Badge" className="h-20 w-20 object-contain" />
              </div>
            )}

            <div className="mx-auto my-6 h-px w-32 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-6">
              <div className="text-center">
                <p className="text-xs text-zinc-500">Date of Issue</p>
                <p className="mt-1 text-sm font-medium text-white">{issueDate}</p>
              </div>
              {cert.issuer_name && (
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Issued By</p>
                  <p className="mt-1 text-sm font-medium text-white">{cert.issuer_name}</p>
                  {cert.issuer_title && (
                    <p className="text-xs text-zinc-500">{cert.issuer_title}</p>
                  )}
                </div>
              )}
            </div>

            <p className="mt-8 text-[10px] text-zinc-600">
              Verification ID: {cert.certificate_url}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
