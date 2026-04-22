"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { actionRevokePat } from "./pat-actions";

export function RevokePatButton({ tokenId }: { tokenId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-destructive min-h-11 gap-1.5"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await actionRevokePat(tokenId);
          toast.success("Token revoked");
        })
      }
    >
      <Trash2 className="size-4" aria-hidden />
      Revoke
    </Button>
  );
}
