'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { FarcasterProvider } from '@/components/providers/farcaster-provider';
import { Web3Provider } from '@/components/providers/Web3Provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Web3Provider>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}