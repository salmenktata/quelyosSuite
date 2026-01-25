/**
 * EventDetector - Automatic detection of recurring transaction patterns
 *
 * Analyzes historical transactions to detect recurring events like:
 * - Monthly rent payments
 * - Bi-weekly payroll
 * - Weekly subscriptions
 * - Quarterly taxes
 */

class EventDetector {
  /**
   * Detect recurring patterns in transactions
   *
   * @param {Array} transactions - Historical transactions
   * @returns {Array} - Detected events with predictions
   */
  detectRecurringPatterns(transactions) {
    if (!transactions || transactions.length < 3) {
      return []; // Need at least 3 transactions to detect patterns
    }

    const patterns = [];
    const grouped = this.groupByAmount(transactions);

    grouped.forEach(group => {
      if (this.isRecurring(group)) {
        const nextOccurrence = this.predictNextOccurrence(group);

        patterns.push({
          date: nextOccurrence.toISOString().split('T')[0],
          label: this.generateLabel(group),
          confidence: this.calculateConfidence(group),
          type: "auto",
          source: "recurring_detection",
          metadata: {
            frequency: this.getFrequency(group),
            amount: group[0].amount,
            occurrences: group.length
          }
        });
      }
    });

    return patterns;
  }

  /**
   * Group transactions by similar amounts (±5% tolerance)
   *
   * @param {Array} transactions - Transactions to group
   * @returns {Array} - Arrays of similar transactions
   */
  groupByAmount(transactions) {
    const groups = {};

    transactions.forEach(tx => {
      // Round amount to nearest 100 for grouping (5% tolerance built in)
      const key = Math.round(tx.amount / 100) * 100;

      if (!groups[key]) {
        groups[key] = [];
      }

      // Only add if amount is within ±5% of key
      if (Math.abs(tx.amount - key) / key < 0.05) {
        groups[key].push(tx);
      }
    });

    // Return only groups with at least 3 occurrences
    return Object.values(groups).filter(g => g.length >= 3);
  }

  /**
   * Check if a group of transactions represents a recurring pattern
   *
   * @param {Array} group - Group of transactions
   * @returns {boolean} - True if recurring
   */
  isRecurring(group) {
    if (group.length < 3) return false;

    // Sort by date
    const dates = group
      .map(tx => new Date(tx.occurredAt))
      .sort((a, b) => a - b);

    // Calculate intervals between consecutive transactions
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    // Calculate average and variance
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) =>
      sum + Math.pow(i - avgInterval, 2), 0
    ) / intervals.length;

    // Low variance = recurring pattern
    // Accept patterns that vary by less than 10 days
    const isRecurring = variance < 100 && avgInterval >= 7; // Min weekly frequency

    return isRecurring;
  }

  /**
   * Predict next occurrence date
   *
   * @param {Array} group - Group of transactions
   * @returns {Date} - Predicted next occurrence
   */
  predictNextOccurrence(group) {
    // Sort by date
    const dates = group
      .map(tx => new Date(tx.occurredAt))
      .sort((a, b) => a - b);

    // Calculate average interval
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Predict next date = last date + average interval
    const lastDate = dates[dates.length - 1];
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + Math.round(avgInterval));

    return nextDate;
  }

  /**
   * Generate human-readable label for the event
   *
   * @param {Array} group - Group of transactions
   * @returns {string} - Event label
   */
  generateLabel(group) {
    const sample = group[0];
    const avgInterval = this.getAverageInterval(group);

    // Determine frequency
    let frequency = "";
    if (avgInterval >= 85 && avgInterval <= 95) { // ~90 days
      frequency = "trimestriel";
    } else if (avgInterval >= 28 && avgInterval <= 31) {
      frequency = "mensuel";
    } else if (avgInterval >= 13 && avgInterval <= 15) {
      frequency = "bimensuel";
    } else if (avgInterval >= 6 && avgInterval <= 8) {
      frequency = "hebdomadaire";
    } else {
      frequency = "récurrent";
    }

    // Try to use category or description
    if (sample.category?.name) {
      return `${sample.category.name} ${frequency}`;
    }

    if (sample.description) {
      // Extract first meaningful word from description
      const words = sample.description.split(/\s+/);
      const meaningfulWord = words[0] || "Transaction";
      return `${meaningfulWord} ${frequency}`;
    }

    // Fallback based on type and amount
    const type = sample.type === 'debit' ? 'Dépense' : 'Revenu';
    return `${type} ${frequency} (${Math.round(sample.amount)}€)`;
  }

  /**
   * Calculate confidence score for the pattern
   *
   * @param {Array} group - Group of transactions
   * @returns {number} - Confidence (0.0-1.0)
   */
  calculateConfidence(group) {
    if (group.length < 3) return 0;

    // More occurrences = higher confidence
    const occurrenceScore = Math.min(group.length / 10, 1); // Max at 10 occurrences

    // Lower variance = higher confidence
    const dates = group.map(tx => new Date(tx.occurredAt)).sort((a, b) => a - b);
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) =>
      sum + Math.pow(i - avgInterval, 2), 0
    ) / intervals.length;

    const varianceScore = Math.max(0, 1 - (variance / 100)); // Lower variance = higher score

    // Amount consistency
    const amounts = group.map(tx => tx.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const amountVariance = amounts.reduce((sum, amt) =>
      sum + Math.pow(amt - avgAmount, 2), 0
    ) / amounts.length;
    const amountScore = Math.max(0, 1 - (amountVariance / (avgAmount * avgAmount)));

    // Combined confidence score
    const confidence = (occurrenceScore * 0.3 + varianceScore * 0.4 + amountScore * 0.3);

    return Math.max(0.5, Math.min(1.0, confidence)); // Clamp between 0.5 and 1.0
  }

  /**
   * Get average interval between transactions in days
   *
   * @param {Array} group - Group of transactions
   * @returns {number} - Average interval in days
   */
  getAverageInterval(group) {
    const dates = group
      .map(tx => new Date(tx.occurredAt))
      .sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    return intervals.reduce((a, b) => a + b, 0) / intervals.length;
  }

  /**
   * Get interval variance
   *
   * @param {Array} group - Group of transactions
   * @returns {number} - Variance
   */
  getIntervalVariance(group) {
    const dates = group
      .map(tx => new Date(tx.occurredAt))
      .sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      const days = (dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return intervals.reduce((sum, i) =>
      sum + Math.pow(i - avgInterval, 2), 0
    ) / intervals.length;
  }

  /**
   * Get frequency classification
   *
   * @param {Array} group - Group of transactions
   * @returns {string} - Frequency: "weekly", "biweekly", "monthly", "quarterly"
   */
  getFrequency(group) {
    const avgInterval = this.getAverageInterval(group);

    if (avgInterval >= 85 && avgInterval <= 95) return "quarterly";
    if (avgInterval >= 28 && avgInterval <= 31) return "monthly";
    if (avgInterval >= 13 && avgInterval <= 15) return "biweekly";
    if (avgInterval >= 6 && avgInterval <= 8) return "weekly";
    return "custom";
  }
}

module.exports = new EventDetector();
