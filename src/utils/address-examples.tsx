import React from "react";

const randomHex = (length: number) =>
  Array(length)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

const InvalidInput = ({ reason }: { reason: string }) => (
  <span className="text-red-500">{reason}</span>
);

export const addressExamples = {
  "user-prefix": (specifier: string) => {
    const prefix = specifier.replace("0x", "").toUpperCase();
    const remaining = 40 - prefix.length;
    if (remaining < 0)
      return (
        <InvalidInput reason="Specifier must be between 0 and 40 characters" />
      );
    const randomPart = randomHex(remaining);
    return (
      <span>
        0x<span className="text-primary">{prefix}</span>
        {randomPart.toLowerCase()}
      </span>
    );
  },
  "user-suffix": (specifier: string) => {
    const suffix = specifier.toUpperCase();
    const remaining = 40 - suffix.length;
    if (remaining < 0)
      return (
        <InvalidInput reason="Specifier must be between 0 and 40 characters" />
      );
    const randomPart = randomHex(remaining);
    return (
      <span>
        0x{randomPart.toLowerCase()}
        <span className="text-primary">{suffix}</span>
      </span>
    );
  },
  "user-mask": (specifier: string) => {
    const mask = specifier.toUpperCase();
    if (mask.length !== 40)
      return <InvalidInput reason="Mask must be exactly 40 characters" />;
    if (!/^[0-9A-FX]{40}$/.test(mask))
      return (
        <InvalidInput reason="Mask can only contain hexadecimal characters and 'X'" />
      );
    const address = Array.from(mask).map((char) => {
      if (char === "X") {
        return randomHex(1);
      }
      return char;
    });

    return (
      <span>
        0x
        {address.map((char, i) => (
          <span key={i} className={mask[i] === "X" ? "" : "text-primary"}>
            {char}
          </span>
        ))}
      </span>
    );
  },
  "leading-any": (length: number) => {
    if (length < 1 || length > 40)
      return <InvalidInput reason="Length must be between 0 and 40" />;
    const char = randomHex(1).toUpperCase();
    const prefix = Array(length).fill(char).join("");
    const remaining = 40 - length;
    const randomPart = randomHex(remaining);
    return (
      <span>
        0x<span className="text-primary">{prefix}</span>
        {randomPart.toLowerCase()}
      </span>
    );
  },
  "trailing-any": (length: number) => {
    if (length < 1 || length > 40)
      return <InvalidInput reason="Length must be between 0 and 40" />;
    const char = randomHex(1).toUpperCase();
    const suffix = Array(length).fill(char).join("");
    const remaining = 40 - length;
    const randomPart = randomHex(remaining);
    return (
      <span>
        0x{randomPart.toLowerCase()}
        <span className="text-primary">{suffix}</span>
      </span>
    );
  },
  "letters-heavy": (count: number) => {
    if (count < 1 || count > 40)
      return <InvalidInput reason="Count must be between 0 and 40" />;
    const letters = "ABCDEF";
    // Create an array of indices [0, 1, ..., 39]
    const indices = Array.from({ length: 40 }, (_, i) => i);
    // Shuffle the indices
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const letterPositions = new Set(indices.slice(0, count));
    const addressArr = Array(40).fill(null);

    for (let i = 0; i < 40; i++) {
      if (letterPositions.has(i)) {
        addressArr[i] = letters[Math.floor(Math.random() * letters.length)];
      } else {
        addressArr[i] = Math.floor(Math.random() * 10).toString();
      }
    }

    return (
      <span>
        0x
        {addressArr.map((char, i) => (
          <span
            key={i}
            className={letters.includes(char) ? "text-primary" : ""}
          >
            {char}
          </span>
        ))}
      </span>
    );
  },
  "numbers-heavy": () => {
    const address = Array(40)
      .fill(0)
      .map(() => Math.floor(Math.random() * 10))
      .join("");
    return (
      <span>
        0x<span className="text-primary">{address}</span>
      </span>
    );
  },
  "snake-score-no-case": (count: number) => {
    const ADDRESS_HEX_LENGTH = 40;

    if (count < 1 || count > 39)
      return <InvalidInput reason="Number of pairs must be between 1 and 39" />;

    // Partitions an integer into a given number of parts, each >= 1.
    const partitionInteger = (number: number, parts: number) => {
      const partitions = Array(parts).fill(1);
      let remainder = number - parts;
      while (remainder > 0) {
        partitions[Math.floor(Math.random() * parts)]++;
        remainder--;
      }
      return partitions;
    };
    const shuffleArray = (array: number[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    };

    const minK = Math.ceil(count / 6); // Let's say the biggest snake is 6 characters long
    const maxK = Math.min(ADDRESS_HEX_LENGTH - count, count);

    let k;
    if (minK > maxK) {
      // It's possible that a longer snake is forced, e.g. count=35
      k = maxK;
    } else {
      // Pick a random valid number of scoring chunks.
      k = Math.floor(Math.random() * (maxK - minK + 1)) + minK;
    }

    const scoringChunks = partitionInteger(count, k);
    const numSingletons = ADDRESS_HEX_LENGTH - (count + k);
    const singletonChunks = Array(numSingletons).fill(0);

    const plan = scoringChunks.concat(singletonChunks);
    shuffleArray(plan);

    const hexChars = "0123456789abcdef";
    const getRandomHexCharExcluding = (excludeChar: string | null) => {
      let newChar;
      do {
        newChar = hexChars[Math.floor(Math.random() * hexChars.length)];
      } while (newChar === excludeChar);
      return newChar;
    };

    const address = ["0", "x"];
    let lastChar: string | null = null;

    for (const score of plan) {
      const chunkLength = score + 1; // score of 1 ('aa') is length 2
      const char = getRandomHexCharExcluding(lastChar);

      for (let i = 0; i < chunkLength; i++) {
        address.push(char);
      }
      lastChar = char;
    }

    return (
      <span>
        {address.map((char, i, arr) => {
          const isSnake =
            (i > 1 && arr[i] === arr[i - 1]) || // part of a pair with the previous char
            (i < arr.length - 1 && arr[i] === arr[i + 1]); // part of a pair with the next char

          return (
            <span key={i} className={isSnake ? "text-primary" : ""}>
              {char}
            </span>
          );
        })}
      </span>
    );
  },
};
