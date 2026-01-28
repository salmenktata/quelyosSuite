import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";
import Container from "./Container";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-900/50">
      <Container className="py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-2">
                <span className="text-xl font-bold text-white">Q</span>
              </div>
              <div>
                <p className="font-bold text-white">Quelyos</p>
                <p className="text-xs text-slate-400">Suite TPE/PME</p>
              </div>
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              La suite SaaS qui simplifie la vie des TPE/PME françaises.
            </p>
          </div>

          {/* Modules */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Modules
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/finance"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Finance
                </Link>
              </li>
              <li>
                <Link
                  href="/ecommerce"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Boutique
                </Link>
              </li>
              <li>
                <Link
                  href="/crm"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  CRM
                </Link>
              </li>
              <li>
                <Link
                  href="/stock"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Stock
                </Link>
              </li>
              <li>
                <Link
                  href="/hr"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  RH
                </Link>
              </li>
              <li>
                <Link
                  href="/pos"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Point de Vente
                </Link>
              </li>
              <li>
                <Link
                  href="/marketing"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Marketing
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Ressources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/finance/docs"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/finance/faq"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/finance/support"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Support
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/salmenktata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:contact@quelyos.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  contact@quelyos.com
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/in/salmenktata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/salmenktata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            © 2025 Quelyos. Fait avec ❤️ par Salmen Ktata
          </p>
          <div className="flex gap-6">
            <Link
              href="/mentions-legales"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Mentions légales
            </Link>
            <Link
              href="/confidentialite"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Confidentialité
            </Link>
            <Link
              href="/cgu"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              CGU
            </Link>
            <Link
              href="/cgv"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              CGV
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
