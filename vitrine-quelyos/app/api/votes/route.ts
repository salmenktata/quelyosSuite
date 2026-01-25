import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VOTES_FILE = path.join(process.cwd(), "data", "votes.json");

// Assurer que le répertoire data existe
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Lire les votes depuis le fichier
function readVotes() {
  ensureDataDir();
  if (!fs.existsSync(VOTES_FILE)) {
    return {};
  }
  const data = fs.readFileSync(VOTES_FILE, "utf-8");
  return JSON.parse(data);
}

// Écrire les votes dans le fichier
function writeVotes(votes: Record<string, unknown>) {
  ensureDataDir();
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

// GET - Récupérer tous les votes
export async function GET() {
  try {
    const votes = readVotes();
    return NextResponse.json(votes);
  } catch (error) {
    console.error("Error reading votes:", error);
    return NextResponse.json(
      { error: "Failed to read votes" },
      { status: 500 }
    );
  }
}

// POST - Enregistrer ou supprimer un vote
export async function POST(request: Request) {
  try {
    const { itemId, category, voteType, action = "add" } = await request.json();

    if (!itemId || !category || !voteType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const votes = readVotes();
    const key = `${category}-${itemId}`;

    if (!votes[key]) {
      votes[key] = { likes: 0, dislikes: 0, category, itemId };
    }

    if (action === "remove") {
      // Supprimer un vote (annulation)
      if (voteType === "like") {
        votes[key].likes = Math.max(0, votes[key].likes - 1);
      } else if (voteType === "dislike") {
        votes[key].dislikes = Math.max(0, votes[key].dislikes - 1);
      }
    } else {
      // Ajouter un vote
      if (voteType === "like") {
        votes[key].likes += 1;
      } else if (voteType === "dislike") {
        votes[key].dislikes += 1;
      }
    }

    writeVotes(votes);

    return NextResponse.json({ success: true, data: votes[key] });
  } catch (error) {
    console.error("Error saving vote:", error);
    return NextResponse.json({ error: "Failed to save vote" }, { status: 500 });
  }
}
