"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { logger } from "@/lib/logger";

interface VoteButtonProps {
  itemId: string;
  category:
    | "finance-roadmap"
    | "finance-backlog"
    | "marketing-roadmap"
    | "marketing-backlog";
}

type VoteType = "like" | "dislike" | null;

export default function VoteButton({ itemId, category }: VoteButtonProps) {
  const voteKey = `vote-${category}-${itemId}`;
  const likesKey = `likes-${category}-${itemId}`;
  const dislikesKey = `dislikes-${category}-${itemId}`;

  const [likes, setLikes] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(likesKey);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [dislikes, setDislikes] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(dislikesKey);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });
  const [userVote, setUserVote] = useState<VoteType>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(voteKey) as VoteType;
    }
    return null;
  });

  const handleVote = async (type: "like" | "dislike") => {
    // Si l'utilisateur clique sur le même vote, on annule
    if (userVote === type) {
      // Décrémenter le compteur approprié
      if (type === "like") {
        const newLikes = Math.max(0, likes - 1);
        setLikes(newLikes);
        localStorage.setItem(likesKey, newLikes.toString());
      } else {
        const newDislikes = Math.max(0, dislikes - 1);
        setDislikes(newDislikes);
        localStorage.setItem(dislikesKey, newDislikes.toString());
      }

      // Supprimer le vote de l'utilisateur
      setUserVote(null);
      localStorage.removeItem(voteKey);

      // Envoyer l'annulation à l'API
      try {
        await fetch("/api/votes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId,
            category,
            voteType: type,
            action: "remove",
          }),
        });
      } catch (error) {
        logger.error("Error removing vote from API:", error);
      }
      return;
    }

    // Si l'utilisateur a déjà voté différemment, ne rien faire
    if (userVote) return;

    // Incrémenter le compteur approprié localement
    if (type === "like") {
      const newLikes = likes + 1;
      setLikes(newLikes);
      localStorage.setItem(likesKey, newLikes.toString());
    } else {
      const newDislikes = dislikes + 1;
      setDislikes(newDislikes);
      localStorage.setItem(dislikesKey, newDislikes.toString());
    }

    // Enregistrer le vote de l'utilisateur
    setUserVote(type);
    localStorage.setItem(voteKey, type);

    // Envoyer le vote à l'API
    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          category,
          voteType: type,
          action: "add",
        }),
      });
    } catch (error) {
      logger.error("Error sending vote to API:", error);
      // Le vote est déjà enregistré localement, on continue
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Like Button */}
      <button
        onClick={() => handleVote("like")}
        disabled={userVote === "dislike"}
        aria-label={
          userVote === "like"
            ? "Annuler le vote positif"
            : userVote === "dislike"
              ? "Vote positif désactivé"
              : "Voter positivement"
        }
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border px-3 py-2 transition-all ${
          userVote === "like"
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 cursor-pointer hover:bg-emerald-500/30"
            : userVote === "dislike"
              ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-50"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-300 cursor-pointer"
        }`}
        title={
          userVote === "like"
            ? "Cliquez pour annuler votre like"
            : userVote === "dislike"
              ? "Vous avez déjà voté"
              : "J'aime cette fonctionnalité"
        }
      >
        <ThumbsUp
          className={`h-3.5 w-3.5 ${userVote === "like" ? "fill-emerald-300" : ""}`}
        />
        <span className="text-xs font-medium">{likes}</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleVote("dislike")}
        disabled={userVote === "like"}
        aria-label={
          userVote === "dislike"
            ? "Annuler le vote négatif"
            : userVote === "like"
              ? "Vote négatif désactivé"
              : "Voter négativement"
        }
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-lg border px-3 py-2 transition-all ${
          userVote === "dislike"
            ? "bg-red-500/20 border-red-500/30 text-red-300 cursor-pointer hover:bg-red-500/30"
            : userVote === "like"
              ? "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed opacity-50"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 cursor-pointer"
        }`}
        title={
          userVote === "dislike"
            ? "Cliquez pour annuler votre dislike"
            : userVote === "like"
              ? "Vous avez déjà voté"
              : "Je n'aime pas cette fonctionnalité"
        }
      >
        <ThumbsDown
          className={`h-3.5 w-3.5 ${userVote === "dislike" ? "fill-red-300" : ""}`}
        />
        <span className="text-xs font-medium">{dislikes}</span>
      </button>
    </div>
  );
}
