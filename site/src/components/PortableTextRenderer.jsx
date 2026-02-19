import React from "react";
import { PortableText } from "@portabletext/react";

export default function PortableTextRenderer({ value }) {
  return (
    <PortableText
      value={value}
      components={{
        types: {
          // If a Sanity "code" block appears, render as plain text
          code: ({ value }) => (
            <pre>
              <code>{(value && value.code) || ""}</code>
            </pre>
          ),
          // If someone embeds something odd, don't crash
          unknown: ({ value }) => (
            <pre>
              <code>{JSON.stringify(value, null, 2)}</code>
            </pre>
          ),
        },
        block: {
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => <h2>{children}</h2>,
          h3: ({ children }) => <h3>{children}</h3>,
          normal: ({ children }) => <p>{children}</p>,
          blockquote: ({ children }) => <blockquote>{children}</blockquote>,
        },
        marks: {
          link: ({ children, value }) => {
            const href = value?.href || "#";
            const isExternal = href.startsWith("http");
            return (
              <a
                href={href}
                rel={isExternal ? "noreferrer noopener" : undefined}
                target={isExternal ? "_blank" : undefined}
              >
                {children}
              </a>
            );
          },
        },
        list: {
          bullet: ({ children }) => <ul>{children}</ul>,
          number: ({ children }) => <ol>{children}</ol>,
        },
        listItem: {
          bullet: ({ children }) => <li>{children}</li>,
          number: ({ children }) => <li>{children}</li>,
        },
      }}
    />
  );
}
