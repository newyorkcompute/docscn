'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@docscn/ui';
import { authClient } from '../lib/auth-client';

export function SignOutButton() {
  const router = useRouter();

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => router.refresh(),
          },
        })
      }
    >
      Sign out
    </Button>
  );
}
