import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Scanora Privacy Policy — how we handle your data when you use our website audit tool.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-xl bg-[#0a0e1a]/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Scanora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-slate-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="sm">
                Start Scanning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-20">
        <BackButton />
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: April 7, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Scanora (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website audit tool available at scanora.dev (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, and protect information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-medium text-white mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>URLs you submit for scanning</li>
              <li>Device preferences you select for audits</li>
            </ul>
            <h3 className="text-base font-medium text-white mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Pages visited within the Service</li>
              <li>Date and time of access</li>
              <li>Referring URL</li>
            </ul>
            <h3 className="text-base font-medium text-white mt-4 mb-2">2.3 Local Storage</h3>
            <p>
              Scan results and history are stored locally in your browser using localStorage. This data never leaves your device and is not transmitted to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Perform website audits (accessibility, performance, SEO) on URLs you submit</li>
              <li>Generate audit reports and PDF exports</li>
              <li>Improve and maintain the Service</li>
              <li>Monitor usage patterns for performance optimization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Processing</h2>
            <p>
              When you submit a URL for scanning, our servers use Playwright to load the target webpage and run automated audits. The target website&apos;s content is processed in real-time and is not stored on our servers beyond the duration of the scan. Screenshots captured during scans are transmitted to your browser and are not retained server-side.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>To comply with legal obligations or valid legal processes</li>
              <li>To protect the rights, property, or safety of Scanora, our users, or the public</li>
              <li>With service providers who assist in operating the Service (e.g., hosting providers), under strict confidentiality agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies</h2>
            <p>
              Scanora does not use tracking cookies or third-party analytics cookies. We may use essential cookies strictly necessary for the operation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information. All data transmitted between your browser and our servers is encrypted using TLS/SSL. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Clear your locally stored scan history at any time via the Settings page</li>
              <li>Request information about what data we hold about you</li>
              <li>Request deletion of any data associated with you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Third-Party Websites</h2>
            <p>
              When you submit a URL for scanning, we access that third-party website solely for the purpose of performing the audit. We are not responsible for the privacy practices or content of third-party websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@scanora.dev" className="text-emerald-400 hover:underline">
                privacy@scanora.dev
              </a>.
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-white">Scanora</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-slate-400">
              <Link href="/#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
              <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>
            <p className="text-sm text-slate-500" suppressHydrationWarning>
              {`© ${new Date().getFullYear()} Scanora. All rights reserved.`}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
