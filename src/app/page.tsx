'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import dynamic from 'next/dynamic';

// Dynamically import components that use wagmi hooks
const ConnectButton = dynamic(() => import('@/components/ui/ConnectButton').then(mod => ({ default: mod.ConnectButton })), { 
  ssr: false,
  loading: () => <div className="bg-sky-600 text-white px-4 py-2 rounded-lg">Connect Wallet</div>
});
const CrowdfundCreation = dynamic(() => import('@/components/sections/CrowdfundCreation').then(mod => ({ default: mod.CrowdfundCreation })), { ssr: false });
const CrowdfundDonation = dynamic(() => import('@/components/sections/CrowdfundDonation').then(mod => ({ default: mod.CrowdfundDonation })), { ssr: false });
const CrowdfundRefund = dynamic(() => import('@/components/sections/CrowdfundRefund').then(mod => ({ default: mod.CrowdfundRefund })), { ssr: false });

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfp?: string;
}

export default function HomePage() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [context, setContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'donate' | 'refund'>('create');
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const init = async () => {
      try {
        const inApp = await sdk.isInMiniApp();
        setIsInMiniApp(inApp);

        if (inApp) {
          const contextData = await sdk.context;
          setContext(contextData);
          if (contextData?.user) {
            setUser({
              fid: contextData.user.fid,
              username: contextData.user.username,
              displayName: contextData.user.displayName,
              pfp: contextData.user.pfpUrl,
            });
          }
        }
      } catch (error) {
        console.error('Failed to get context:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isMounted]);

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  const handleSignIn = async () => {
    try {
      const nonce = Math.random().toString(36).substring(7);
      
      await sdk.actions.signIn({ nonce });
      
      // After sign in, try to get the updated context
      const contextData = await sdk.context;
      if (contextData?.user) {
        setUser({
          fid: contextData.user.fid,
          username: contextData.user.username,
          displayName: contextData.user.displayName,
          pfp: contextData.user.pfpUrl,
        });
        setContext(contextData);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleComposeCast = async () => {
    try {
      await sdk.actions.composeCast({
        text: 'Check out this crowdfund mini app! 🌱 Create and support campaigns directly on Farcaster.',
        embeds: [window.location.href],
      });
    } catch (error) {
      console.error('Compose cast failed:', error);
    }
  };

  const handleViewProfile = async () => {
    try {
      await sdk.actions.openUrl('https://warpcast.com/~/profile');
    } catch (error) {
      console.error('Failed to view profile:', error);
    }
  };

  const handleOpenUrl = async (url: string) => {
    try {
      await sdk.actions.openUrl(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp();
    } catch (error) {
      console.error('Failed to add mini app:', error);
    }
  };

  const copyToClipboard = async (text: string, commandType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(commandType);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🌱 Herd Crowdfund Mini App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Create, support, and manage crowdfunds directly on Farcaster using Herd Trails.
            All transactions are transparent and secured on Base network.
          </p>
          
          {/* Wallet Connection */}
          <div className="mb-6">
            <ConnectButton />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 px-4 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-lg w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
              <button
                onClick={() => setActiveTab('create')}
                className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                Create Crowdfund
              </button>
              <button
                onClick={() => setActiveTab('donate')}
                className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'donate'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                Support Projects
              </button>
              <button
                onClick={() => setActiveTab('refund')}
                className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'refund'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                }`}
              >
                Claim Refunds
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'create' && <CrowdfundCreation />}
          {activeTab === 'donate' && <CrowdfundDonation />}
          {activeTab === 'refund' && <CrowdfundRefund />}
        </div>

        {/* Farcaster Integration Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Farcaster Integration
          </h2>
          
          {/* User Info */}
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Welcome back! 👋
              </h3>
              <div className="flex items-center space-x-4">
                {user.pfp && (
                  <img
                    src={user.pfp}
                    alt="Profile"
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {user.displayName || user.username || `FID: ${user.fid}`}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    FID: {user.fid}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <button
              onClick={handleSignIn}
              disabled={!!user || isLoading}
              className={`p-4 rounded-lg border transition-colors ${
                user 
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🔐</div>
                <div className="font-medium">{user ? 'Signed In' : 'Sign In'}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user ? 'Authenticated' : 'Connect with Farcaster'}
                </div>
              </div>
            </button>

            <button
              onClick={handleComposeCast}
              disabled={isLoading}
              className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">✍️</div>
                <div className="font-medium">Share Campaign</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Compose a cast
                </div>
              </div>
            </button>

            <button
              onClick={handleViewProfile}
              disabled={isLoading}
              className="p-4 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="text-center">
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium">View Profile</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Open on Farcaster
                </div>
              </div>
            </button>
          </div>

          {/* Status */}
          <div className="text-center mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isInMiniApp ? '🟢 Running inside Farcaster Mini App' : '🟡 Running in browser mode'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
