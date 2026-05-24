'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@docscn/ui';

export function CopyCommandButton({
  command,
  label = 'Copy',
}: {
  command: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      className="shrink-0"
      onClick={copyCommand}
      size="sm"
      type="button"
      variant="outline"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}
