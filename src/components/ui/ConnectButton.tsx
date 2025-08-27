'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster';
import { useState, useEffect } from 'react';
import frameSdk from '@farcaster/frame-sdk';

export function ConnectButton() {
  const { ready, authenticated, user, logout, linkWallet } = usePrivy();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const [isLoading, setIsLoading] = useState(false);

  // Get user's linked wallets
  const linkedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];

  // Get wallet connection status using Privy instead of wagmi
  const address = linkedWallets[0]?.address;
  const isConnected = ready && authenticated && !!address;
  
  // Automatic Farcaster Mini App login
  useEffect(() => {
    if (ready && !authenticated && !isLoading) {
      const login = async () => {
        setIsLoading(true);
        try {
          // Initialize a new login attempt to get a nonce for the Farcaster wallet to sign
          const { nonce } = await initLoginToMiniApp();
          
          // Request a signature from Farcaster
          const result = await frameSdk.actions.signIn({ nonce: nonce });
          
          // Send the received signature from Farcaster to Privy for authentication
          await loginToMiniApp({
            message: result.message,
            signature: result.signature,
          });
        } catch (error) {
          console.error('Auto-login failed:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      login();
    }
  }, [ready, authenticated, isLoading, initLoginToMiniApp, loginToMiniApp]);

  // Handle manual wallet linking
  const handleLinkWallet = async () => {
    setIsLoading(true);
    try {
      await linkWallet();
    } catch (error) {
      console.error('Wallet linking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Disconnect error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until Privy is ready
  if (!ready) {
    return (
      <button
        disabled
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  // Show connected state
  if (authenticated && (isConnected || linkedWallets.length > 0)) {
    const displayAddress = address || linkedWallets[0]?.address;
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Connected'}
        </span>
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  // Show link wallet button for authenticated users without wallets
  if (authenticated && linkedWallets.length === 0) {
    return (
      <button
        onClick={handleLinkWallet}
        disabled={isLoading}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Linking...' : 'Link Wallet'}
      </button>
    );
  }

  // Show loading state
  return (
    <button
      disabled
      className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
    >
      {isLoading ? 'Connecting...' : 'Loading...'}
    </button>
  );
}
