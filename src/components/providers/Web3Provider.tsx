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
  
  // Configure Privy for both Farcaster Mini Apps and browser use
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        // Support embedded wallets and external wallets
        appearance: {
          theme: 'dark',
          accentColor: '#2563eb', // blue-600 (non-purple primary color)
          logo: 'https://your-app-logo-url.com/logo.png', // Replace with your logo
        },
        // Enable multiple login methods for browser compatibility
        loginMethods: [
          'farcaster',  // Keep for Mini App
          'wallet',     // External wallets
          'email',      // Email authentication for browsers
          'google',     // Google OAuth
          'twitter',    // Twitter/X OAuth
          'sms',        // SMS authentication
        ],
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
