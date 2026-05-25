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

export function HeroCliQuickstartPreview() {
  const origin = usePageOrigin();
  const installCommand = origin
    ? `curl ${origin}/install -fsS | bash`
    : 'curl <host>/install -fsS | bash';
  const publishCommand = origin
    ? `docscn publish artifact.html --host ${origin}`
    : 'docscn publish artifact.html --host <host>';

  return (
    <>
      <p className="mt-3 font-mono text-xs leading-6 text-primary/90">
        {installCommand}
      </p>
      <p className="mt-2 font-mono text-xs leading-6 text-primary/90">
        {publishCommand}
      </p>
    </>
  );
}
