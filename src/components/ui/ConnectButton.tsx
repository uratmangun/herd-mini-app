'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useLoginToMiniApp } from '@privy-io/react-auth/farcaster';
import { useState, useEffect } from 'react';
import frameSdk from '@farcaster/frame-sdk';

export function ConnectButton() {
  const { ready, authenticated, user, logout, linkWallet, login } = usePrivy();
  const { initLoginToMiniApp, loginToMiniApp } = useLoginToMiniApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isMiniApp, setIsMiniApp] = useState(false); // Default to browser mode

  // Get user's linked wallets
  const linkedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];

  // Get wallet connection status using Privy instead of wagmi
  const address = linkedWallets[0]?.address;
  const isConnected = ready && authenticated && !!address;

  // Detect if we're in a Farcaster Mini App
  useEffect(() => {
    const checkMiniApp = () => {
      try {
        // Check if we're in a Farcaster Mini App context
        const isInFrame = typeof window !== 'undefined' && window.parent !== window;
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isFarcasterContext = userAgent.includes('Farcaster') || 
          (typeof window !== 'undefined' && window.location.hostname.includes('warpcast.com'));
        
        console.log('Environment check:', { isInFrame, isFarcasterContext, userAgent });
        // Only set to true if we're definitely in a Mini App, otherwise stay false
        if (isInFrame && isFarcasterContext) {
          setIsMiniApp(true);
        }
      } catch (error) {
        console.log('Mini App detection error:', error);
        // Keep default false
      }
    };
    
    // Check immediately on mount
    checkMiniApp();
  }, []); // Empty dependency array - run once on mount
  
  // Automatic Farcaster Mini App login (only in Mini App context)
  useEffect(() => {
    if (ready && !authenticated && !isLoading && isMiniApp === true) {
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
  }, [ready, authenticated, isLoading, isMiniApp, initLoginToMiniApp, loginToMiniApp]);

  // Handle browser login
  const handleBrowserLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex items-center justify-center gap-2">
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

  // Show login button for unauthenticated users in browser (not Mini App)
  if (!authenticated && isMiniApp === false) {
    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">Please sign in to create and manage crowdfunds</p>
        <button
          onClick={handleBrowserLogin}
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Connecting...' : 'Sign In'}
        </button>
      </div>
    );
  }

  // Show loading state for Mini App or while detecting environment
  return (
    <div className="mb-6">
      <button
        disabled
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
      >
        {isLoading ? 'Connecting...' : 'Loading...'}
      </button>
    </div>
  );
}
