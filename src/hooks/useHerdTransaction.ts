'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';
import { base } from 'wagmi/chains';
import { getStepEvaluation, submitExecution, enforceRateLimit, handleHerdApiError } from '@/lib/herd-api';

interface TransactionRequest {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}

interface HerdTransactionState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  transactionHash: string | null;
}

export function useHerdTransaction() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const [state, setState] = useState<HerdTransactionState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    transactionHash: null,
  });

  // Get user's linked wallets using Privy
  const linkedWallets = user?.linkedAccounts?.filter(
    account => account.type === 'wallet'
  ) || [];
  const address = linkedWallets[0]?.address as `0x${string}` | undefined;
  const isConnected = authenticated && linkedWallets.length > 0;

  // Switch to Base chain when wallet is connected
  useEffect(() => {
    if (isConnected && wallets.length > 0) {
      // Use Privy's wallet switch chain method
      const wallet = wallets[0];
      if (wallet.switchChain) {
        wallet.switchChain(base.id).catch(console.error);
      }
    }
  }, [wallets, isConnected]);

  const executeTrailStep = async (
    trailId: string,
    versionId: string,
    stepNumber: number,
    nodeId: string,
    userInputs: Record<string, any>
  ) => {
    if (!address || !isConnected) {
      setState(prev => ({
        ...prev,
        error: 'Please connect your wallet first',
      }));
      return;
    }

    setState({
      isLoading: true,
      isSuccess: false,
      error: null,
      transactionHash: null,
    });

    try {
      // Enforce rate limiting
      await enforceRateLimit();

      // Get transaction calldata from evaluations API
      const evaluation = await getStepEvaluation(
        trailId,
        versionId,
        stepNumber,
        userInputs,
        address
      );

      // Send transaction using Privy
      const result = await sendTransaction({
        to: evaluation.contractAddress as `0x${string}`,
        data: evaluation.callData as `0x${string}`,
        value: BigInt(evaluation.payableAmount ?? '0'),
      }, {
        address: address, // Specify which wallet to use
      });

      // Transaction was successful - update state
      setState(prev => ({
        ...prev,
        isSuccess: true,
        transactionHash: result.hash,
        isLoading: false,
      }));

      console.log('Transaction successfully sent:', result.hash);

    } catch (error: any) {
      const errorMessage = handleHerdApiError(error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    }
  };

  const submitExecutionToApi = async (
    trailId: string,
    versionId: string,
    nodeId: string,
    transactionHash: string
  ) => {
    if (!address) return;

    try {
      await submitExecution(trailId, versionId, {
        nodeId,
        transactionHash,
        walletAddress: address,
        execution: { type: 'latest' },
      });
      console.log('Execution submitted successfully');
    } catch (error: any) {
      console.error('Failed to submit execution:', error);
      // Note: We don't update state here as transaction was successful
      // This is just for tracking purposes on Herd's side
    }
  };

  const resetState = () => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
      transactionHash: null,
    });
  };

  return {
    executeTrailStep,
    submitExecutionToApi,
    resetState,
    isConnected,
    address,
    state,
  };
}
