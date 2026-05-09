import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

type Props = {
  math: string;
  block?: boolean;
  className?: string;
};

export default function TeX({ math, block = false, className }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: "ignore",
        output: "html",
      });
    } catch {
      return math;
    }
  }, [math, block]);

  const Tag = block ? "div" : "span";
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
