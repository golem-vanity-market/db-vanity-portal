export function assetsUrl(): string {
  const backendBase = import.meta.env.VITE_BACKEND_BASE_URL;
  if (!backendBase) {
    return "";
  }
  return backendBase + "/";
}

export function backendUrl(): string {
  return import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5555";
}

export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(" ");
}
