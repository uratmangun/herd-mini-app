'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useHerdTransaction } from '@/hooks/useHerdTransaction';
import { TRAIL_IDS, createUserInputs, getExecutionHistory, readTrailData } from '@/lib/herd-api';

interface DonationFormData {
  crowdfundId: string;
  amount: string;
  message: string;
}

interface CrowdfundData {
  id: string;
  title: string;
  description: string;
  goalAmount: string;
  raisedAmount: string;
  creator: string;
  isActive: boolean;
}

export function CrowdfundDonation() {
  const { authenticated, user, linkWallet } = usePrivy();
  
  // Get user's linked wallets using Privy
  const linkedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];
  const isConnected = authenticated && linkedWallets.length > 0;
  
  const { executeTrailStep, submitExecutionToApi, state, resetState } = useHerdTransaction();
  const [formData, setFormData] = useState<DonationFormData>({
    crowdfundId: '',
    amount: '',
    message: '',
  });
  const [crowdfunds, setCrowdfunds] = useState<CrowdfundData[]>([]);
  const [selectedCrowdfund, setSelectedCrowdfund] = useState<CrowdfundData | null>(null);
  const [loadingCrowdfunds, setLoadingCrowdfunds] = useState(false);

  // Load available crowdfunds on component mount
  useEffect(() => {
    loadCrowdfunds();
  }, []);

  const loadCrowdfunds = async () => {
    setLoadingCrowdfunds(true);
    try {
      // Get execution history to find created crowdfunds
      const history = await getExecutionHistory(
        TRAIL_IDS.CROWDFUND_CREATION,
        TRAIL_IDS.CROWDFUND_CREATION_VERSION
      );

      // Mock crowdfund data for now - in real implementation,
      // this would be read from the blockchain through Herd trail read nodes
      const mockCrowdfunds: CrowdfundData[] = [
        {
          id: 'cf_001',
          title: 'Community Garden Project',
          description: 'Building a sustainable community garden for everyone',
          goalAmount: '0.5',
          raisedAmount: '0.12',
          creator: '0x1234...5678',
          isActive: true,
        },
        {
          id: 'cf_002',
          title: 'Tech Workshop Series',
          description: 'Free blockchain education workshops for beginners',
          goalAmount: '0.3',
          raisedAmount: '0.08',
          creator: '0x8765...4321',
          isActive: true,
        },
      ];

      setCrowdfunds(mockCrowdfunds);
    } catch (error) {
      console.error('Failed to load crowdfunds:', error);
    } finally {
      setLoadingCrowdfunds(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Update selected crowdfund when crowdfundId changes
    if (name === 'crowdfundId') {
      const selected = crowdfunds.find(cf => cf.id === value);
      setSelectedCrowdfund(selected || null);
    }
  };

  const handleDonate = async () => {
    if (!authenticated || !isConnected || !selectedCrowdfund) return;

    resetState();

    try {
      // Create user inputs for the donation trail
      const userInputs = createUserInputs('donate_node', {
        'inputs.crowdfundId': formData.crowdfundId,
        'inputs.amount': formData.amount,
        'inputs.message': formData.message,
      });

      await executeTrailStep(
        TRAIL_IDS.DONATION_REFUND,
        TRAIL_IDS.DONATION_REFUND_VERSION,
        1, // Donation step
        'donate_node',
        userInputs
      );

      // Submit execution to API after successful transaction
      if (state.transactionHash) {
        await submitExecutionToApi(
          TRAIL_IDS.DONATION_REFUND,
          TRAIL_IDS.DONATION_REFUND_VERSION,
          'donate_node',
          state.transactionHash
        );
      }

    } catch (error) {
      console.error('Failed to donate:', error);
    }
  };

  const isFormValid = formData.crowdfundId && formData.amount && parseFloat(formData.amount) > 0;
  const progressPercentage = selectedCrowdfund 
    ? Math.min((parseFloat(selectedCrowdfund.raisedAmount) / parseFloat(selectedCrowdfund.goalAmount)) * 100, 100)
    : 0;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Support a Crowdfund
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help bring community projects to life with your contribution
        </p>
      </div>

      {(!authenticated || !isConnected) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            {!authenticated ? 'Please sign in to make a donation' : 'Please link a wallet to make transactions'}
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
          {/* Crowdfund Selection */}
          <div>
            <label htmlFor="crowdfundId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Crowdfund *
            </label>
            {loadingCrowdfunds ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading crowdfunds...</span>
              </div>
            ) : (
              <select
                id="crowdfundId"
                name="crowdfundId"
                value={formData.crowdfundId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Choose a crowdfund to support</option>
                {crowdfunds.map(cf => (
                  <option key={cf.id} value={cf.id}>
                    {cf.title} ({cf.raisedAmount}/{cf.goalAmount} ETH)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Crowdfund Details */}
          {selectedCrowdfund && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {selectedCrowdfund.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                {selectedCrowdfund.description}
              </p>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>Progress</span>
                  <span>{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  Raised: {selectedCrowdfund.raisedAmount} ETH
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Goal: {selectedCrowdfund.goalAmount} ETH
                </span>
              </div>
            </div>
          )}

          {/* Donation Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Donation Amount (ETH) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.01"
              step="0.001"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Optional Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Leave an encouraging message for the creator"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              maxLength={200}
            />
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
                Thank you for your donation! 
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
            onClick={handleDonate}
            disabled={!isFormValid || state.isLoading || !authenticated || !isConnected}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Donation...
              </div>
            ) : (
              `Donate ${formData.amount || '0'} ETH`
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Donations are processed on Base network and are publicly visible
          </p>
        </div>
      )}
    </div>
  );
}
