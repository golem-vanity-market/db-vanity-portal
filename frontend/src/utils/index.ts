export function displayHours(totalHours: number): string {
  if (totalHours < 1) {
    const minutes = Math.round(totalHours * 60);
    return `${minutes}m`;
  } else if (totalHours < 24) {
    return `${totalHours.toFixed(1)}h`;
  } else {
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    return `${days}d ${hours}h`;
  }
}

export function assetsUrl(): string {
  const backendBase = import.meta.env.BASE_URL;
  if (backendBase == "/") {
    return "";
  }
  return backendBase;
}

export function backendUrl(): string {
  return import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5555";
}

export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(" ");
}

export const displayDifficulty = (difficulty: number): string => {
  const units = ["", "kH", "MH", "GH", "TH", "PH", "EH", "ZH", "YH"];
  let unitIndex = 0;

  while (difficulty >= 1000 && unitIndex < units.length - 1) {
    difficulty /= 1000;
    unitIndex++;
  }

  const precision = difficulty < 10 ? 3 : difficulty < 100 ? 2 : 1;
  return difficulty.toFixed(precision) + units[unitIndex];
};
