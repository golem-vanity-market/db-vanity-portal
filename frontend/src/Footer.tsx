import { AlertTriangle, Github, HandHelping, MessageSquare } from "lucide-react";

const SocialLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
  >
    {icon}
    <span className="hidden text-sm font-medium sm:inline">{label}</span>
  </a>
);

export const Footer = () => {
  const socialLinks = [
    {
      href: "https://github.com/golem-vanity-market/golem-vanity-market-cli",
      icon: <Github className="h-5 w-5" />,
      label: "GitHub",
    },
    {
      href: "https://www.golem.network/project/vanity-market",
      icon: <HandHelping className="h-5 w-5" />,
      label: "Ecosystem Fund",
    },
    {
      href: "https://chat.golem.network/",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Golem Discord",
    },
  ];

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          &copy; {new Date().getFullYear()} Vanity Market Stats
        </p>

        <div className="flex items-center gap-2 text-center text-xs text-muted-foreground sm:text-left">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>This project is still experimental. Data may not be fully accurate. Use only as reference.</span>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6">
          {socialLinks.map((link) => (
            <SocialLink key={link.href} href={link.href} icon={link.icon} label={link.label} />
          ))}
        </div>
      </div>
    </footer>
  );
};
