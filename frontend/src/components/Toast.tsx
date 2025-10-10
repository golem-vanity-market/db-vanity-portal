import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

interface ToastProps {
  id: string | number;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning" | "destructive";
  button?: {
    label: string;
    onClick: () => void;
  };
}

export function toast(toast: Omit<ToastProps, "id">) {
  return sonnerToast.custom((id) => (
    <Toast id={id} title={toast.title} description={toast.description} button={toast.button} variant={toast.variant} />
  ));
}

function Toast(props: ToastProps) {
  const { title, description, button, id, variant = "info" } = props;

  const resolvedVariant: NonNullable<ToastProps["variant"]> = variant === "destructive" ? "error" : variant;

  const styles = {
    success: {
      Icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badge: "bg-emerald-600/10 ring-1 ring-emerald-600/20",
    },
    error: {
      Icon: XCircle,
      iconColor: "text-red-600 dark:text-red-400",
      badge: "bg-red-600/10 ring-1 ring-red-600/20",
    },
    warning: {
      Icon: AlertTriangle,
      iconColor: "text-amber-600 dark:text-amber-400",
      badge: "bg-amber-600/10 ring-1 ring-amber-600/20",
    },
    info: {
      Icon: Info,
      iconColor: "text-sky-600 dark:text-sky-400",
      badge: "bg-sky-600/10 ring-1 ring-sky-600/20",
    },
  } as const;

  const IconComp = styles[resolvedVariant].Icon;

  return (
    <div className="flex w-md items-stretch gap-3 rounded-md bg-accent p-4">
      <div className={cn("mt-0.5 grid size-8 place-items-center rounded-md shrink-0", styles[resolvedVariant].badge)}>
        <IconComp className={cn("size-5", styles[resolvedVariant].iconColor)} aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-row justify-between gap-4 overflow-hidden">
        <div className="flex h-full min-w-0 flex-col items-start justify-center">
          <p className="w-full truncate text-sm leading-none font-medium">{title}</p>
          {description ? <p className="mt-1 line-clamp-3 w-full text-sm text-muted-foreground">{description}</p> : null}
        </div>

        {button ? (
          <Button
            size="sm"
            variant={resolvedVariant === "error" ? "destructive" : "outline"}
            onClick={() => {
              try {
                button.onClick();
              } finally {
                sonnerToast.dismiss(id);
              }
            }}
          >
            {button.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
