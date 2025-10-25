import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Copy, Check } from "lucide-react";
import { toast } from "@/components/Toast";

const examplePublicKey =
  "0x04d4a96d675423cc05f60409c48b084a53d3fa0ac59957939f526505c43f975b77fabab74decd66d80396308db9cb4db13b0c273811d51a1773d6d9e2dbcac1d28";

const keyGenCmds = {
  genPriv: `openssl ecparam -name secp256k1 \\
  -genkey -noout \\
  -out ec_private.pem`,
  pubFromPriv: `openssl ec -in ec_private.pem -pubout -outform DER \\
  | tail -c 65 \\
  | xxd -p -c 65 > my-key.public`,
  privReadable: `openssl ec -in ec_private.pem -outform DER \\
  | tail -c +8 \\
  | head -c 32 \\
  | xxd -p -c 32 > my-key.private`,
};

function CodeSnippet({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied to clipboard", variant: "success" });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast({ title: "Copy failed", variant: "error" });
    }
  };
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-sm leading-relaxed">
        {text}
      </pre>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onCopy}
        className="absolute top-2 right-2 h-7 gap-1"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export function KeyGuideSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" size="sm" variant="link" className="px-0">
          How to generate keys?
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl md:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Generating Your Keys</SheetTitle>
          <SheetDescription>
            Create a private/public key pair locally. You&#39;ll paste the
            public key here; keep the private key safe.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold">
              1) Generate your private key
            </h3>
            <p className="text-sm text-foreground/80">
              Creates a new secp256k1 private key (the curve used by Ethereum).
            </p>
            <div className="mt-2">
              <CodeSnippet text={keyGenCmds.genPriv} />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold">
              2) Extract the public key
            </h3>
            <p className="text-sm text-foreground/80">
              Derives your public key and stores it in{" "}
              <span className="font-mono">my-key.public</span> (hex, 65 bytes
              starting with 0x04). Paste that value into the Public Key field.
            </p>
            <div className="mt-2">
              <CodeSnippet text={keyGenCmds.pubFromPriv} />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold">
              (Optional) Extract a readable private key
            </h3>
            <p className="text-sm text-foreground/80">
              Keeps your private key as a 32-byte hex string.
            </p>
            <div className="mt-2">
              <CodeSnippet text={keyGenCmds.privReadable} />
            </div>
          </div>

          <div className="rounded-md border bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <strong>Important:</strong>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Never share your private key. We only need your public key.
              </li>
              <li>
                Your public key should be a 132-character hex string starting
                with 0x04.
              </li>
              <li>
                Keep the private key safe. You&#39;ll need it later to use any
                vanity addresses that are generated.
              </li>
              <li>
                You can verify the public key by opening{" "}
                <span className="font-mono">my-key.public</span> and ensuring it
                starts with <span className="font-mono">0x04</span> and contains
                65 bytes of hex.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold">Example public key</h3>
            <p className="text-sm text-foreground/80">
              Format preview (do not use in production):
            </p>
            <div className="relative mt-2">
              <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 font-mono text-xs leading-relaxed">
                {examplePublicKey}
              </pre>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
