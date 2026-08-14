"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, Link2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BUCKET = "product-images";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function publicUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(file: File, folder = "products") {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Use JPEG, PNG, WebP or GIF only");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 2 MB");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("bucket") ||
      error.message.includes("not found")
    ) {
      throw new Error(
        'Storage bucket "product-images" not found. Run storage-setup.sql in Supabase first.',
      );
    }
    throw error;
  }

  return publicUrl(path);
}

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  folder?: string;
  className?: string;
};

export function ImageUploadField({
  value,
  onChange,
  label = "Product image",
  folder = "products",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, folder);
      onChange(url);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "upload" ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setMode("upload")}
          >
            Upload
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "url" ? "secondary" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setMode("url")}
          >
            <Link2 className="mr-1 size-3" />
            URL
          </Button>
        </div>
      </div>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="mx-auto max-h-48 w-full object-contain" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 size-8 shadow"
            onClick={() => onChange("")}
            aria-label="Remove image"
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : mode === "upload" ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-muted/50",
            uploading && "opacity-60",
          )}
        >
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          ) : (
            <ImagePlus className="size-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Click to upload image"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              JPEG, PNG, WebP · max 2 MB
            </p>
          </div>
        </button>
      ) : (
        <Input
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {mode === "upload" && value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Uploading…
            </>
          ) : (
            "Replace image"
          )}
        </Button>
      )}

      {mode === "url" && value && (
        <Input
          placeholder="https://…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}