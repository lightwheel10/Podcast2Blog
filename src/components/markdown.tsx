"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface MarkdownProps {
  content: string;
  isHtml?: boolean;
}

export function Markdown({ content, isHtml = false }: MarkdownProps) {
  if (isHtml) {
    return (
      <div 
        className="prose prose-slate dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code(props) {
          const { children, className } = props
          const language = /language-(\w+)/.exec(className || '')
          
          if (!language) {
            return <code className={className}>{children}</code>
          }

          return (
            <div className="relative">
              <Prism
                language={language[1]}
                style={oneDark}
                customStyle={{ margin: 0 }}
              >
                {String(children).trim()}
              </Prism>
            </div>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
