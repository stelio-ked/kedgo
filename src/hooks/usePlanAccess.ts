import { useMemo } from "react";
import { PlanType } from "../types";

export interface PlanAccess {
  planType: PlanType;
  isPro: boolean;
  isAnnual: boolean;
  isFounders: boolean;
  isPass: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  trialExpired: boolean;
  canCreateItinerary: boolean;
  canUseAI: boolean;
  canExportPdf: boolean;
  canUseOCR: boolean;
  maxDocuments: number;
  canAccessTab: (tabId: string) => boolean;
}

export function usePlanAccess(
  currentUser: any,
  userPlan: PlanType,
  itinerariesCount: number = 0
): PlanAccess {
  return useMemo(() => {
    const isFounders = 
      userPlan === 'founders_lifetime' || 
      userPlan === 'pro_lifetime' || 
      currentUser?.isLifetimePro || 
      currentUser?.planType === 'founders_lifetime' || 
      currentUser?.planType === 'pro_lifetime';

    const isAnnual = 
      userPlan === 'annual' || 
      currentUser?.isAnnualPro || 
      currentUser?.planType === 'annual' ||
      (currentUser?.annualExpiresAt && new Date(currentUser.annualExpiresAt) > new Date());

    const isPass = userPlan === 'pass' || currentUser?.planType === 'pass';
    const isPro = isFounders || isAnnual;
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

    const currentPlanType: PlanType = isFounders
      ? 'founders_lifetime'
      : isAnnual
      ? 'annual'
      : isPass
      ? 'pass'
      : 'starter';

    const canAccessTab = (tabId: string): boolean => {
      // Pro (Annual / Founders) & Pass have full access to all tabs
      if (isPro || isPass) return true;

      // When trial expired, restricted tabs are blocked
      if (trialExpired) {
        if (tabId === 'finances' || tabId === 'vault' || tabId === 'agenda' || tabId === 'chat') {
          return false;
        }
      }
      return true;
    };

    // Trava de criação de roteiros: Starter/Trial permite no máximo 1 roteiro. Criar múltiplos é exclusivo Pro (Anual/Founders).
    const canCreateItinerary = isPro || (itinerariesCount < 1 && !trialExpired);

    return {
      planType: currentPlanType,
      isPro,
      isAnnual,
      isFounders,
      isPass,
      isTrial,
      trialDaysRemaining,
      trialExpired,
      canCreateItinerary,
      canUseAI: !trialExpired,
      canExportPdf: isPro || isPass,
      canUseOCR: isPro || isPass || !trialExpired,
      maxDocuments: isPro || isPass ? 999 : (trialExpired ? 0 : 3),
      canAccessTab,
    };
  }, [currentUser, userPlan, itinerariesCount]);
}

