/**
 * useQuestions Hook - Stub for offline mode
 * Questionnaire processing disabled for now
 */

import { AppStepListDataRecord } from '../store/valuation.store';

interface GetSideQuestionParams {
  data: AppStepListDataRecord[];
  vehicleType: string;
  nameInApplication: string;
}

const useQuestions = () => {
  const getSideQuestion = (params: GetSideQuestionParams): AppStepListDataRecord | null => {
    console.log('[useQuestions] getSideQuestion called (disabled in offline mode)');
    // Feature disabled - will enable later
    // For now, return null to skip question modals
    return null;
  };

  return { getSideQuestion };
};

export default useQuestions;
