'use client';

import { FarcasterProvider } from './farcaster-provider';
import { Web3Provider } from './Web3Provider';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Web3Provider>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}
