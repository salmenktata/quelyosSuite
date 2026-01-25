import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VOTES_FILE = path.join(process.cwd(), "data", "votes.json");

// Lire les votes depuis le fichier
function readVotes() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(VOTES_FILE)) {
    return {};
  }
  const data = fs.readFileSync(VOTES_FILE, "utf-8");
  return JSON.parse(data);
}

// Calculer les statistiques
function calculateStats(
  votes: Record<string, { category: string; likes: number; dislikes: number }>
) {
  const stats = {
    finance: {
      roadmap: { likes: 0, dislikes: 0, total: 0, items: 0 },
      backlog: { likes: 0, dislikes: 0, total: 0, items: 0 },
      total: { likes: 0, dislikes: 0, total: 0, items: 0 },
    },
    marketing: {
      roadmap: { likes: 0, dislikes: 0, total: 0, items: 0 },
      backlog: { likes: 0, dislikes: 0, total: 0, items: 0 },
      total: { likes: 0, dislikes: 0, total: 0, items: 0 },
    },
    global: {
      likes: 0,
      dislikes: 0,
      total: 0,
      items: 0,
    },
  };

  Object.entries(votes).forEach(([, value]) => {
    const { category, likes, dislikes } = value;
    const total = likes + dislikes;

    // Parse category (format: "finance-roadmap", "marketing-backlog", etc.)
    const [product, type] = category.split("-");

    if (product === "finance" || product === "marketing") {
      if (type === "roadmap" || type === "backlog") {
        stats[product][type].likes += likes;
        stats[product][type].dislikes += dislikes;
        stats[product][type].total += total;
        stats[product][type].items += 1;

        // Totaux par produit
        stats[product].total.likes += likes;
        stats[product].total.dislikes += dislikes;
        stats[product].total.total += total;
        stats[product].total.items += 1;
      }
    }

    // Totaux globaux
    stats.global.likes += likes;
    stats.global.dislikes += dislikes;
    stats.global.total += total;
    stats.global.items += 1;
  });

  // Calculer les pourcentages
  const addPercentages = (data: {
    likes: number;
    dislikes: number;
    total: number;
    items: number;
  }) => {
    const total = data.likes + data.dislikes;
    return {
      ...data,
      likePercentage:
        total > 0 ? ((data.likes / total) * 100).toFixed(1) : "0.0",
      dislikePercentage:
        total > 0 ? ((data.dislikes / total) * 100).toFixed(1) : "0.0",
    };
  };

  return {
    finance: {
      roadmap: addPercentages(stats.finance.roadmap),
      backlog: addPercentages(stats.finance.backlog),
      total: addPercentages(stats.finance.total),
    },
    marketing: {
      roadmap: addPercentages(stats.marketing.roadmap),
      backlog: addPercentages(stats.marketing.backlog),
      total: addPercentages(stats.marketing.total),
    },
    global: addPercentages(stats.global),
    rawData: votes,
  };
}

// GET - Récupérer les statistiques
export async function GET() {
  try {
    const votes = readVotes();
    const stats = calculateStats(votes);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error calculating stats:", error);
    return NextResponse.json(
      { error: "Failed to calculate stats" },
      { status: 500 }
    );
  }
}
