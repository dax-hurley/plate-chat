"use client";

import { useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { actionCreatePat } from "./pat-actions";

export function PatCreateForm() {
  const [pending, setPending] = useState(false);
  const [shown, setShown] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setShown(null);
    try {
      const res = await actionCreatePat(fd);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setShown(res.token);
      toast.success("Token created — copy it now");
      e.currentTarget.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pat-name" className="flex items-center gap-2">
            <KeyRound className="text-primary size-4" aria-hidden />
            Token label
          </Label>
          <Input
            id="pat-name"
            name="name"
            required
            placeholder="Cursor MCP on laptop"
            className="min-h-12 text-base"
          />
        </div>
        <Button
          type="submit"
          className="min-h-12 w-full gap-2 shadow-sm"
          disabled={pending}
        >
          <Sparkles className="size-4" aria-hidden />
          {pending ? "Creating…" : "Generate token"}
        </Button>
      </form>
      {shown ? (
        <div className="bg-muted rounded-lg p-3">
          <p className="text-destructive text-sm font-medium">
            Copy this token now — it won&apos;t be shown again.
          </p>
          <code className="mt-2 block break-all text-xs">{shown}</code>
        </div>
      ) : null}
    </div>
  );
}
