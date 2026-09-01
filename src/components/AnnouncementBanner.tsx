import { useState, useEffect } from "react";
import { X } from "lucide-react";

export interface AnnouncementBannerProps {
  /** Unique id — used as the localStorage key so a dismissed banner stays dismissed. Change it to show a new banner even if an old one was dismissed. */
  id: string;
  message: string;
  href?: string;
  ctaLabel?: string;
  dismissible?: boolean;
}

const AnnouncementBanner = ({ id, message, href, ctaLabel, dismissible = true }: AnnouncementBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!dismissible) return;
    const stored = localStorage.getItem(`banner-dismissed-${id}`);
    setDismissed(stored === "true");
  }, [id, dismissible]);

  const handleDismiss = () => {
    setDismissed(true);
    if (dismissible) {
      localStorage.setItem(`banner-dismissed-${id}`, "true");
    }
  };

  if (dismissed) return null;

  const content = (
    <>
      <p className="text-sm font-medium">{message}</p>
      {ctaLabel && (
        <span className="text-sm underline underline-offset-2 shrink-0">{ctaLabel}</span>
      )}
    </>
  );

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-foreground text-background px-5 py-3">
      {href ? (
        <a href={href} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-90 transition-opacity">
          {content}
        </a>
      ) : (
        <div className="flex items-center gap-2 flex-1 min-w-0">{content}</div>
      )}
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="p-1 hover:opacity-70 transition-opacity shrink-0"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AnnouncementBanner;
