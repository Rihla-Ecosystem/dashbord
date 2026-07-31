"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/utils";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  name: string;
  avatarUrl?: string | null;
  onUpload: (file: File) => void;
  onDelete?: () => void;
  isUploading?: boolean;
  className?: string;
}

export function AvatarUpload({
  name,
  avatarUrl,
  onUpload,
  onDelete,
  isUploading,
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  };

  const displayUrl = preview ?? avatarUrl;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="group relative">
        <Avatar className="size-24 border-4 border-background shadow-lg ring-2 ring-border">
          {displayUrl && <AvatarImage src={displayUrl} alt={name} />}
          <AvatarFallback className="text-2xl font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Camera className="size-6 text-white" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          Upload photo
        </Button>
        {avatarUrl && onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isUploading}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
