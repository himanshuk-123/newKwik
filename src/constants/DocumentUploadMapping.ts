/**
 * Hardcoded mapping of step Name → API field name (without "Base64" suffix).
 * Used as fallback when Appcolumn from API is null/undefined/empty.
 *
 * Ported from old Expo app: kwikcheck2/src/constants/DocumentUploadDataMapping.ts
 */

export const AllApiAcceptedKeys: Record<string, string> = {
  "Front Side Image": "FrontImg",
  "Back Side Image": "BackImg",
  "Left Side Image": "LeftImg",
  "Right side Image": "RightImg",
  "Right Side Image": "RightImg",
  "Engine Image": "EngineImg",
  "Dashboard": "InteriorDashBoardImg",
  "Interior Back Side": "InteriorBackSideImg",
  "Odmeter Reading": "Odomerter",
  "RC Front Image": "RCFront",
  "Rc Front Image": "RCFront",
  "Chassis Plate Image": "ChassisPlate",
  "RC Back Image": "RCBack",
  "Rc Back Image": "RCBack",
  "Chassis Imprint Image": "ChassisImPrint",
  "Front Tyre Image": "Tyre1",
  "Rear Tyre Image": "Tyre2",
  "Front Right Tyre Image": "Tyre1",
  "Rear Right Tyre Image": "Tyre4",
  "Rear Left Tyre Image": "Tyre3",
  "Valuator Selfie with vehicle": "ValuatorSelfieWithVehicle",
  "Valuator Selfie With Vehicle": "ValuatorSelfieWithVehicle",
  "Top View Image": "ElectricalImg",
  "Optional-1": "Other1",
  "Optional-2": "Other2",
  "Optional-3": "Other3",
  "Optional-4": "Other4",
  "Optional-5": "Other5",
  "Optional-6": "Other6",
  "Optional-7": "Other7",
  "Optional-8": "Other8",
  "Profile": "ProfileImage",
  "Electrical": "ElectricalImg",
};

/**
 * Vehicle-type-specific tyre field name mapping.
 * Tyre numbers differ per vehicle type (2W has 2 tyres, 4W has 4, etc.)
 */
export const TYRE_MAPPING: Record<string, { name: string; field: string }[]> = {
  "2W": [
    { name: "Front Tyre Image", field: "Tyre1" },
    { name: "Rear Tyre Image", field: "Tyre3" },
  ],
  "3W": [
    { name: "Front Tyre Image", field: "Tyre1" },
    { name: "Rear Left Tyre Image", field: "Tyre3" },
    { name: "Rear Right Tyre Image", field: "Tyre4" },
  ],
  "4W": [
    { name: "Front Left Tyre Image", field: "Tyre1" },
    { name: "Front Right Tyre Image", field: "Tyre2" },
    { name: "Rear Right Tyre Image", field: "Tyre3" },
    { name: "Rear Left Tyre Image", field: "Tyre4" },
  ],
  "FE": [
    { name: "Front Left Tyre Image", field: "Tyre1" },
    { name: "Front Right Tyre Image", field: "Tyre2" },
    { name: "Rear Right Tyre Image", field: "Tyre3" },
    { name: "Rear Left Tyre Image", field: "Tyre4" },
  ],
  "CV": [
    { name: "Front Left Tyre Image", field: "Tyre1" },
    { name: "Front Right Tyre Image", field: "Tyre2" },
    { name: "Rear Right Tyre Image", field: "Tyre3" },
    { name: "Rear Left Tyre Image", field: "Tyre4" },
  ],
  "CE": [
    { name: "Front Left Tyre Image", field: "Tyre1" },
    { name: "Front Right Tyre Image", field: "Tyre2" },
    { name: "Rear Right Tyre Image", field: "Tyre3" },
    { name: "Rear Left Tyre Image", field: "Tyre4" },
  ],
};

/**
 * Resolve the correct API field name for a step.
 * Priority: Appcolumn from API → Tyre mapping → AllApiAcceptedKeys → "Other"
 */
export const resolveAppColumn = (
  sideName: string,
  appcolumn: string | null | undefined,
  vehicleType: string
): string => {
  // 1. If API provided a valid Appcolumn, use it directly
  if (appcolumn) return appcolumn;

  // 2. For tyre images, use vehicle-type-specific mapping
  const tyreEntry = TYRE_MAPPING[vehicleType.toUpperCase()]?.find(
    t => t.name.toLowerCase() === sideName.toLowerCase()
  );
  if (tyreEntry) return tyreEntry.field;

  // 3. Fallback to hardcoded mapping
  if (AllApiAcceptedKeys[sideName]) return AllApiAcceptedKeys[sideName];

  // 4. Last resort — "Other" (server accepts OtherBase64)
  return "Other";
};
