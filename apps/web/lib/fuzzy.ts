/**
 * Computes the similarity score between two strings using Sørensen–Dice coefficient.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function diceCoefficient(str1: string, str2: string): number {
  const s1 = (str1 || "").trim().toLowerCase();
  const s2 = (str2 || "").trim().toLowerCase();

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) {
    // Fallback to simple matching if too short for bigrams
    return s1.includes(s2) || s2.includes(s1) ? 0.5 : 0.0;
  }

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);

  let intersection = 0;
  b1.forEach((count, bigram) => {
    if (b2.has(bigram)) {
      intersection += Math.min(count, b2.get(bigram)!);
    }
  });

  const totalBigrams = (s1.length - 1) + (s2.length - 1);
  return (2.0 * intersection) / totalBigrams;
}

/**
 * Computes Levenshtein distance similarity.
 * Returns a score between 0 and 1.
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const s1 = (str1 || "").trim().toLowerCase();
  const s2 = (str2 || "").trim().toLowerCase();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  const d: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array(len2 + 1).fill(0)
  );

  for (let i = 0; i <= len1; i++) d[i][0] = i;
  for (let j = 0; j <= len2; j++) d[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = d[len1][len2];
  return (maxLen - distance) / maxLen;
}

/**
 * Combined similarity score leveraging both bigram similarity (Sørensen–Dice)
 * and edit distance (Levenshtein) to handle various typos, abbreviations,
 * and word re-orderings gracefully.
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0.0;

  // Calculate raw similarity
  const rawDice = diceCoefficient(str1, str2);
  const rawLev = levenshteinSimilarity(str1, str2);
  const rawScore = 0.6 * rawDice + 0.4 * rawLev;

  // Handle word order variance: tokenize, sort alphabetically, join and compare
  const tokenizeAndSort = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .sort()
      .join(" ");
  };

  const sorted1 = tokenizeAndSort(str1);
  const sorted2 = tokenizeAndSort(str2);

  if (sorted1 === sorted2) return 1.0;

  const sortedDice = diceCoefficient(sorted1, sorted2);
  const sortedLev = levenshteinSimilarity(sorted1, sorted2);
  const sortedScore = 0.6 * sortedDice + 0.4 * sortedLev;

  // Return the best of either word order or sorted word comparison
  return Math.max(rawScore, sortedScore);
}
