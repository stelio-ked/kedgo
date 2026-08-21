import { useMemo } from "react";

export interface PlanAccess {
  planType: 'starter' | 'pass' | 'pro_lifetime';
  isPro: boolean;
  isPass: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  canCreateItinerary: boolean;
  canUseAI: boolean;
  canExportPdf: boolean;
  maxDocuments: number;
  canAccessTab: (tabId: string) => boolean;
}

export function usePlanAccess(
  currentUser: any,
  userPlan: 'starter' | 'pass' | 'pro_lifetime',
  itinerariesCount: number = 0
): PlanAccess {
  return useMemo(() => {
    const isPro = userPlan === 'pro_lifetime' || currentUser?.isLifetimePro || currentUser?.planType === 'pro_lifetime';
    const isPass = userPlan === 'pass' || currentUser?.planType === 'pass';
    const isTrial = !isPro && !isPass;

    let trialDaysRemaining = 15;
    if (isTrial && currentUser) {
      const startDateStr = currentUser.trialStartedAt || currentUser.createdAt;
      if (startDateStr) {
        const startDate = new Date(startDateStr);
        const now = new Date();
        const diffMs = now.getTime() - startDate.getTime();
        const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, 15 - daysElapsed);
      }
    }

    const trialExpired = isTrial && trialDaysRemaining <= 0;

    const planType: 'starter' | 'pass' | 'pro_lifetime' = isPro
      ? 'pro_lifetime'
      : isPass
      ? 'pass'
      : 'starter';

    const canAccessTab = (tabId: string): boolean => {
      // Pro & Pass have full access to all tabs
      if (isPro || isPass) return true;

      // When trial expired, restricted tabs are blocked
      if (trialExpired) {
        if (tabId === 'finances' || tabId === 'vault' || tabId === 'agenda' || tabId === 'chat') {
          return false;
        }
      }
      return true;
    };

    // Trava de criação de roteiros: Starter/Trial permite no máximo 1 roteiro. Criar novos é exclusivo Pro/Pass.
    const canCreateItinerary = isPro || isPass || (itinerariesCount < 1 && !trialExpired);

    return {
      planType,
      isPro,
      isPass,
      isTrial,
      trialDaysRemaining,
      trialExpired,
      canCreateItinerary,
      canUseAI: !trialExpired,
      canExportPdf: isPro || isPass,
      maxDocuments: isPro || isPass ? 999 : (trialExpired ? 0 : 3),
      canAccessTab,
    };
  }, [currentUser, userPlan, itinerariesCount]);
}
