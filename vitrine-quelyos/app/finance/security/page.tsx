"use client";

import { useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles,
  Shield,
  Lock,
  Eye,
  Server,
  AlertTriangle,
  CheckCircle2,
  Key,
  Database,
  FileText,
  Users,
  Globe,
  Bell,
  Code,
  Zap
} from "lucide-react";

import Container from "@/app/components/Container";
import Footer from "@/app/components/Footer";
export default function SecurityPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-xs font-medium text-indigo-300">
            <Shield className="h-3.5 w-3.5" />
            Enterprise-Grade Security
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold">Security & Compliance</h1>
          <p className="text-slate-400 text-lg">
            Your financial data protected with military-grade encryption and best-in-class security practices.
          </p>
        </div>
        
        {/* Security Highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">GDPR Compliant</h3>
            <p className="text-sm text-slate-400">Full compliance with European data protection regulations</p>
          </div>
          
          <div className="p-6 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AES-256 Encryption</h3>
            <p className="text-sm text-slate-400">Military-grade encryption for data at rest and in transit</p>
          </div>
          
          <div className="p-6 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-4">
              <Eye className="h-5 w-5 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">24/7 Monitoring</h3>
            <p className="text-sm text-slate-400">Real-time threat detection and incident response</p>
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Data Encryption */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Data Encryption</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-indigo-400" />
                  In Transit (TLS 1.3)
                </h3>
                <p className="text-slate-300 text-sm">
                  All communications between your browser and our servers are encrypted using TLS 1.3 
                  with perfect forward secrecy (PFS). This ensures that even if a key is compromised, 
                  past communications remain secure.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4 text-violet-400" />
                  At Rest (AES-256)
                </h3>
                <p className="text-slate-300 text-sm">
                  All sensitive data stored in our databases is encrypted using AES-256, the same 
                  encryption standard used by governments and financial institutions worldwide. 
                  Encryption keys are rotated regularly and stored separately from data.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-emerald-400" />
                  Password Protection
                </h3>
                <p className="text-slate-300 text-sm">
                  User passwords are hashed using bcrypt with a cost factor of 12, making them 
                  extremely resistant to brute-force attacks. We never store passwords in plain text.
                </p>
              </div>
            </div>
          </section>
          
          {/* Authentication & Access Control */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Key className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold">Authentication & Access Control</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">JWT Tokens:</strong> Short-lived access tokens with secure refresh mechanism
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">OAuth 2.0:</strong> Secure authentication via Google and LinkedIn
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Multi-Factor Authentication (MFA):</strong> Optional 2FA for enhanced security
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Role-Based Access Control (RBAC):</strong> Granular permissions per user role
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Session Management:</strong> Automatic timeout after 7 days of inactivity
                </div>
              </div>
            </div>
          </section>
          
          {/* Infrastructure Security */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Server className="h-5 w-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold">Infrastructure Security</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">EU Data Centers:</strong> All data stored in GDPR-compliant European data centers
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">DDoS Protection:</strong> Advanced protection against distributed denial-of-service attacks
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Intrusion Detection:</strong> Real-time monitoring and automated threat response
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Automated Backups:</strong> Daily encrypted backups with 30-day retention
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Server className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white">Isolated Environments:</strong> Complete separation between production, staging, and development
                </div>
              </div>
            </div>
          </section>
          
          {/* Compliance & Certifications */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold">Compliance & Certifications</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">GDPR</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Full compliance with European General Data Protection Regulation
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">PCI DSS Level 1</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Payment Card Industry Data Security Standard compliance
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">ISO 27001</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Information security management system certification
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-white font-semibold">SOC 2 Type II</h3>
                </div>
                <p className="text-sm text-slate-400">
                  Independent audit of security, availability, and confidentiality
                </p>
              </div>
            </div>
          </section>
          
          {/* Security Best Practices */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Code className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Security Best Practices</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Regular Security Audits:</strong> Quarterly penetration testing by third-party security experts</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Dependency Scanning:</strong> Automated scanning of all dependencies for known vulnerabilities</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Code Reviews:</strong> All code changes reviewed by senior engineers before deployment</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Security Training:</strong> Regular security awareness training for all team members</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                <span><strong className="text-white">Incident Response Plan:</strong> Documented procedures for security incident handling and recovery</span>
              </div>
            </div>
          </section>
          
          {/* Vulnerability Disclosure */}
          <section className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold">Responsible Disclosure</h2>
            </div>
            <div className="space-y-4 text-slate-300">
              <p>
                We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly:
              </p>
              <div className="p-4 rounded-lg bg-slate-800/30">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-yellow-400" />
                  Security Contact
                </h3>
                <p className="text-sm">
                  <strong className="text-white">Email:</strong>{" "}
                  <a href="mailto:security@quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                    security@quelyos.com
                  </a>
                </p>
                <p className="text-sm mt-2">
                  <strong className="text-white">PGP Key:</strong>{" "}
                  <a href="/pgp-key.txt" className="text-indigo-400 hover:text-indigo-300">
                    Download Public Key
                  </a>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm">
                  <strong className="text-yellow-300">Bug Bounty Program:</strong> We offer rewards for responsibly 
                  disclosed vulnerabilities. Please email{" "}
                  <a href="mailto:security@quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                    security@quelyos.com
                  </a>{" "}
                  for details.
                </p>
              </div>
            </div>
          </section>
          
          {/* Security Updates */}
          <section className="p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold">Stay Informed</h2>
            </div>
            <div className="space-y-3 text-slate-300">
              <p>
                <strong className="text-white">Security Newsletter:</strong> Subscribe to receive security updates and best practices
              </p>
              <p>
                <strong className="text-white">Status Page:</strong> Real-time system status at{" "}
                <a href="https://status.quelyos.com" className="text-indigo-400 hover:text-indigo-300">
                  status.quelyos.com
                </a>
              </p>
              <p>
                <strong className="text-white">Security Advisories:</strong> Published on our{" "}
                <a href="/security/advisories" className="text-indigo-400 hover:text-indigo-300">
                  security page
                </a>
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