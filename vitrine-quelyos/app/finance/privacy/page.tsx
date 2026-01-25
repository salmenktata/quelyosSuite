"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles,
  Shield,
  Eye,
  Lock,
  Users,
  Clock,
  Database,
  Mail,
  Settings,
  Trash2,
  Download,
  AlertCircle,
  FileText
} from "lucide-react";

import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function PrivacyPage() {
  useEffect(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50">
        <Container narrow className="py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Quelyos</span>
          </Link>
          <Link 
            href="/" 
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </Container>
      </header>

      {/* Content */}
      <main className="relative z-10">
        <Container narrow className="py-16">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-300">
            <Shield className="h-3.5 w-3.5" />
            Protection des données
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: December 2025</p>
        </div>
        
        {/* Engagement */}
        <div className="mb-12 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-start gap-4">
            <Shield className="h-8 w-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Our Commitment</h2>
              <p className="text-slate-300 leading-relaxed">
                At Quelyos, protecting your personal data is our top priority. 
                We are committed to GDPR compliance and cybersecurity best practices 
                to ensure the confidentiality of your information.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Data Controller */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Data Controller</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p><strong className="text-white">Company:</strong> Quelyos SAS</p>
              <p><strong className="text-white">Address:</strong> 42 rue de la Finance, 75008 Paris, France</p>
              <p><strong className="text-white">Email:</strong> privacy@quelyos.com</p>
              <p><strong className="text-white">DPO (Data Protection Officer):</strong> M. Pierre Martin</p>
            </div>
          </section>
          
          {/* Data We Collect */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Database className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold">Data We Collect</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Account Information
                </h3>
                <ul className="space-y-1 list-disc list-inside ml-6">
                  <li>Full name, email address, phone number</li>
                  <li>Company information (name, SIRET, address)</li>
                  <li>Password (encrypted with bcrypt)</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-violet-400" />
                  Financial Data
                </h3>
                <ul className="space-y-1 list-disc list-inside ml-6">
                  <li>Bank account details (IBAN, BIC)</li>
                  <li>Transactions, budgets, and categories</li>
                  <li>Investment portfolios (stocks, crypto)</li>
                  <li>Financial reports and forecasts</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  Usage Data
                </h3>
                <ul className="space-y-1 list-disc list-inside ml-6">
                  <li>IP address, browser type, device information</li>
                  <li>Pages visited, time spent on the platform</li>
                  <li>Actions performed (exports, reports, etc.)</li>
                </ul>
              </div>
            </div>
          </section>
          
          {/* How We Use Your Data */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Settings className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">How We Use Your Data</h2>
            </div>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Service Delivery:</strong> Provide financial management features (accounts, budgets, reports)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Security:</strong> Detect fraud, secure transactions, protect your account</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Communication:</strong> Send notifications, alerts, and important updates</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Improvement:</strong> Analyze usage to enhance our platform and user experience</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Legal Compliance:</strong> Meet regulatory requirements (AML, KYC, tax reporting)</span>
              </li>
            </ul>
          </section>
          
          {/* Data Security */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Encryption:</strong> All data in transit (TLS 1.3) and at rest (AES-256)</span>
              </p>
              <p className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Authentication:</strong> JWT tokens, OAuth 2.0, multi-factor authentication (MFA)</span>
              </p>
              <p className="flex items-start gap-3">
                <Database className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Infrastructure:</strong> Secure hosting in EU data centers (GDPR compliant)</span>
              </p>
              <p className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span><strong className="text-white">Monitoring:</strong> Real-time security monitoring and incident response</span>
              </p>
            </div>
          </section>
          
          {/* Your Rights */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold">Your Rights (GDPR)</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-400" />
                  Right to Access
                </h3>
                <p className="text-sm text-slate-400">Request a copy of your personal data</p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-violet-400" />
                  Right to Rectification
                </h3>
                <p className="text-sm text-slate-400">Correct inaccurate or incomplete data</p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-400" />
                  Right to Erasure
                </h3>
                <p className="text-sm text-slate-400">Delete your account and personal data</p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4 text-emerald-400" />
                  Right to Portability
                </h3>
                <p className="text-sm text-slate-400">Export your data in a structured format</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <p className="text-sm text-slate-300">
                <strong className="text-white">To exercise your rights:</strong> Contact us at{" "}
                <a href="mailto:privacy@quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                  privacy@quelyos.com
                </a>{" "}
                or via your account settings.
              </p>
            </div>
          </section>
          
          {/* Data Retention */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Data Retention</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p><strong className="text-white">Active accounts:</strong> Data retained as long as your account is active</p>
              <p><strong className="text-white">Closed accounts:</strong> Data deleted within 30 days, except for legal obligations</p>
              <p><strong className="text-white">Financial records:</strong> Retained for 10 years (legal requirement)</p>
              <p><strong className="text-white">Usage logs:</strong> Retained for 13 months maximum</p>
            </div>
          </section>
          
          {/* Contact */}
          <section className="p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Mail className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p>
                <strong className="text-white">Questions about your privacy?</strong> Contact our Data Protection Officer:
              </p>
              <p>
                <strong className="text-white">Email:</strong>{" "}
                <a href="mailto:privacy@quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                  privacy@quelyos.com
                </a>
              </p>
              <p>
                <strong className="text-white">Mail:</strong> Quelyos SAS - DPO, 42 rue de la Finance, 75008 Paris, France
              </p>
              <p className="text-sm pt-2 border-t border-slate-700">
                <AlertCircle className="h-4 w-4 inline text-yellow-400" />{" "}
                You have the right to lodge a complaint with the CNIL (French Data Protection Authority) if you believe your rights have been violated.
              </p>
            </div>
          </section>
        </div>
        </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}