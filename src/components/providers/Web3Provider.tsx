'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!privyAppId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
    return <>{children}</>;
  }
  
  // Configure Privy for Farcaster Mini Apps
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Support embedded wallets and external wallets
        appearance: {
          theme: 'dark',
        },
        // Enable Farcaster login for Mini Apps
        loginMethods: ['farcaster', 'wallet'],
        // Configure embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
