type ProblemCategory =
  | "user-prefix" // The address starts with the user-defined prefix.
  | "user-suffix" // The address ends with the user-defined suffix.
  | "user-mask" // The address matches the user-defined mask (e.g., 0xabcXXXabcXXXabc where X is any character).
  | "leading-any" // The number of leading characters that are the same.
  | "trailing-any" // The number of trailing characters that are the same.
  | "letters-heavy" // Addresses with a high number of letters (a-f).
  | "numbers-heavy" // Addresses with a high number of ciphers (0-9).
  | "snake-score-no-case"; // The number of repeating characters in the address. Case insensitive.

export type Problem =
  | {
      type: "leading-any";
      length: number;
    }
  | {
      type: "trailing-any";
      length: number;
    }
  | {
      type: "letters-heavy";
      count: number;
    }
  | {
      type: "numbers-heavy";
    }
  | {
      type: "snake-score-no-case";
      count: number;
    }
  | {
      type: "user-prefix";
      specifier: string;
    }
  | {
      type: "user-suffix";
      specifier: string;
    }
  | {
      type: "user-mask";
      specifier: string;
    };

/**
 * Calculates "n choose k" using BigInt for perfect precision.
 */
function combinationsBigInt(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  if (k === 0n || k === n) return 1n;
  if (k > n / 2n) k = n - k;

  let result = 1n;
  for (let i = 1n; i <= k; i++) {
    result = (result * (n - i + 1n)) / i;
  }
  return result;
}

/**
 * Calculates the number of addresses with EXACTLY a certain number of letters, using BigInt.
 */
function exactlyLettersCombinationsBigInt(letters: number, total: number): bigint {
  if (letters < 0 || letters > total) return 0n;
  const n = BigInt(total);
  const k = BigInt(letters);
  // (6^letters) * (10^(total-letters)) * combinations(total, letters)
  return 6n ** k * 10n ** (n - k) * combinationsBigInt(n, k);
}

/**
 * Calculates the number of addresses with EXACTLY a certain number of adjacent pairs, using BigInt.
 */
function snakeCombinationsBigInt(pairs: number, total: number): bigint {
  if (pairs < 0 || pairs >= total) return 0n;
  const p = BigInt(pairs);
  const n = BigInt(total);
  // 16 * 15^(total-1-pairs) * combinations(total-1, pairs)
  return 16n * 15n ** (n - 1n - p) * combinationsBigInt(n - 1n, p);
}

const TOTAL_ADDRESS_SPACE = 16n ** 40n;

/**
 * Calculates the size of the "problem space" for a given category and threshold.
 * This is the number of addresses that meet or exceed the threshold.
 * NOTE: This calculation sums the spaces for each category, ignoring overlaps.
 */
function calculateProbabilitySpace(category: ProblemCategory, threshold: number): bigint {
  switch (category) {
    case "user-prefix": {
      // The number of addresses with at least `threshold` characters matching the user-defined pattern.
      if (threshold > 40 || threshold < 1) return TOTAL_ADDRESS_SPACE;
      return 16n ** BigInt(40 - threshold);
    }

    case "user-suffix": {
      // The number of addresses with at least `threshold` characters matching the user-defined pattern.
      if (threshold > 40 || threshold < 1) return TOTAL_ADDRESS_SPACE;
      return 16n ** BigInt(40 - threshold);
    }

    case "user-mask": {
      // The number of addresses with at least `threshold` characters matching the user-defined mask.
      if (threshold > 40 || threshold < 1) return TOTAL_ADDRESS_SPACE;
      return 16n ** BigInt(40 - threshold);
    }

    case "leading-any": {
      // The number of addresses with at least `threshold` identical leading characters.
      if (threshold > 40 || threshold < 1) return TOTAL_ADDRESS_SPACE;
      return 16n * 16n ** BigInt(40 - threshold);
    }

    case "trailing-any": {
      // The number of addresses with at least `threshold` identical trailing characters.
      if (threshold > 40 || threshold < 1) return TOTAL_ADDRESS_SPACE;
      return 16n * 16n ** BigInt(40 - threshold);
    }

    case "letters-heavy": {
      // At least `threshold` letters. We must sum combinations for k = threshold, threshold+1, ..., 40.
      let total = 0n;
      for (let k = threshold; k <= 40; k++) {
        total += exactlyLettersCombinationsBigInt(k, 40);
      }
      return total;
    }

    case "numbers-heavy": {
      // At least `threshold` numbers. This is equivalent to at most `40-threshold` letters.
      let total = 0n;
      for (let k = threshold; k <= 40; k++) {
        // An address with `k` numbers has `40-k` letters.
        total += exactlyLettersCombinationsBigInt(40 - k, 40);
      }
      return total;
    }

    case "snake-score-no-case": {
      // At least `threshold` adjacent pairs. Max pairs is 39.
      let total = 0n;
      for (let k = threshold; k <= 39; k++) {
        total += snakeCombinationsBigInt(k, 40);
      }
      return total;
    }

    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

/**
 * Calculate the number of addresses that need to be checked on average
 * to find an address matching at least one problem. If thresholds are not
 * provided the calculation will be done based on the thresholds defined in each problem
 */
export function calculateWorkUnitForProblems(problems: Problem[]): number {
  const thresholds = problems.reduce(
    (acc, problem) => {
      switch (problem.type) {
        case "user-prefix":
          acc[problem.type] = problem.specifier.replace(/^0x/, "").length;
          break;
        case "user-suffix":
          acc[problem.type] = problem.specifier.length;
          break;
        case "user-mask":
          acc[problem.type] = problem.specifier.replace(/^0x/, "").replace(/x/g, "").length;
          break;
        case "leading-any":
          acc[problem.type] = problem.length;
          break;
        case "trailing-any":
          acc[problem.type] = problem.length;
          break;
        case "letters-heavy":
          acc[problem.type] = problem.count;
          break;
        case "numbers-heavy":
          acc[problem.type] = 40;
          break;
        case "snake-score-no-case":
          acc[problem.type] = problem.count;
          break;
        default:
          break;
      }
      return acc;
    },
    {} as Record<ProblemCategory, number>,
  );

  let totalProbabilitySpace = 0n;

  for (const problem of problems) {
    const category = problem.type;
    const threshold = thresholds[category];
    if (threshold === undefined) continue;
    totalProbabilitySpace += calculateProbabilitySpace(category, threshold);
  }

  return Number(TOTAL_ADDRESS_SPACE / (totalProbabilitySpace || TOTAL_ADDRESS_SPACE));
}
