import type { Metadata } from "next";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Scanora Terms & Conditions — rules and guidelines for using our website audit tool.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-white mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: April 7, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Scanora (&quot;the Service&quot;), available at scanora.dev, you agree to be bound by these Terms &amp; Conditions. If you do not agree to these terms, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Scanora is a free website audit tool that provides accessibility, performance, and SEO analysis. The Service uses automated tools including Playwright, axe-core, and Lighthouse to scan websites you submit and generates reports based on the scan results.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Acceptable Use</h2>
            <p>You agree to use the Service only for lawful purposes. You must not:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Submit URLs of websites you do not own or have authorization to scan</li>
              <li>Use the Service to perform denial-of-service attacks or overload target servers</li>
              <li>Attempt to access, tamper with, or exploit the Service&apos;s infrastructure</li>
              <li>Use automated scripts or bots to submit bulk scan requests</li>
              <li>Use the Service to collect, store, or process personal data of third parties without their consent</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell, redistribute, or commercially exploit the Service without prior written consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Scanning &amp; Reports</h2>
            <p>
              When you submit a URL, Scanora will load the target webpage using automated browsers and perform various audits. You acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Scan results are provided on an &quot;as-is&quot; basis and may not be 100% accurate</li>
              <li>Results may vary depending on network conditions, server response times, and dynamic content</li>
              <li>Scanora is not responsible for any impact on target websites during scanning</li>
              <li>Generated reports and PDF exports are for informational purposes only and do not constitute professional advice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
            <p>
              The Service, including its design, code, logos, and content, is owned by Scanora and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without prior written consent.
            </p>
            <p className="mt-2">
              Reports generated by the Service for websites you own are yours to use freely, including for commercial purposes such as client reporting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="mt-2">
              We do not warrant that: (a) the Service will be uninterrupted, timely, or error-free; (b) scan results will be accurate or complete; (c) any defects will be corrected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SCANORA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM: (A) YOUR USE OR INABILITY TO USE THE SERVICE; (B) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS; (C) ANY INTERRUPTION OR CESSATION OF THE SERVICE; (D) ANY ERRORS OR INACCURACIES IN SCAN RESULTS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Scanora and its affiliates, officers, agents, and employees from any claim or demand, including reasonable attorneys&apos; fees, arising out of your use of the Service, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Service Availability</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Rate Limiting</h2>
            <p>
              To ensure fair usage, we may impose rate limits on the number of scans you can perform within a given time period. Excessive or abusive use may result in temporary or permanent restriction of access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Third-Party Content</h2>
            <p>
              The Service may display or analyze content from third-party websites. We do not endorse, verify, or assume responsibility for any third-party content, products, or services accessed through or analyzed by the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms or the Service shall be resolved through good-faith negotiation, and if unresolved, through binding arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated &quot;Last updated&quot; date. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">15. Contact Us</h2>
            <p>
              If you have questions about these Terms &amp; Conditions, please contact us at{" "}
              <a href="mailto:legal@scanora.dev" className="text-emerald-400 hover:underline">
                legal@scanora.dev
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
