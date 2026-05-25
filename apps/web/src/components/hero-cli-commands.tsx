'use client';

import { useEffect, useState } from 'react';
import { TerminalCommand } from './terminal-command';

function usePageOrigin() {
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return origin;
}

export function HeroInstallTerminal({ className }: { className?: string }) {
  const origin = usePageOrigin();
  const installCommand = origin
    ? `curl ${origin}/install -fsS | bash`
    : 'curl <host>/install -fsS | bash';

  return (
    <TerminalCommand
      className={className}
      command={installCommand}
      label="Get started in 30 seconds"
    />
  );
}
