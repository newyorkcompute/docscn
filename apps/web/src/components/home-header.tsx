import Link from 'next/link';
import type { SVGProps } from 'react';
import { Button, Shell } from '@docscn/ui';
import { GITHUB_REPO_URL } from '../lib/constants';
import { SiteHeaderAuth } from './site-header-auth';
import { ThemeToggle } from './theme-toggle';

function GitHubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.5 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.45-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.93.85.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.95c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .28.18.6.69.5A10.2 10.2 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function HomeHeader() {
  return (
    <header className="home-header sticky top-0 z-50 border-b">
      <Shell className="flex items-center justify-between py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="home-logo-mark relative grid h-9 w-9 place-items-center overflow-hidden border border-primary/35 bg-primary/10 text-sm font-semibold text-primary transition group-hover:border-primary/55">
            d
          </span>
          <div className="leading-tight">
            <span className="block font-mono text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
              docscn
            </span>
            <span className="block text-sm font-medium tracking-tight">
              artifact platform
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="gap-1.5 px-2.5"
            size="sm"
            variant="outline"
          >
            <a
              aria-label="View and star docscn on GitHub."
              href={GITHUB_REPO_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubMark className="h-4 w-4" />
              <span className="hidden sm:inline">Star</span>
            </a>
          </Button>
          <ThemeToggle />
          <SiteHeaderAuth />
        </div>
      </Shell>
    </header>
  );
}
