import { jsx } from "react/jsx-runtime";
import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { c as cn } from "./utils-H80jjgLf.mjs";
const markdownComponents = {
  p: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "p",
    {
      className: cn(
        "text-foreground mb-3 last:mb-0 text-[0.9375rem] leading-relaxed",
        className
      ),
      ...props,
      children
    }
  ),
  ul: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "ul",
    {
      className: cn(
        "text-foreground mb-3 list-disc space-y-1 pl-5 text-[0.9375rem] last:mb-0",
        className
      ),
      ...props,
      children
    }
  ),
  ol: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "ol",
    {
      className: cn(
        "text-foreground mb-3 list-decimal space-y-1 pl-5 text-[0.9375rem] last:mb-0",
        className
      ),
      ...props,
      children
    }
  ),
  li: ({ children, className, ...props }) => /* @__PURE__ */ jsx("li", { className: cn("leading-relaxed", className), ...props, children }),
  h1: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "h1",
    {
      className: cn(
        "text-foreground mt-4 mb-2 text-lg font-semibold tracking-tight first:mt-0",
        className
      ),
      ...props,
      children
    }
  ),
  h2: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "h2",
    {
      className: cn(
        "text-foreground mt-4 mb-2 text-base font-semibold tracking-tight first:mt-0",
        className
      ),
      ...props,
      children
    }
  ),
  h3: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "h3",
    {
      className: cn(
        "text-foreground mt-3 mb-1.5 text-sm font-semibold first:mt-0",
        className
      ),
      ...props,
      children
    }
  ),
  strong: ({ children, className, ...props }) => /* @__PURE__ */ jsx("strong", { className: cn("text-foreground font-semibold", className), ...props, children }),
  em: ({ children, className, ...props }) => /* @__PURE__ */ jsx("em", { className: cn("italic", className), ...props, children }),
  blockquote: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "blockquote",
    {
      className: cn(
        "border-primary/35 text-muted-foreground mb-3 border-l-2 py-0.5 pl-3 text-[0.9375rem] italic last:mb-0",
        className
      ),
      ...props,
      children
    }
  ),
  hr: ({ className, ...props }) => /* @__PURE__ */ jsx("hr", { className: cn("border-border my-4", className), ...props }),
  a: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "a",
    {
      className: cn(
        "text-primary font-medium underline underline-offset-2 hover:opacity-90",
        className
      ),
      target: "_blank",
      rel: "noopener noreferrer",
      ...props,
      children
    }
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-[\w-]+/.test(String(className ?? ""));
    if (isBlock) {
      return /* @__PURE__ */ jsx(
        "code",
        {
          className: cn("font-mono text-[0.8125rem] text-foreground", className),
          ...props,
          children
        }
      );
    }
    return /* @__PURE__ */ jsx(
      "code",
      {
        className: cn(
          "bg-background/80 text-foreground rounded px-1.5 py-0.5 font-mono text-[0.85em]",
          className
        ),
        ...props,
        children
      }
    );
  },
  pre: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "pre",
    {
      className: cn(
        "bg-muted/80 border-border mb-3 max-w-full overflow-x-auto rounded-lg border p-3 font-mono text-[0.8125rem] leading-relaxed last:mb-0 [&>code]:bg-transparent [&>code]:p-0",
        className
      ),
      ...props,
      children
    }
  ),
  table: ({ children, className, ...props }) => /* @__PURE__ */ jsx("div", { className: "mb-3 max-w-full overflow-x-auto last:mb-0", children: /* @__PURE__ */ jsx(
    "table",
    {
      className: cn(
        "border-border w-full min-w-[12rem] border-collapse border text-left text-[0.8125rem]",
        className
      ),
      ...props,
      children
    }
  ) }),
  thead: ({ children, className, ...props }) => /* @__PURE__ */ jsx("thead", { className: cn("bg-muted/50", className), ...props, children }),
  th: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "th",
    {
      className: cn(
        "border-border text-foreground border px-2.5 py-1.5 font-semibold",
        className
      ),
      ...props,
      children
    }
  ),
  td: ({ children, className, ...props }) => /* @__PURE__ */ jsx(
    "td",
    {
      className: cn("border-border border px-2.5 py-1.5 align-top", className),
      ...props,
      children
    }
  )
};
function AssistantMarkdown({ content, className }) {
  if (!content.trim()) return null;
  return /* @__PURE__ */ jsx("div", { className: cn("assistant-md min-w-0 break-words", className), children: /* @__PURE__ */ jsx(
    Markdown,
    {
      remarkPlugins: [remarkGfm],
      components: markdownComponents,
      urlTransform: (url) => {
        if (/^(javascript|data|vbscript):/i.test(url)) return "";
        return defaultUrlTransform(url);
      },
      children: content
    }
  ) });
}
export {
  AssistantMarkdown as A,
  markdownComponents as m
};
