import { Fragment, type ReactNode } from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={`${keyPrefix}-t${index++}`}>{escapeHtml(text.slice(lastIndex, match.index))}</Fragment>);
    }
    const [full, code, bold, italic, link] = match;
    if (code) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${index++}`}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {escapeHtml(code.slice(1, -1))}
        </code>
      );
    } else if (bold) {
      nodes.push(<strong key={`${keyPrefix}-b${index++}`}>{renderInline(bold.slice(2, -2), `${keyPrefix}-b${index}`)}</strong>);
    } else if (italic) {
      nodes.push(<em key={`${keyPrefix}-i${index++}`}>{renderInline(italic.slice(1, -1), `${keyPrefix}-i${index}`)}</em>);
    } else if (link) {
      const matchLink = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(link);
      if (matchLink) {
        const href = matchLink[2];
        const safeHref = href.startsWith("http://") || href.startsWith("https://") ? href : undefined;
        nodes.push(
          <a
            key={`${keyPrefix}-l${index++}`}
            href={safeHref}
            target={safeHref ? "_blank" : undefined}
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {escapeHtml(matchLink[1])}
          </a>
        );
      } else {
        nodes.push(escapeHtml(full));
      }
    } else {
      nodes.push(escapeHtml(full));
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t${index}`}>{escapeHtml(text.slice(lastIndex))}</Fragment>);
  }
  return nodes;
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const lines = content.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let inParagraph = false;
  let paragraphText: string[] = [];

  const flushList = (key: string) => {
    if (listType && listItems.length > 0) {
      const Tag = listType === "ul" ? "ul" : "ol";
      elements.push(
        <Tag key={key} className="my-1.5 list-disc space-y-1 pl-5 text-sm marker:text-muted-foreground">
          {listItems}
        </Tag>
      );
    }
    listType = null;
    listItems = [];
  };

  const flushParagraph = (key: string) => {
    if (inParagraph && paragraphText.length > 0) {
      elements.push(
        <p key={key} className="mb-2 text-sm leading-relaxed">
          {renderInline(paragraphText.join(" "), `p-${key}`)}
        </p>
      );
    }
    inParagraph = false;
    paragraphText = [];
  };

  lines.forEach((line, i) => {
    const key = `${i}`;

    if (line.trim().startsWith("```")) {
      flushParagraph(`pp-${key}`);
      flushList(`ul-${key}`);
      if (inCode) {
        elements.push(
          <pre key={`pre-${key}`} className="my-2 overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed">
            <code>{codeLines.join("\n")}</code>
          </pre>
        );
        codeLines = [];
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (line.trim() === "") {
      flushParagraph(`pb-${key}`);
      flushList(`ulb-${key}`);
      return;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph(`ph-${key}`);
      flushList(`ulh-${key}`);
      const level = heading[1].length;
      const Tag = (level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h4") as "h1" | "h2" | "h3" | "h4";
      const size =
        level === 1
          ? "text-lg font-bold"
          : level === 2
            ? "text-base font-semibold"
            : level === 3
              ? "text-sm font-semibold"
              : "text-sm font-medium";
      elements.push(
        <Tag key={`h-${key}`} className={`${size} mb-1.5 mt-3 text-foreground first:mt-0`}>
          {renderInline(heading[2].trim(), `h-${key}`)}
        </Tag>
      );
      return;
    }

    if (/^\s*(-|\*)\s+/.test(line)) {
      flushParagraph(`pl-${key}`);
      if (listType !== "ul") {
        flushList(`uls-${key}`);
        listType = "ul";
      }
      listItems.push(
        <li key={`li-${key}`} className="leading-relaxed">
          {renderInline(line.replace(/^\s*(-|\*)\s+/, "").trim(), `li-${key}`)}
        </li>
      );
      return;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      flushParagraph(`po-${key}`);
      if (listType !== "ol") {
        flushList(`uls2-${key}`);
        listType = "ol";
      }
      listItems.push(
        <li key={`lio-${key}`} className="leading-relaxed">
          {renderInline(line.replace(/^\s*\d+[.)]\s+/, "").trim(), `lio-${key}`)}
        </li>
      );
      return;
    }

    flushList(`ulf-${key}`);
    if (line.trim() === "---" || line.trim() === "***") {
      flushParagraph(`hr-${key}`);
      elements.push(<hr key={`hr-${key}`} className="my-3 border-border" />);
      return;
    }

    inParagraph = true;
    paragraphText.push(line.trim());
  });

  flushParagraph(`pf-end`);
  flushList(`ulf-end`);
  if (inCode && codeLines.length > 0) {
    elements.push(
      <pre key={`pre-end`} className="my-2 overflow-x-auto rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed">
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  return <div className={className}>{elements}</div>;
}
