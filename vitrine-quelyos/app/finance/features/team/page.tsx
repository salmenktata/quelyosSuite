import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Shield,
  Eye,
  Settings,
  CheckCircle2,
  UserPlus,
  Mail,
} from "lucide-react";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import Container from "@/app/components/Container";

export const metadata = {
  title: "Gestion d'équipe - Quelyos Finance",
  description:
    "Invitez votre équipe et gérez les permissions avec des rôles différenciés : Admin, Manager, User, Viewer.",
};

export default function TeamFeaturePage() {
  const roles = [
    {
      name: "Admin",
      icon: Shield,
      color: "from-red-500 to-orange-500",
      permissions: [
        "Tous les droits sur l'organisation",
        "Gérer les utilisateurs et leurs rôles",
        "Modifier les paramètres de facturation",
        "Accès complet aux données",
        "Exporter toutes les données",
        "Supprimer des transactions et comptes",
      ],
    },
    {
      name: "Manager",
      icon: Settings,
      color: "from-indigo-500 to-purple-500",
      permissions: [
        "Gérer les comptes et transactions",
        "Créer et modifier les budgets",
        "Voir tous les rapports",
        "Inviter des membres (User/Viewer)",
        "Exporter les rapports",
        "Approuver les dépenses",
      ],
    },
    {
      name: "User",
      icon: Users,
      color: "from-emerald-500 to-green-500",
      permissions: [
        "Ajouter des transactions",
        "Consulter les comptes attribués",
        "Voir les budgets",
        "Créer des rapports basiques",
        "Commenter les transactions",
        "Recevoir des notifications",
      ],
    },
    {
      name: "Viewer",
      icon: Eye,
      color: "from-slate-500 to-gray-500",
      permissions: [
        "Consulter les tableaux de bord",
        "Voir les comptes en lecture seule",
        "Accès aux rapports",
        "Exporter ses propres rapports",
        "Aucune modification possible",
      ],
    },
  ];

  const features = [
    {
      icon: UserPlus,
      title: "Invitation simplifiée",
      description:
        "Invitez vos collaborateurs par email en quelques clics. Ils reçoivent un lien d'activation sécurisé.",
    },
    {
      icon: Shield,
      title: "Permissions granulaires",
      description:
        "Contrôlez précisément qui peut voir, modifier ou supprimer chaque élément de votre trésorerie.",
    },
    {
      icon: Mail,
      title: "Notifications d'équipe",
      description:
        "Restez informés des actions importantes : nouvelles transactions, alertes budgets, validations requises.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <Header />

      {/* Hero */}
      <section className="relative py-20">
        <Container>
          <Link
            href="/finance/features"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux fonctionnalités
          </Link>

          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
              <Users className="h-4 w-4" />
              Collaboration
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl mb-6">
              Gérez votre trésorerie{" "}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                en équipe
              </span>
            </h1>
            <p className="text-xl text-slate-300">
              Invitez vos collaborateurs, définissez leurs rôles et permissions,
              et pilotez votre trésorerie ensemble en toute sécurité.
            </p>
          </div>
        </Container>
      </section>

      {/* Rôles */}
      <section className="relative py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              4 rôles pour une gestion optimale
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Chaque membre de votre équipe obtient les permissions adaptées à
              ses responsabilités.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-white/20"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.color}`}
                >
                  <role.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {role.name}
                </h3>
                <ul className="space-y-2">
                  {role.permissions.map((permission, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-300"
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Fonctionnalités */}
      <section className="relative py-20">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 backdrop-blur-sm"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <Container narrow>
          <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8 text-center backdrop-blur-sm">
            <Users className="mx-auto h-12 w-12 text-green-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à gérer votre trésorerie en équipe ?
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              5 utilisateurs inclus dans le plan de base.
              Ajoutez des packs de 5 utilisateurs supplémentaires selon vos besoins.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-4 text-lg font-medium text-white transition-all hover:from-green-600 hover:to-emerald-600"
              >
                Voir les tarifs
              </Link>
              <Link
                href="/finance/features"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-medium text-white transition-all hover:bg-white/10"
              >
                Toutes les fonctionnalités
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </div>
  );
}
