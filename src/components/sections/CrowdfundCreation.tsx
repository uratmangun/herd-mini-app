'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useHerdTransaction } from '@/hooks/useHerdTransaction';
import { TRAIL_IDS, createUserInputs } from '@/lib/herd-api';

interface CrowdfundFormData {
  title: string;
  description: string;
  goalAmount: string;
  duration: string; // in days
  category: string;
}

export function CrowdfundCreation() {
  const { authenticated, user, linkWallet } = usePrivy();
  
  // Get user's linked wallets using Privy
  const linkedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];
  const isConnected = authenticated && linkedWallets.length > 0;
  
  const { executeTrailStep, submitExecutionToApi, state, resetState } = useHerdTransaction();
  const [formData, setFormData] = useState<CrowdfundFormData>({
    title: '',
    description: '',
    goalAmount: '',
    duration: '30',
    category: 'general',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCrowdfund = async () => {
    if (!authenticated || !isConnected) return;

    // Reset any previous errors
    resetState();

    try {
      // Create user inputs for the crowdfund creation trail
      // Note: These field names would need to match the actual trail definition
      const userInputs = createUserInputs('create_crowdfund_node', {
        'inputs.title': formData.title,
        'inputs.description': formData.description,
        'inputs.goalAmount': formData.goalAmount,
        'inputs.duration': formData.duration,
        'inputs.category': formData.category,
      });

      await executeTrailStep(
        TRAIL_IDS.CROWDFUND_CREATION,
        TRAIL_IDS.CROWDFUND_CREATION_VERSION,
        1, // First step
        'create_crowdfund_node', // This would be the actual node ID from the trail
        userInputs
      );

      // If transaction succeeds, submit execution to API
      if (state.transactionHash) {
        await submitExecutionToApi(
          TRAIL_IDS.CROWDFUND_CREATION,
          TRAIL_IDS.CROWDFUND_CREATION_VERSION,
          'create_crowdfund_node',
          state.transactionHash
        );
      }

    } catch (error) {
      console.error('Failed to create crowdfund:', error);
    }
  };

  const isFormValid = formData.title && formData.description && formData.goalAmount && parseFloat(formData.goalAmount) > 0;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create a Crowdfund
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Launch your fundraising campaign on Farcaster with blockchain transparency
        </p>
      </div>

      {(!authenticated || !isConnected) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            {!authenticated ? 'Please sign in to create a crowdfund' : 'Please link a wallet to create transactions'}
          </p>
          {authenticated && !isConnected && (
            <button
              onClick={() => linkWallet()}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Link Wallet
            </button>
          )}
        </div>
      )}

      {authenticated && isConnected && (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campaign Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter your campaign title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your project and what you're raising funds for"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              maxLength={500}
            />
          </div>

          {/* Goal Amount */}
          <div>
            <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Amount (ETH) *
            </label>
            <input
              type="number"
              id="goalAmount"
              name="goalAmount"
              value={formData.goalAmount}
              onChange={handleInputChange}
              placeholder="0.1"
              step="0.001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campaign Duration (days)
            </label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="general">General</option>
              <option value="technology">Technology</option>
              <option value="art">Art & Creative</option>
              <option value="community">Community</option>
              <option value="charity">Charity</option>
              <option value="education">Education</option>
            </select>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400 text-sm">{state.error}</p>
            </div>
          )}

          {/* Success Display */}
          {state.isSuccess && state.transactionHash && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-600 dark:text-green-400 text-sm">
                Crowdfund created successfully! 
                <br />
                <a 
                  href={`https://basescan.org/tx/${state.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  View transaction
                </a>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleCreateCrowdfund}
            disabled={!isFormValid || state.isLoading || !authenticated || !isConnected}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Crowdfund...
              </div>
            ) : (
              'Create Crowdfund'
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your crowdfund will be deployed to Base network and visible on Herd Explorer
          </p>
        </div>
      )}
    </div>
  );
}
