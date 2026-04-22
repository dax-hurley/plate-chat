"use client";

import { CloudOff, KeyRound } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PatCreateForm } from "./pat-form";
import { RevokePatButton } from "./revoke-pat-button";

export type PatTokenForList = {
  id: string;
  name: string;
  createdAt: Date | string;
  lastUsedAt: Date | string | null;
};

export function AdvancedPatSection({
  tokens,
  catalogOffline,
}: {
  tokens: PatTokenForList[];
  /** True when the catalog API could not be reached (e.g. offline native). */
  catalogOffline?: boolean;
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value="advanced"
        className="border-primary/15 bg-card text-card-foreground rounded-xl border px-4 shadow-sm"
      >
        <AccordionTrigger className="hover:no-underline [&[data-state=open]]:pb-2">
          <span className="flex flex-1 flex-col items-start gap-1 py-1 text-left">
            <span className="text-foreground flex items-center gap-2 text-lg font-semibold">
              <KeyRound className="text-primary size-5 shrink-0" aria-hidden />
              Advanced
            </span>
            <span className="text-muted-foreground text-sm font-normal">
              API tokens and automation
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-8 pb-1">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <KeyRound className="text-primary size-4 shrink-0" aria-hidden />
                Personal access tokens
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm">
                Use in <code className="text-xs">Authorization: Bearer …</code>{" "}
                for <code className="text-xs">/api/v1</code>. Set the same value
                in your MCP server env as{" "}
                <code className="text-xs">WORKOUT_APP_TOKEN</code>.
              </p>
            </div>
            {catalogOffline ? (
              <div className="border-chart-4/20 from-chart-4/8 flex gap-3 rounded-xl border bg-gradient-to-br to-transparent px-4 py-4">
                <CloudOff
                  className="text-chart-4 mt-0.5 size-5 shrink-0"
                  aria-hidden
                />
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Tokens live in your online account. Reconnect to create, list,
                  or revoke personal access tokens.
                </p>
              </div>
            ) : (
              <PatCreateForm />
            )}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Active tokens</h3>
              {catalogOffline ? (
                <p className="text-muted-foreground text-sm">
                  Unavailable while offline.
                </p>
              ) : tokens.length === 0 ? (
                <p className="text-muted-foreground text-sm">None yet.</p>
              ) : (
                <ul className="space-y-2">
                  {tokens.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.name}</p>
                        <p className="text-muted-foreground text-xs">
                          Created{" "}
                          {new Date(t.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                          {t.lastUsedAt
                            ? ` · last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                            : ""}
                        </p>
                      </div>
                      <RevokePatButton tokenId={t.id} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
