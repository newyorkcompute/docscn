import Link from 'next/link';
import { Button, Shell } from '@docscn/ui';
import { GITHUB_REPO_URL } from '../lib/constants';
import { GitHubMark } from './github-mark';
import { SiteHeaderAuth } from './site-header-auth';
import { ThemeToggle } from './theme-toggle';

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
