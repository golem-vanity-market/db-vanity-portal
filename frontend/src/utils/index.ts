export function backendUrl(): string {
  return import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5555";
}

export function classNames(...classes: unknown[]): string {
  return classes.filter(Boolean).join(" ");
}
