import { AlertTriangle, Github, HandHelping, MessageSquare } from "lucide-react";

const SocialLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
  >
    {icon}
    <span className="hidden text-sm font-medium sm:inline">{label}</span>
  </a>
);

export const Footer = () => {
  const socialLinks = [
    {
      href: "https://github.com/golem-vanity-market/golem-vanity-market-cli",
      icon: <Github className="size-5" />,
      label: "GitHub",
    },
    {
      href: "https://www.golem.network/project/vanity-market",
      icon: <HandHelping className="size-5" />,
      label: "Ecosystem Fund",
    },
    {
      href: "https://chat.golem.network/",
      icon: <MessageSquare className="size-5" />,
      label: "Golem Discord",
    },
  ];

  return (
    <footer className="bg-muted/40 border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
        <p className="text-muted-foreground text-center text-sm sm:text-left">
          &copy; {new Date().getFullYear()} Vanity Market Stats
        </p>

        <div className="text-muted-foreground flex items-center gap-2 text-center text-xs sm:text-left">
          <AlertTriangle className="size-4 flex-shrink-0" />
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
