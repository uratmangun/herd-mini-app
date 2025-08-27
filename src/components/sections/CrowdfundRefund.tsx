'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useHerdTransaction } from '@/hooks/useHerdTransaction';
import { TRAIL_IDS, createUserInputs, getExecutionHistory, readTrailData } from '@/lib/herd-api';

interface DonationRecord {
  id: string;
  crowdfundId: string;
  crowdfundTitle: string;
  amount: string;
  date: string;
  transactionHash: string;
  canRefund: boolean;
  isRefunded: boolean;
}

export function CrowdfundRefund() {
  const { authenticated, user, linkWallet } = usePrivy();
  
  // Get user's linked wallets using Privy
  const linkedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];
  const address = linkedWallets[0]?.address;
  const isConnected = authenticated && linkedWallets.length > 0;
  
  const { executeTrailStep, submitExecutionToApi, state, resetState } = useHerdTransaction();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load user's donations on component mount and wallet connection
  useEffect(() => {
    if (isConnected && address) {
      loadUserDonations();
    }
  }, [isConnected, address]);

  const loadUserDonations = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Get execution history for donations from this wallet
      const history = await getExecutionHistory(
        TRAIL_IDS.DONATION_REFUND,
        TRAIL_IDS.DONATION_REFUND_VERSION,
        [address]
      );

      // Mock donation data for demonstration
      // In real implementation, this would be parsed from the execution history
      const mockDonations: DonationRecord[] = [
        {
          id: 'don_001',
          crowdfundId: 'cf_001',
          crowdfundTitle: 'Community Garden Project',
          amount: '0.05',
          date: '2024-08-26',
          transactionHash: '0x1234...abcd',
          canRefund: true,
          isRefunded: false,
        },
        {
          id: 'don_002',
          crowdfundId: 'cf_002',
          crowdfundTitle: 'Tech Workshop Series',
          amount: '0.02',
          date: '2024-08-25',
          transactionHash: '0x5678...efgh',
          canRefund: true,
          isRefunded: false,
        },
        {
          id: 'don_003',
          crowdfundId: 'cf_001',
          crowdfundTitle: 'Community Garden Project',
          amount: '0.03',
          date: '2024-08-20',
          transactionHash: '0x9012...ijkl',
          canRefund: false, // Maybe campaign ended successfully
          isRefunded: false,
        },
      ];

      // Filter to only show donations from the connected wallet
      setDonations(mockDonations.filter(d => !d.isRefunded));
    } catch (error) {
      console.error('Failed to load donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!authenticated || !isConnected || !selectedDonation) return;

    const donation = donations.find(d => d.id === selectedDonation);
    if (!donation || !donation.canRefund) return;

    resetState();

    try {
      // Create user inputs for the refund trail step
      const userInputs = createUserInputs('refund_node', {
        'inputs.donationId': donation.id,
        'inputs.crowdfundId': donation.crowdfundId,
        'inputs.donorAddress': address!,
        'inputs.originalAmount': donation.amount,
        'inputs.originalTxHash': donation.transactionHash,
      });

      await executeTrailStep(
        TRAIL_IDS.DONATION_REFUND,
        TRAIL_IDS.DONATION_REFUND_VERSION,
        2, // Refund step (assuming it's step 2 in the trail)
        'refund_node',
        userInputs
      );

      // Submit execution to API after successful transaction
      if (state.transactionHash) {
        await submitExecutionToApi(
          TRAIL_IDS.DONATION_REFUND,
          TRAIL_IDS.DONATION_REFUND_VERSION,
          'refund_node',
          state.transactionHash
        );

        // Update local state to reflect the refund
        setDonations(prev => 
          prev.map(d => 
            d.id === selectedDonation 
              ? { ...d, isRefunded: true } 
              : d
          )
        );
        setSelectedDonation('');
      }

    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const selectedDonationData = donations.find(d => d.id === selectedDonation);
  const refundableDonations = donations.filter(d => d.canRefund && !d.isRefunded);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Claim Refunds
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Request refunds for eligible donations from unsuccessful or cancelled campaigns
        </p>
      </div>

      {(!authenticated || !isConnected) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            {!authenticated ? 'Please sign in to request refunds' : 'Please link a wallet to make transactions'}
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

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your wallet to view your donations and claim refunds
          </p>
          <button
            onClick={() => address && isConnected}
            className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-300">Loading your donations...</span>
            </div>
          ) : refundableDonations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Refundable Donations
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have any donations eligible for refund at this time.
              </p>
            </div>
          ) : (
            <>
              {/* Donation Selection */}
              <div>
                <label htmlFor="donation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Donation to Refund *
                </label>
                <select
                  id="donation"
                  value={selectedDonation}
                  onChange={(e) => setSelectedDonation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Choose a donation to refund</option>
                  {refundableDonations.map(donation => (
                    <option key={donation.id} value={donation.id}>
                      {donation.crowdfundTitle} - {donation.amount} ETH ({donation.date})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Donation Details */}
              {selectedDonationData && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Refund Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Campaign:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDonationData.crowdfundTitle}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDonationData.amount} ETH
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Date:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedDonationData.date}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Transaction:</span>
                      <a
                        href={`https://basescan.org/tx/${selectedDonationData.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline hover:no-underline"
                      >
                        View on explorer
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                      <strong>Refund Notice:</strong> This donation is eligible for refund. 
                      The refunded amount will be returned to your wallet minus gas fees.
                    </p>
                  </div>
                </div>
              )}

              {/* All Donations List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Your Donation History
                </h3>
                <div className="space-y-3">
                  {donations.map(donation => (
                    <div 
                      key={donation.id} 
                      className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {donation.crowdfundTitle}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {donation.amount} ETH • {donation.date}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          donation.isRefunded
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            : donation.canRefund
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        }`}>
                          {donation.isRefunded 
                            ? 'Refunded' 
                            : donation.canRefund 
                            ? 'Refundable' 
                            : 'Completed'
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
                    Refund processed successfully! 
                    <br />
                    <a 
                      href={`https://basescan.org/tx/${state.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      View refund transaction
                    </a>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleRefund}
                disabled={!selectedDonation || state.isLoading || !selectedDonationData?.canRefund || !authenticated || !isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Refund...
                  </div>
                ) : (
                  `Claim Refund${selectedDonationData ? ` (${selectedDonationData.amount} ETH)` : ''}`
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Refunds are processed on Base network. Gas fees apply for the refund transaction.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
