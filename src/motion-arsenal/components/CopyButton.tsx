import React, { useState } from 'react';

export function CopyButton({
  text,
  label,
  testId,
}: {
  text: string | (() => string);
  label: string;
  testId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resolve = () => (typeof text === 'function' ? text() : text);
  return (
    <button
      type="button"
      className="copy-btn"
      data-testid={testId}
      onClick={(event) => {
        event.stopPropagation();
        const done = () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        };
        // Without a clipboard permission (headless tests, insecure origins) the
        // handoff must not fail silently.
        const write = navigator.clipboard?.writeText(resolve());
        if (write) write.then(done, done);
        else done();
      }}
    >
      {copied ? '✓ COPIED' : label}
    </button>
  );
}
