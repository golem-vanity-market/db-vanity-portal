import React from "react";

const randomHex = (length: number) =>
  Array(length)
    .fill(0)
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

export const addressExamples = {
  "user-prefix": (specifier: string) => {
    const prefix = specifier.replace("0x", "").toUpperCase();
    const remaining = 40 - prefix.length;
    if (remaining < 0) return null;
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
    if (remaining < 0) return null;
    const randomPart = randomHex(remaining);
    return (
      <span>
        0x{randomPart.toLowerCase()}
        <span className="text-primary">{suffix}</span>
      </span>
    );
  },
  "user-mask": (specifier: string) => {
    const mask = specifier.replace("0x", "").toUpperCase();
    if (mask.length !== 40) return null;
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
    if (length < 1 || length > 40) return null;
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
    if (length < 1 || length > 40) return null;
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
    if (count < 1 || count > 40) return null;
    const letters = "ABCDEF";
    let address = "";
    for (let i = 0; i < 40; i++) {
      if (i < count) {
        address += letters[Math.floor(Math.random() * letters.length)];
      } else {
        address += randomHex(1);
      }
    }

    return (
      <span>
        0x
        {Array.from(address).map((char, i) => (
          <span key={i} className={letters.includes(char) ? "text-primary" : ""}>
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
    if (count < 1 || count > 20) return null;
    let address = "";
    for (let i = 0; i < count; i++) {
      const char = randomHex(1);
      address += char + char;
    }
    const remaining = 40 - address.length;
    address += randomHex(remaining);

    return (
      <span>
        0x
        {Array.from(address).map((char, i, arr) => (
          <span key={i} className={arr[i] === arr[i - 1] ? "text-primary" : ""}>
            {char}
          </span>
        ))}
      </span>
    );
  },
};
