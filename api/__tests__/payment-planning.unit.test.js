/**
 * Tests unitaires pour l'algorithme d'optimisation de paiements
 * Tests des fonctions pures sans dépendances externes
 */

describe("Payment Planning - Unit Tests", () => {
  // Mock functions extracted from payment-planning.js
  const calculatePriorityScore = (invoice, strategy) => {
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const daysUntilDue = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));

    let score = 0;

    switch (strategy) {
      case "BY_DUE_DATE":
        score = 1000 - daysUntilDue;
        if (daysUntilDue < 0) {
          score += Math.abs(daysUntilDue) * 10;
        }
        break;

      case "BY_IMPORTANCE":
        const importanceScores = {
          CRITICAL: 1000,
          HIGH: 750,
          NORMAL: 500,
          LOW: 250,
        };
        score = importanceScores[invoice.supplier.importance] || 500;
        score -= daysUntilDue;
        break;

      case "MINIMIZE_PENALTIES":
        const penaltyRate = invoice.supplier.latePaymentPenalty || 0;
        if (penaltyRate > 0) {
          score = penaltyRate * invoice.amount * 10;
        } else {
          score = 500 - daysUntilDue;
        }
        break;

      case "MAXIMIZE_DISCOUNTS":
        const discountRate = invoice.supplier.earlyPaymentDiscount || 0;
        if (discountRate > 0 && daysUntilDue > 7) {
          score = discountRate * invoice.amount * daysUntilDue;
        } else {
          score = 100 - daysUntilDue;
        }
        break;

      case "OPTIMIZE_CASH_FLOW":
        const urgencyScore = 1000 - daysUntilDue;
        const importanceScore = {
          CRITICAL: 500,
          HIGH: 300,
          NORMAL: 100,
          LOW: 0,
        }[invoice.supplier.importance] || 100;

        const penaltyScore = (invoice.supplier.latePaymentPenalty || 0) * 10;
        const discountScore = (invoice.supplier.earlyPaymentDiscount || 0) * 5;

        score =
          urgencyScore * 0.4 +
          importanceScore * 0.3 +
          penaltyScore * 0.2 +
          discountScore * 0.1;
        break;

      default:
        score = 500 - daysUntilDue;
    }

    return Math.max(0, score);
  };

  const calculateLatePenalty = (invoice, scheduledDate) => {
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysLate = Math.max(0, Math.floor((scheduled - dueDate) / (1000 * 60 * 60 * 24)));

    if (daysLate === 0) {
      return { penalty: 0, daysLate: 0 };
    }

    const penaltyRate = invoice.supplier?.latePaymentPenalty || 0;

    if (penaltyRate === 0) {
      return { penalty: 0, daysLate };
    }

    const dailyPenaltyRate = penaltyRate / 365;
    const penalty = invoice.amount * (dailyPenaltyRate / 100) * daysLate;

    return {
      penalty: Math.round(penalty * 100) / 100,
      daysLate,
    };
  };

  const calculateEarlyDiscount = (invoice, scheduledDate) => {
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);

    const dueDate = new Date(invoice.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysEarly = Math.max(0, Math.floor((dueDate - scheduled) / (1000 * 60 * 60 * 24)));

    if (daysEarly === 0) {
      return { discount: 0, daysEarly: 0 };
    }

    const discountRate = invoice.supplier?.earlyPaymentDiscount || 0;

    if (discountRate === 0 || daysEarly < 7) {
      return { discount: 0, daysEarly };
    }

    const discount = invoice.amount * (discountRate / 100);

    return {
      discount: Math.round(discount * 100) / 100,
      daysEarly,
    };
  };

  describe("calculatePriorityScore", () => {
    const baseInvoice = {
      id: "inv-1",
      amount: 1000,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 jours
      supplier: {
        importance: "NORMAL",
        latePaymentPenalty: 0,
        earlyPaymentDiscount: 0,
      },
    };

    test("BY_DUE_DATE: priorité augmente quand échéance proche", () => {
      const score1 = calculatePriorityScore(
        {
          ...baseInvoice,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5j
        },
        "BY_DUE_DATE"
      );

      const score2 = calculatePriorityScore(
        {
          ...baseInvoice,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15j
        },
        "BY_DUE_DATE"
      );

      expect(score1).toBeGreaterThan(score2);
    });

    test("BY_DUE_DATE: bonus important pour factures en retard", () => {
      const onTimeScore = calculatePriorityScore(
        {
          ...baseInvoice,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        "BY_DUE_DATE"
      );

      const overdueScore = calculatePriorityScore(
        {
          ...baseInvoice,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // -5j (retard)
        },
        "BY_DUE_DATE"
      );

      expect(overdueScore).toBeGreaterThan(onTimeScore);
    });

    test("BY_IMPORTANCE: fournisseur CRITICAL > HIGH > NORMAL > LOW", () => {
      const scoreCritical = calculatePriorityScore(
        { ...baseInvoice, supplier: { ...baseInvoice.supplier, importance: "CRITICAL" } },
        "BY_IMPORTANCE"
      );

      const scoreHigh = calculatePriorityScore(
        { ...baseInvoice, supplier: { ...baseInvoice.supplier, importance: "HIGH" } },
        "BY_IMPORTANCE"
      );

      const scoreNormal = calculatePriorityScore(baseInvoice, "BY_IMPORTANCE");

      const scoreLow = calculatePriorityScore(
        { ...baseInvoice, supplier: { ...baseInvoice.supplier, importance: "LOW" } },
        "BY_IMPORTANCE"
      );

      expect(scoreCritical).toBeGreaterThan(scoreHigh);
      expect(scoreHigh).toBeGreaterThan(scoreNormal);
      expect(scoreNormal).toBeGreaterThan(scoreLow);
    });

    test("MINIMIZE_PENALTIES: priorité basée sur le taux de pénalité", () => {
      const scoreWithPenalty = calculatePriorityScore(
        {
          ...baseInvoice,
          amount: 1000,
          supplier: { ...baseInvoice.supplier, latePaymentPenalty: 5 },
        },
        "MINIMIZE_PENALTIES"
      );

      const scoreWithoutPenalty = calculatePriorityScore(baseInvoice, "MINIMIZE_PENALTIES");

      expect(scoreWithPenalty).toBeGreaterThan(scoreWithoutPenalty);
    });

    test("MAXIMIZE_DISCOUNTS: priorité basée sur les remises possibles", () => {
      const scoreWithDiscount = calculatePriorityScore(
        {
          ...baseInvoice,
          amount: 1000,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30j
          supplier: { ...baseInvoice.supplier, earlyPaymentDiscount: 2 },
        },
        "MAXIMIZE_DISCOUNTS"
      );

      const scoreWithoutDiscount = calculatePriorityScore(
        {
          ...baseInvoice,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        "MAXIMIZE_DISCOUNTS"
      );

      expect(scoreWithDiscount).toBeGreaterThan(scoreWithoutDiscount);
    });

    test("Score ne peut jamais être négatif", () => {
      const invoice = {
        ...baseInvoice,
        dueDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const score = calculatePriorityScore(invoice, "BY_DUE_DATE");
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculateLatePenalty", () => {
    const invoice = {
      amount: 1000,
      dueDate: new Date("2024-01-15").toISOString(),
      supplier: {
        latePaymentPenalty: 5, // 5% annuel
      },
    };

    test("Pas de pénalité si paiement à temps", () => {
      const result = calculateLatePenalty(invoice, new Date("2024-01-15"));
      expect(result.penalty).toBe(0);
      expect(result.daysLate).toBe(0);
    });

    test("Pas de pénalité si paiement en avance", () => {
      const result = calculateLatePenalty(invoice, new Date("2024-01-10"));
      expect(result.penalty).toBe(0);
      expect(result.daysLate).toBe(0);
    });

    test("Calcul correct des pénalités pour 10 jours de retard", () => {
      const result = calculateLatePenalty(invoice, new Date("2024-01-25")); // 10j retard

      // Formule: 1000 * (5/365)/100 * 10 = ~1.37€
      expect(result.daysLate).toBe(10);
      expect(result.penalty).toBeCloseTo(1.37, 1);
    });

    test("Pas de pénalité si taux = 0", () => {
      const invoiceNoPenalty = {
        ...invoice,
        supplier: { latePaymentPenalty: 0 },
      };

      const result = calculateLatePenalty(invoiceNoPenalty, new Date("2024-01-25"));
      expect(result.penalty).toBe(0);
      expect(result.daysLate).toBe(10);
    });

    test("Pénalité proportionnelle au montant", () => {
      const result1000 = calculateLatePenalty(
        { ...invoice, amount: 1000 },
        new Date("2024-01-25")
      );
      const result2000 = calculateLatePenalty(
        { ...invoice, amount: 2000 },
        new Date("2024-01-25")
      );

      expect(result2000.penalty).toBeCloseTo(result1000.penalty * 2, 1);
    });
  });

  describe("calculateEarlyDiscount", () => {
    const invoice = {
      amount: 1000,
      dueDate: new Date("2024-01-20").toISOString(),
      supplier: {
        earlyPaymentDiscount: 2, // 2%
      },
    };

    test("Pas de remise si paiement à l'échéance", () => {
      const result = calculateEarlyDiscount(invoice, new Date("2024-01-20"));
      expect(result.discount).toBe(0);
      expect(result.daysEarly).toBe(0);
    });

    test("Pas de remise si paiement en retard", () => {
      const result = calculateEarlyDiscount(invoice, new Date("2024-01-25"));
      expect(result.discount).toBe(0);
      expect(result.daysEarly).toBe(0);
    });

    test("Pas de remise si moins de 7 jours en avance", () => {
      const result = calculateEarlyDiscount(invoice, new Date("2024-01-15")); // 5j avance
      expect(result.discount).toBe(0);
      expect(result.daysEarly).toBe(5);
    });

    test("Remise appliquée si 7+ jours en avance", () => {
      const result = calculateEarlyDiscount(invoice, new Date("2024-01-10")); // 10j avance

      // 1000 * 2% = 20€
      expect(result.daysEarly).toBe(10);
      expect(result.discount).toBe(20);
    });

    test("Pas de remise si taux = 0", () => {
      const invoiceNoDiscount = {
        ...invoice,
        supplier: { earlyPaymentDiscount: 0 },
      };

      const result = calculateEarlyDiscount(invoiceNoDiscount, new Date("2024-01-05"));
      expect(result.discount).toBe(0);
      expect(result.daysEarly).toBe(15);
    });

    test("Remise proportionnelle au montant", () => {
      const result1000 = calculateEarlyDiscount(
        { ...invoice, amount: 1000 },
        new Date("2024-01-10")
      );
      const result2000 = calculateEarlyDiscount(
        { ...invoice, amount: 2000 },
        new Date("2024-01-10")
      );

      expect(result2000.discount).toBe(result1000.discount * 2);
    });
  });

  describe("Scénarios complexes", () => {
    test("Facture avec pénalité élevée et importance critique = priorité maximale", () => {
      const urgentInvoice = {
        amount: 5000,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        supplier: {
          importance: "CRITICAL",
          latePaymentPenalty: 10,
        },
      };

      const normalInvoice = {
        amount: 5000,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        supplier: {
          importance: "NORMAL",
          latePaymentPenalty: 0,
        },
      };

      const scoreUrgent = calculatePriorityScore(urgentInvoice, "OPTIMIZE_CASH_FLOW");
      const scoreNormal = calculatePriorityScore(normalInvoice, "OPTIMIZE_CASH_FLOW");

      expect(scoreUrgent).toBeGreaterThan(scoreNormal);
    });

    test("Pénalité + remise sur même facture", () => {
      const invoice = {
        amount: 1000,
        dueDate: new Date("2024-01-15").toISOString(),
        supplier: {
          latePaymentPenalty: 5,
          earlyPaymentDiscount: 2,
        },
      };

      // Paiement en retard
      const penaltyResult = calculateLatePenalty(invoice, new Date("2024-01-25"));
      expect(penaltyResult.penalty).toBeGreaterThan(0);

      // Paiement anticipé
      const discountResult = calculateEarlyDiscount(invoice, new Date("2024-01-05"));
      expect(discountResult.discount).toBeGreaterThan(0);

      // Les deux ne peuvent pas s'appliquer en même temps
      expect(penaltyResult.daysLate).toBe(10);
      expect(discountResult.daysEarly).toBe(10);
    });
  });
});
