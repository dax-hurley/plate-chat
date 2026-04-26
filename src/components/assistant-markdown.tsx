"use client";

import Markdown, {
  defaultUrlTransform,
  type Components,
} from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export const markdownComponents: Components = {
  p: ({ children, className, ...props }) => (
    <p
      className={cn(
        "text-foreground mb-3 last:mb-0 text-[0.9375rem] leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, className, ...props }) => (
    <ul
      className={cn(
        "text-foreground mb-3 list-disc space-y-1 pl-5 text-[0.9375rem] last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }) => (
    <ol
      className={cn(
        "text-foreground mb-3 list-decimal space-y-1 pl-5 text-[0.9375rem] last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props}>
      {children}
    </li>
  ),
  h1: ({ children, className, ...props }) => (
    <h1
      className={cn(
        "text-foreground mt-4 mb-2 text-lg font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, className, ...props }) => (
    <h2
      className={cn(
        "text-foreground mt-4 mb-2 text-base font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, className, ...props }) => (
    <h3
      className={cn(
        "text-foreground mt-3 mb-1.5 text-sm font-semibold first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  strong: ({ children, className, ...props }) => (
    <strong className={cn("text-foreground font-semibold", className)} {...props}>
      {children}
    </strong>
  ),
  em: ({ children, className, ...props }) => (
    <em className={cn("italic", className)} {...props}>
      {children}
    </em>
  ),
  blockquote: ({ children, className, ...props }) => (
    <blockquote
      className={cn(
        "border-primary/35 text-muted-foreground mb-3 border-l-2 py-0.5 pl-3 text-[0.9375rem] italic last:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("border-border my-4", className)} {...props} />
  ),
  a: ({ children, className, ...props }) => (
    <a
      className={cn(
        "text-primary font-medium underline underline-offset-2 hover:opacity-90",
        className
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-[\w-]+/.test(String(className ?? ""));
    if (isBlock) {
      return (
        <code
          className={cn("font-mono text-[0.8125rem] text-foreground", className)}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn(
          "bg-background/80 text-foreground rounded px-1.5 py-0.5 font-mono text-[0.85em]",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }) => (
    <pre
      className={cn(
        "bg-muted/80 border-border mb-3 max-w-full overflow-x-auto rounded-lg border p-3 font-mono text-[0.8125rem] leading-relaxed last:mb-0 [&>code]:bg-transparent [&>code]:p-0",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ children, className, ...props }) => (
    <div className="mb-3 max-w-full overflow-x-auto last:mb-0">
      <table
        className={cn(
          "border-border w-full min-w-[12rem] border-collapse border text-left text-[0.8125rem]",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, className, ...props }) => (
    <thead className={cn("bg-muted/50", className)} {...props}>
      {children}
    </thead>
  ),
  th: ({ children, className, ...props }) => (
    <th
      className={cn(
        "border-border text-foreground border px-2.5 py-1.5 font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, className, ...props }) => (
    <td
      className={cn("border-border border px-2.5 py-1.5 align-top", className)}
      {...props}
    >
      {children}
    </td>
  ),
};

type AssistantMarkdownProps = {
  /** Raw assistant markdown (may be incomplete while streaming). */
  content: string;
  className?: string;
};

export function AssistantMarkdown({ content, className }: AssistantMarkdownProps) {
  if (!content.trim()) return null;

  return (
    <div className={cn("assistant-md min-w-0 break-words", className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
        urlTransform={(url) => {
          if (/^(javascript|data|vbscript):/i.test(url)) return "";
          return defaultUrlTransform(url);
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
