const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * POST /user/nps
 * Submit NPS feedback (score 0-10 + optional text)
 * Body: { score: number, feedback?: string, testimonialOptIn?: boolean }
 */
router.post("/nps", async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { score, feedback, testimonialOptIn } = req.body;

    // Validation
    if (typeof score !== "number" || score < 0 || score > 10) {
      return res.status(400).json({ error: "Score must be between 0 and 10" });
    }

    // Create NPS response
    const npsResponse = await prisma.nPSResponse.create({
      data: {
        userId,
        companyId,
        score,
        feedback: feedback || null,
        testimonialOptIn: testimonialOptIn || false,
      },
    });

    res.json({
      success: true,
      id: npsResponse.id,
      message: "Merci pour votre retour !",
    });
  } catch (error) {
    console.error("Error submitting NPS:", error);
    res.status(500).json({ error: "Failed to submit NPS feedback" });
  }
});

/**
 * GET /user/nps/stats
 * Get company-wide NPS statistics (ADMIN only)
 */
router.get("/nps/stats", async (req, res) => {
  try {
    const { companyId, role } = req.user;

    // Only admins can see company stats
    if (role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const responses = await prisma.nPSResponse.findMany({
      where: { companyId },
      select: {
        score: true,
        createdAt: true,
        testimonialOptIn: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalResponses = responses.length;
    if (totalResponses === 0) {
      return res.json({
        totalResponses: 0,
        npsScore: null,
        promoters: 0,
        passives: 0,
        detractors: 0,
        averageScore: null,
      });
    }

    // Calculate NPS (Promoters % - Detractors %)
    const promoters = responses.filter((r) => r.score >= 9).length;
    const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = responses.filter((r) => r.score <= 6).length;

    const promotersPercent = (promoters / totalResponses) * 100;
    const detractorsPercent = (detractors / totalResponses) * 100;
    const npsScore = Math.round(promotersPercent - detractorsPercent);

    const averageScore = (
      responses.reduce((sum, r) => sum + r.score, 0) / totalResponses
    ).toFixed(1);

    const testimonialLeads = responses.filter(
      (r) => r.score >= 9 && r.testimonialOptIn
    ).length;

    res.json({
      totalResponses,
      npsScore,
      promoters,
      passives,
      detractors,
      averageScore: parseFloat(averageScore),
      testimonialLeads,
    });
  } catch (error) {
    console.error("Error fetching NPS stats:", error);
    res.status(500).json({ error: "Failed to fetch NPS statistics" });
  }
});

/**
 * GET /user/nps/my-history
 * Get current user's NPS response history
 */
router.get("/nps/my-history", async (req, res) => {
  try {
    const { userId } = req.user;

    const responses = await prisma.nPSResponse.findMany({
      where: { userId },
      select: {
        id: true,
        score: true,
        feedback: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(responses);
  } catch (error) {
    console.error("Error fetching NPS history:", error);
    res.status(500).json({ error: "Failed to fetch NPS history" });
  }
});

module.exports = router;
