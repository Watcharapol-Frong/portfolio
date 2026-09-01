import { useState } from "react";
import { Share2, Facebook, Linkedin, X as XIcon, Link as LinkIcon, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ShareButtonProps {
  title: string;
}

const ShareButton = ({ title }: ShareButtonProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    setOpen(false);
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const shareToX = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    openShareWindow(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    openShareWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  };

  const options = [
    { label: "Facebook", icon: Facebook, onClick: shareToFacebook },
    { label: "X", icon: XIcon, onClick: shareToX },
    { label: "LinkedIn", icon: Linkedin, onClick: shareToLinkedIn },
    { label: copied ? "Link copied" : "Copy link", icon: copied ? Check : LinkIcon, onClick: copyLink },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-full border border-border hover:bg-muted transition-colors duration-300">
          <Share2 size={14} />
          Share
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-48 p-2 rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-xl"
      >
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-300 text-left"
            >
              <opt.icon size={14} />
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;
