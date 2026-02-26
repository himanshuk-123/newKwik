/**
 * Navigation Types — TypeScript type safety for React Navigation
 * 
 * Usage:
 *   const navigation = useNavigation<NavigationProp<RootStackParamList>>();
 *   const route = useRoute<RouteProp<RootStackParamList, 'Camera'>>();
 */

export type RootStackParamList = {
  // Auth
  Login: undefined;

  // Main screens
  Dashboard: undefined;
  CreateLeads: undefined;
  MyTasks: undefined;

  // Valuation flow
  ValuationList: undefined;  // List of all valuations with upload status
  Valuate: {
    id: string;          // leadId
    vehicleType: string; // "2W", "4W", etc
  };

  // Camera screen
  Camera: {
    id: string;          // leadId
    side: string;        // Card name e.g. "Front Side"
    vehicleType: string; // "2W", "4W", etc
    appColumn: string;   // API field name e.g. "FrontSideBase64"
  };
};
