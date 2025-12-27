// A/B Testing Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { abTestManager, type ABTest, type ABVariant, type ABTestStats } from '../lib/email/abtesting';

// Query keys
const QUERY_KEYS = {
  tests: (campaignId?: string) => ['ab-tests', campaignId] as const,
  test: (id: string) => ['ab-test', id] as const,
  testStats: (id: string) => ['ab-test-stats', id] as const,
};

// Hook to get all A/B tests
export function useABTests(campaignId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.tests(campaignId),
    queryFn: () => abTestManager.getTests(campaignId),
  });
}

// Hook to get single A/B test
export function useABTest(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.test(id),
    queryFn: () => abTestManager.getTest(id),
    enabled: !!id,
  });
}

// Hook to get A/B test statistics
export function useABTestStats(test: ABTest | null) {
  return useQuery({
    queryKey: QUERY_KEYS.testStats(test?.id || ''),
    queryFn: () => test ? abTestManager.calculateStats(test) : null,
    enabled: !!test,
    refetchInterval: test?.status === 'running' ? 30000 : false, // Refetch every 30s if running
  });
}

// Hook to create A/B test
export function useCreateABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (test: Omit<ABTest, 'id' | 'created_at' | 'updated_at'>) =>
      abTestManager.createTest(test),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests() });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests(data.campaign_id) });
      }
    },
  });
}

// Hook to update A/B test
export function useUpdateABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ABTest> }) =>
      abTestManager.updateTest(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests() });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests(data.campaign_id) });
        queryClient.setQueryData(QUERY_KEYS.test(data.id), data);
      }
    },
  });
}

// Hook to delete A/B test
export function useDeleteABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => abTestManager.deleteTest(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.test(id) });
    },
  });
}

// Hook to start A/B test
export function useStartABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => abTestManager.startTest(id),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests() });
        queryClient.setQueryData(QUERY_KEYS.test(data.id), data);
      }
    },
  });
}

// Hook to select winner
export function useSelectWinner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, variantId }: { testId: string; variantId?: string }) =>
      abTestManager.selectWinner(testId, variantId),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests() });
        queryClient.setQueryData(QUERY_KEYS.test(data.id), data);
      }
    },
  });
}

// Hook to cancel A/B test
export function useCancelABTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => abTestManager.cancelTest(id),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tests() });
        queryClient.setQueryData(QUERY_KEYS.test(data.id), data);
      }
    },
  });
}

// Hook to get recommended sample size
export function useRecommendedSampleSize() {
  return {
    calculate: (
      baselineRate: number,
      minimumDetectableEffect: number,
      power?: number,
      significance?: number
    ) => abTestManager.getRecommendedSampleSize(
      baselineRate,
      minimumDetectableEffect,
      power,
      significance
    ),
  };
}

// Hook to create default variants
export function useCreateDefaultVariants() {
  return {
    create: (testType: ABTest['test_type']) => abTestManager.createDefaultVariants(testType),
  };
}

// Unified hook for A/B test management
export function useABTestManagement(campaignId?: string) {
  const tests = useABTests(campaignId);
  const createTest = useCreateABTest();
  const updateTest = useUpdateABTest();
  const deleteTest = useDeleteABTest();
  const startTest = useStartABTest();
  const selectWinner = useSelectWinner();
  const cancelTest = useCancelABTest();
  const sampleSize = useRecommendedSampleSize();
  const variants = useCreateDefaultVariants();

  return {
    // Data
    tests: tests.data,
    isLoading: tests.isLoading,
    error: tests.error,

    // Mutations
    createTest: createTest.mutate,
    createTestAsync: createTest.mutateAsync,
    updateTest: updateTest.mutate,
    deleteTest: deleteTest.mutate,
    startTest: startTest.mutate,
    selectWinner: selectWinner.mutate,
    cancelTest: cancelTest.mutate,

    // Utilities
    calculateSampleSize: sampleSize.calculate,
    createDefaultVariants: variants.create,

    // Mutation states
    isCreating: createTest.isPending,
    isUpdating: updateTest.isPending,
    isDeleting: deleteTest.isPending,
    isStarting: startTest.isPending,
    isSelectingWinner: selectWinner.isPending,
    isCancelling: cancelTest.isPending,

    // Refetch
    refetch: tests.refetch,
  };
}

export default useABTestManagement;
