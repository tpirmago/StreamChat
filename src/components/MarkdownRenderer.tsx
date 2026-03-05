import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

export interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps): React.ReactElement {
  const components: Components = {
    pre: ({ children }) => <pre className="hljs-wrapper">{children}</pre>,
    code: ({ node, className, children, ...rest }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="inline-code" {...rest}>
            {children}
          </code>
        );
      }
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
