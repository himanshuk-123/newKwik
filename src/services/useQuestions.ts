/**
 * useQuestions Hook
 *
 * Steps array mein se side ke questions dhundhta hai.
 * Questions "~" separated aate hain, Answer bhi "~" per-question, "/" per-option.
 */

import type { AppStepListDataRecord } from '../services/types';

interface GetSideQuestionParams {
  data: AppStepListDataRecord[];
  vehicleType: string;
  nameInApplication: string;
}

const useQuestions = () => {
  /**
   * Side name se matching step dhundhta hai.
   * Agar Questions non-empty hai toh step return karta hai, warna null.
   */
  const getSideQuestion = (params: GetSideQuestionParams): AppStepListDataRecord | null => {
    const { data, vehicleType, nameInApplication } = params;
    if (!data?.length || !nameInApplication) return null;

    const match = data.find(
      s => s.VehicleType === vehicleType.toUpperCase() && (s.Name || '').toLowerCase().trim() === nameInApplication.toLowerCase().trim()
    );

    if (!match) return null;

    // Agar Questions empty hai toh koi modal nahi dikhana
    const hasQuestions = (match.Questions || '').split('~').some(q => q.trim().length > 0);
    return hasQuestions ? match : null;
  };

  return { getSideQuestion };
};

export default useQuestions;
