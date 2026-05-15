'use client';

import { useEffect, useMemo, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button, cn } from '@docscn/ui';

type ThemePreference = 'light' | 'dark' | 'system';

const storageKey = 'docscn-theme';
const orderedThemes: ThemePreference[] = ['system', 'light', 'dark'];

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;

  root.classList.remove('light', 'dark');

  if (theme !== 'system') {
    root.classList.add(theme);
  }
}

function getStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedTheme = window.localStorage.getItem(storageKey);

  return storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : 'system';
}

export function ThemeToggle({
  className,
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const [theme, setTheme] = useState<ThemePreference>('system');

  useEffect(() => {
    const storedTheme = getStoredTheme();

    setTheme(storedTheme);
    applyTheme(storedTheme);
  }, []);

  const label = useMemo(() => {
    if (theme === 'light') {
      return 'Light';
    }

    if (theme === 'dark') {
      return 'Dark';
    }

    return 'System';
  }, [theme]);

  function cycleTheme() {
    const nextTheme =
      orderedThemes[
        (orderedThemes.indexOf(theme) + 1) % orderedThemes.length
      ] ?? 'system';

    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(storageKey, nextTheme);
  }

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <Button
      aria-label={`Theme: ${label}. Click to change theme.`}
      className={cn('px-2 sm:px-3', className)}
      onClick={cycleTheme}
      size="sm"
      title={`Theme: ${label}`}
      variant="ghost"
    >
      <Icon className="h-4 w-4" />
      {showLabel ? <span className="hidden sm:inline">{label}</span> : null}
    </Button>
  );
}
