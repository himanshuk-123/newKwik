/**
 * ValuationPage - Offline Mode
 * 
 * ✅ ENABLED:
 * - Display app steps list from cached data (vehicle_type based)
 * - Show step cards with proper icons and names
 * - Offline indicator banner
 * 
 * ❌ DISABLED (Coming Soon):
 * - Image/Video capture and upload
 * - Questionnaire modals
 * - Progress tracking
 * - Upload queue
 * 
 * Data Source: app_steps table (synced on login)
 */

import {
  StyleSheet,
  ToastAndroid,
  View,
  Text as RNText,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { COLORS } from "../constants/Colors";
import { useValuationStore } from "../store/valuation.store";
import { AppStepListDataRecord } from "./types";
import { submitLeadReportApi } from "./api/valuation.api";
import useQuestions from "../services/useQuestions";
import { Lead } from "../types/leads";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RNFS from 'react-native-fs';
// import UploadQueueStatus from "../components/UploadQueueStatus"; // Disabled for offline mode
import { uploadQueueManager } from "../services/uploadQueue.manager";
import {
  getCapturedMediaByLeadId,
  setTotalCount,
  updateLeadMetadata,
} from "../database/valuationProgress.db";

// ============ STATIC DATA (REMOVED - Replaced by Store) ============

// ============ ICON MAPPING FOR CARDS ============
const getCardIcon = (cardName: string): { name: string; color: string; type: 'material' | 'image' } => {
  const normalizedName = cardName?.toLowerCase().trim() || '';

  // Odometer
  if (normalizedName.includes('odmeter') || normalizedName.includes('odometer'))
    return { name: 'speedometer', color: '#FF6B6B', type: 'material' };

  // Dashboard & Interior
  if (normalizedName.includes('dashboard'))
    return { name: 'view-dashboard', color: '#4ECDC4', type: 'material' };
  if (normalizedName.includes('interior back'))
    return { name: 'car-seat-heater', color: '#95E1D3', type: 'material' };
  if (normalizedName.includes('interior'))
    return { name: 'car-seat', color: '#45B7D1', type: 'material' };

  // Engine
  if (normalizedName.includes('engine'))
    return { name: 'engine-outline', color: '#F38181', type: 'material' };

  // Chassis
  if (normalizedName.includes('chassis imprint'))
    return { name: 'stamper', color: '#AA96DA', type: 'material' };
  if (normalizedName.includes('chassis plate'))
    return { name: 'card-text-outline', color: '#FCBAD3', type: 'material' };
  if (normalizedName.includes('chassis'))
    return { name: 'barcode-scan', color: '#A8E6CF', type: 'material' };

  // Vehicle Sides - Enhanced with directions
  if (normalizedName.includes('front side'))
    return { name: 'car-front', color: '#4A90E2', type: 'material' };
  if (normalizedName.includes('right side'))
    return { name: 'car-side', color: '#50C878', type: 'material' };
  if (normalizedName.includes('back side') || normalizedName.includes('rear'))
    return { name: 'car-back', color: '#FFB347', type: 'material' };
  if (normalizedName.includes('left side'))
    return { name: 'car-side', color: '#FF6F91', type: 'material' };

  // Tyres - Different icons for each position
  if (normalizedName.includes('front right tyre'))
    return { name: 'tire', color: '#5DADE2', type: 'material' };
  if (normalizedName.includes('rear right tyre'))
    return { name: 'tire', color: '#AF7AC5', type: 'material' };
  if (normalizedName.includes('rear left tyre'))
    return { name: 'tire', color: '#F39C12', type: 'material' };
  if (normalizedName.includes('front left tyre'))
    return { name: 'tire', color: '#52BE80', type: 'material' };
  if (normalizedName.includes('tyre') || normalizedName.includes('tire'))
    return { name: 'car-tire-alert', color: '#566573', type: 'material' };

  // Documents
  if (normalizedName.includes('selfie'))
    return { name: 'account-circle', color: '#E74C3C', type: 'material' };
  if (normalizedName.includes('rc front'))
    return { name: 'file-document-edit', color: '#3498DB', type: 'material' };
  if (normalizedName.includes('rc back'))
    return { name: 'file-document-edit-outline', color: '#9B59B6', type: 'material' };
  if (normalizedName.includes('rc'))
    return { name: 'file-certificate-outline', color: '#1ABC9C', type: 'material' };

  // Optional & Information
  if (normalizedName.includes('optional'))
    return { name: 'camera-plus-outline', color: '#95A5A6', type: 'material' };
  if (normalizedName.includes('information') || normalizedName.includes('record'))
    return { name: 'clipboard-text-outline', color: '#34495E', type: 'material' };

  // Video
  if (normalizedName.includes('video'))
    return { name: 'video-outline', color: '#E67E22', type: 'material' };

  // Default with different icon sets
  return { name: 'camera-outline', color: '#7F8C8D', type: 'material' };
};

// ============ COMPONENTS ============

interface SelectorProps {
  keyText: string;
  valueText: string;
  onPress: () => void;
}

const Selector = ({ keyText, valueText, onPress }: SelectorProps) => {
  return (
    <TouchableOpacity style={styles.selectorContainer} onPress={onPress}>
      <RNText style={styles.selectorLabel}>{keyText}</RNText>
      <RNText style={styles.selectorValue}>
        {valueText || "Select..."}
      </RNText>
    </TouchableOpacity>
  );
};

interface ConditionModalProps {
  open: boolean;
  sideName: string;
  questionsData: AppStepListDataRecord | null;
  onSubmit: (payload: {
    selectedAnswer?: string;
    odometerReading?: string;
    keyAvailable?: string;
    chassisPlate?: string;
  }) => void;
  onClose: () => void;
}

const ConditionModal = ({
  open,
  sideName,
  questionsData,
  onSubmit,
  onClose,
}: ConditionModalProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [odometerReading, setOdometerReading] = useState<string>("");
  const [keyAvailable, setKeyAvailable] = useState<string>("");
  const [chassisPlate, setChassisPlate] = useState<string>("");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedAnswer("");
      setOdometerReading("");
      setKeyAvailable("");
      setChassisPlate("");
    }
  }, [open]);

  // ✅ UPDATED: Allow modal to open even without questions data
  if (!questionsData) {
    return null;
  }

  const stepName = (questionsData.Name || '').toLowerCase();
  const isOdometer = stepName.includes('odometer') || stepName.includes('odmeter');
  const isChassisPlate = stepName.includes('chassis plate');
  
  // Handle missing questions gracefully
  const questions = questionsData.Questions || null;
  const hasQuestions = Boolean(questions);
  
  const normalizedAnswers = (questionsData.Answer || '').replaceAll('~', '/');
  const answers = normalizedAnswers
    .split('/')
    .map((item: string) => item.trim())
    .filter(Boolean);

  const renderAnswerOptions = () => {
    return answers.map((answer: string, index: number) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.optionButton,
          selectedAnswer === answer && styles.optionButtonSelected,
        ]}
        onPress={() => setSelectedAnswer(answer)}
        activeOpacity={0.7}
      >
        <RNText
          style={[
            styles.optionButtonText,
            selectedAnswer === answer && styles.optionButtonTextSelected,
          ]}
        >
          {answer}
        </RNText>
      </TouchableOpacity>
    ));
  };

  const handleSubmit = () => {
    // ✅ If no questions, just close the modal
    if (!hasQuestions) {
      onSubmit({});
      onClose();
      return;
    }

    if (isOdometer) {
      if (!odometerReading.trim() || !keyAvailable.trim()) {
        ToastAndroid.show("Please enter odometer and select key availability", ToastAndroid.SHORT);
        return;
      }
      onSubmit({
        odometerReading,
        keyAvailable,
        selectedAnswer: selectedAnswer || odometerReading,
      });
      setOdometerReading("");
      setKeyAvailable("");
      setSelectedAnswer("");
      onClose();
      return;
    }

    if (isChassisPlate) {
      if (!chassisPlate.trim()) {
        ToastAndroid.show("Please enter chassis plate", ToastAndroid.SHORT);
        return;
      }
      onSubmit({ chassisPlate: chassisPlate.trim(), selectedAnswer: chassisPlate.trim() });
      setChassisPlate("");
      onClose();
      return;
    }

    if (!selectedAnswer.trim()) {
      ToastAndroid.show("Please select an option", ToastAndroid.SHORT);
      return;
    }

    onSubmit({ selectedAnswer });
    setSelectedAnswer("");
    onClose();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ✅ Updated: Show title if questions exist, otherwise show generic message */}
            <RNText style={styles.modalTitle}>
              {hasQuestions
                ? (Array.isArray(questions) ? questions[0] : questions)
                : "Image Captured"}
            </RNText>
            <RNText style={styles.modalSubtitle}>For: {sideName}</RNText>

            {/* Show content only if questions exist */}
            {hasQuestions ? (
              <>
                {isOdometer && Array.isArray(questions) && (
                  <>
                    <RNText style={styles.optionsLabel}>{questions[0]}</RNText>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Odometer Reading"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={odometerReading}
                      onChangeText={(value) => {
                        setOdometerReading(value);
                        setSelectedAnswer(value);
                      }}
                    />
                    <RNText style={styles.optionsLabel}>{questions[1]}</RNText>
                    <View style={styles.optionsContainer}>
                      {['Available', 'Not Available'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionButton,
                            keyAvailable === option && styles.optionButtonSelected,
                          ]}
                          onPress={() => setKeyAvailable(option)}
                          activeOpacity={0.7}
                        >
                          <RNText
                            style={[
                              styles.optionButtonText,
                              keyAvailable === option && styles.optionButtonTextSelected,
                            ]}
                          >
                            {option}
                          </RNText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {isChassisPlate && (
                  <>
                    <RNText style={styles.optionsLabel}>
                      {Array.isArray(questions) ? questions[0] : questions}
                    </RNText>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Chassis Plate"
                      placeholderTextColor="#999"
                      value={chassisPlate}
                      onChangeText={setChassisPlate}
                    />
                  </>
                )}

                {!isOdometer && !isChassisPlate && (
                  <>
                    <RNText style={styles.optionsLabel}>Select an option:</RNText>
                    <View style={styles.optionsContainer}>
                      {renderAnswerOptions()}
                    </View>
                  </>
                )}
              </>
            ) : (
              <RNText style={styles.optionsLabel}>
                ✓ Image captured successfully. You can now proceed to the next card.
              </RNText>
            )}
          </ScrollView>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <RNText style={styles.modalButtonTextCancel}>Cancel</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonSubmit,
                (
                  (!hasQuestions) || // ✅ Allow submit if no questions
                  (isOdometer && (!odometerReading.trim() || !keyAvailable.trim())) ||
                  (isChassisPlate && !chassisPlate.trim()) ||
                  (!isOdometer && !isChassisPlate && !selectedAnswer)
                ) && styles.modalButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                hasQuestions && (
                  (isOdometer && (!odometerReading.trim() || !keyAvailable.trim())) ||
                  (isChassisPlate && !chassisPlate.trim()) ||
                  (!isOdometer && !isChassisPlate && !selectedAnswer)
                )
              }
            >
              <RNText style={styles.modalButtonTextSubmit}>
                {hasQuestions ? 'Submit' : 'OK'}
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface OptionalInfoModalProps {
  open: boolean;
  closeModal: () => void;
  Questions: string;
  Answers: string;
  onSubmit: (answer: string) => void;
}

const OptionalInfoModal = ({
  open,
  closeModal,
  Questions,
  Answers,
  onSubmit,
}: OptionalInfoModalProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const options = (Answers || "")
    .replaceAll("~", "/")
    .split("/")
    .map((item) => item.trim())
    .filter(Boolean);

  const handleSubmit = () => {
    if (!selectedAnswer.trim()) {
      ToastAndroid.show("Please enter an answer", ToastAndroid.SHORT);
      return;
    }
    onSubmit(selectedAnswer);
    setSelectedAnswer("");
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <RNText style={styles.modalTitle}>{Questions}</RNText>
          <RNText style={styles.modalSubtitle}>Select an option</RNText>

          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={`${option}-${index}`}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedAnswer(option)}
                activeOpacity={0.7}
              >
                <RNText
                  style={[
                    styles.optionButtonText,
                    selectedAnswer === option && styles.optionButtonTextSelected,
                  ]}
                >
                  {option}
                </RNText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={closeModal}
            >
              <RNText style={styles.modalButtonTextCancel}>Cancel</RNText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonSubmit,
                !selectedAnswer && styles.modalButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedAnswer}
            >
              <RNText style={styles.modalButtonTextSubmit}>Submit</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ValuateCard = ({
  text,
  isDone,
  id,
  vehicleType,
  isClickable,
  appColumn,
  isUploading,
  uploadStatus,
}: {
  text: string;
  id: string;
  vehicleType: string;
  isDone?: string | undefined;
  isClickable?: boolean;
  appColumn?: string;
  isUploading?: boolean;
  uploadStatus?: 'pending' | 'uploaded' | 'failed';
}) => {
  const navigation = useNavigation();

  const HandleClick = () => {
    console.log('[Card] Click:', { side: text, isClickable, isDone: !!isDone });
    
    if (!isClickable && !isDone) {
      ToastAndroid.show("Please complete previous steps first", ToastAndroid.SHORT);
      return;
    }
    
    // Navigate to CustomCamera with appColumn for dynamic API param naming
    console.log('[Card] ✅ Opening camera for:', text, isDone ? '(RETAKE)' : '(NEW)');
    // @ts-ignore
    navigation.navigate("Camera", {
      id: id,
      side: text,
      vehicleType: vehicleType,
      appColumn: appColumn || text.replace(/\s/g, ''),
    });
  };

  const cardBackgroundStyle = {
    backgroundColor: isDone || uploadStatus === 'uploaded' ? "#ABEB94" : "white",
  };

  return (
    <TouchableOpacity
      onPress={HandleClick}
      style={[styles.card, cardBackgroundStyle, !isClickable && !isDone && styles.cardDisabled]}
      activeOpacity={isClickable || isDone ? 0.7 : 1}
      disabled={!isClickable && !isDone}
    >
      {isUploading ? (
        <RNText style={styles.uploadingText}>Uploading...</RNText>
      ) : isDone ? (
        <>
          <Image
            style={styles.cardImage}
            source={{ uri: isDone }}
            resizeMode="cover"
          />
          {/* Retake indicator */}
          <View style={styles.retakeIndicator}>
            <MaterialCommunityIcons name="camera-retake" size={16} color="#fff" />
            <RNText style={styles.retakeText}>Retake</RNText>
          </View>
        </>
      ) : uploadStatus === 'uploaded' ? (
        // Show checkmark when uploaded but file is gone (cache cleared)
        <View style={styles.capturedContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={48}
            color="#4CAF50"
            style={styles.checkIcon}
          />
          <RNText style={styles.capturedText}>Captured</RNText>
        </View>
      ) : (
        <MaterialCommunityIcons
          name={getCardIcon(text).name}
          size={40}
          color={getCardIcon(text).color}
          style={styles.cardIcon}
        />
      )}
      <RNText style={styles.cardText}>{text}</RNText>
    </TouchableOpacity>
  );
};

interface sidesDone {
  side: string;
  imgUrl: string;
}

interface RouteParams {
  leadId: string;
  displayId?: string;
  vehicleType: string;
  leadData?: Lead;
}

const ValuationPage = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();

  // Initialize useQuestions hook
  const { getSideQuestion } = useQuestions();

  // Data from Route & Store
  const { leadId, displayId, vehicleType, leadData } = route.params as RouteParams;
  const { steps, isLoading, fetchSteps, reset, sideUploads, getSideUpload, markLocalCaptured } = useValuationStore();

  const [_sidesDone, _setSidesDone] = useState<sidesDone[]>([]);
  const [OptionalInfoModalState, setOptionalInfoModalState] = useState({
    open: false,
    Questions: "",
    Answer: "",
  });
  const [OptionalInfoQuestionAnswer, setOptionalInfoQuestionAnswer] =
    useState<Record<string, string>>({});
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [currentSideForCondition, setCurrentSideForCondition] = useState("");
  const [currentSideQuestionData, setCurrentSideQuestionData] = useState<any>(null);
  const [_showQueueModal, _setShowQueueModal] = useState(false);
  const [_queueCount, setQueueCount] = useState(0);
  const [sideUploadStatus, setSideUploadStatus] = useState<Record<string, 'pending' | 'uploaded' | 'failed'>>({});
  const processedSidesRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    // ✅ OFFLINE MODE: Fetch steps by vehicleType instead of leadId
    if (vehicleType) {
      console.log('[ValuationPage] Loading steps for vehicle type:', vehicleType);
      fetchSteps(vehicleType);
    } else {
      console.warn('[ValuationPage] No vehicleType provided');
    }
    processedSidesRef.current = {};
    setLastProcessedSide("");
    return () => reset();
  }, [vehicleType, fetchSteps, reset]);

  const loadCapturedMedia = useCallback(async () => {
    if (!leadId) return;
    try {
      const captured = await getCapturedMediaByLeadId(leadId.toString());
      if (captured.length === 0) {
        console.log('[ValuationPage] No captured media found for lead:', leadId);
        return;
      }

      const statusMap: Record<string, 'pending' | 'uploaded' | 'failed'> = {};
      let validCount = 0;
      let missingCount = 0;

      // ✅ FIRST: Mark ALL loaded sides as processed to prevent modals
      // This must happen BEFORE calling markLocalCaptured
      for (const item of captured) {
        if (item.side && item.localUri) {
          const filePath = item.localUri.replace('file://', '');
          const fileExists = await RNFS.exists(filePath);
          
          if (fileExists) {
            // Mark as processed so modal doesn't open for old captures
            processedSidesRef.current[item.side] = true;
          }
        }
      }

      console.log('[ValuationPage] 🔒 Pre-marked sides as processed:', Object.keys(processedSidesRef.current));

      // THEN: Update store and status map
      for (const item of captured) {
        if (item.side && item.localUri) {
          const filePath = item.localUri.replace('file://', '');
          const fileExists = await RNFS.exists(filePath);
          
          if (fileExists) {
            // ✅ File exists - mark as captured in store
            validCount++;
            markLocalCaptured(item.side, item.localUri);
            
            // Track uploadStatus for each side
            statusMap[item.side] = item.uploadStatus;
          } else {
            // ❌ File missing - don't mark as captured
            missingCount++;
            console.warn('[ValuationPage] File missing for side:', item.side, 'path:', item.localUri);
          }
        }
      }

      setSideUploadStatus(statusMap);
      
      console.log('[ValuationPage] ✅ Loaded captured media:', {
        leadId,
        total: captured.length,
        valid: validCount,
        missing: missingCount,
        uploaded: captured.filter(c => c.uploadStatus === 'uploaded').length,
        pending: captured.filter(c => c.uploadStatus === 'pending').length,
        sides: Object.keys(statusMap),
        processedSides: Object.keys(processedSidesRef.current),
      });
    } catch (error) {
      console.error('[ValuationPage] Failed to load captured media:', error);
    }
  }, [leadId, markLocalCaptured]);

  useFocusEffect(
    useCallback(() => {
      loadCapturedMedia();
    }, [loadCapturedMedia])
  );

  // Subscribe to upload queue changes
  useEffect(() => {
    const unsubscribe = uploadQueueManager.subscribe((count) => {
      setQueueCount(count);
    });

    // Initial load
    uploadQueueManager.getQueueCount().then(count => setQueueCount(count));

    return unsubscribe;
  }, []);

  const [sideConditions, setSideConditions] = useState<Record<string, string>>({});
  const [lastProcessedSide, setLastProcessedSide] = useState<string>("");

  // Watch for uploaded sides from store and show condition modal
  useEffect(() => {
    console.log('[ValuationPage] 🎯 Modal useEffect triggered:', {
      sideUploadsLength: sideUploads?.length,
      lastProcessedSide,
      processedSidesCount: Object.keys(processedSidesRef.current).length,
    });

    // If any new sides are uploaded (from Camera component), show modal
    if (sideUploads && sideUploads.length > 0) {
      // Get the last uploaded side
      const lastUploadedSide = sideUploads[sideUploads.length - 1];

      const isAlreadyProcessed = processedSidesRef.current[lastUploadedSide?.side];
      const isDifferentFromLast = lastUploadedSide?.side !== lastProcessedSide;

      console.log('[ValuationPage] 🔍 Checking last uploaded side:', {
        side: lastUploadedSide?.side,
        isDifferentFromLast,
        isAlreadyProcessed,
        shouldShowModal: lastUploadedSide && isDifferentFromLast && !isAlreadyProcessed,
      });

      // Only process if this is a NEW side (not already processed)
      if (
        lastUploadedSide &&
        lastUploadedSide.side !== lastProcessedSide &&
        !processedSidesRef.current[lastUploadedSide.side]
      ) {
        const normalizeName = (value?: string) => value?.toLowerCase().trim() || '';
        const normalizedSide = normalizeName(lastUploadedSide.side);

        // Find matching step using normalized names
        const stepData = steps.find(s => normalizeName(s.Name) === normalizedSide);

        console.log('[ValuationPage] 📸 NEW image captured for side:', {
          side: lastUploadedSide.side,
          found: !!stepData,
          stepName: stepData?.Name,
        });

        // Get processed question data from useQuestions hook
        // Pass the exact side name that was captured
        const questionData = getSideQuestion({
          data: steps,
          vehicleType: vehicleType,
          nameInApplication: stepData?.Name || lastUploadedSide.side,  // Use step name if found
        });

        const hasQuestions = Boolean(questionData?.Questions) &&
          (Array.isArray(questionData?.Questions)
            ? questionData.Questions.length > 0
            : true);

        // ✅ UPDATED: ALWAYS show modal for captured images, even if no questions
        if (stepData) {
          console.log('[ValuationPage] ✅ Opening modal for:', lastUploadedSide.side, {
            hasQuestions,
            questionsCount: Array.isArray(questionData?.Questions) ? questionData.Questions.length : 0,
          });
          
          setCurrentSideForCondition(lastUploadedSide.side);
          // For sides without questions, pass the step data anyway so modal can render
          setCurrentSideQuestionData(questionData || stepData);
          setShowConditionModal(true);
          processedSidesRef.current[lastUploadedSide.side] = true;
          setLastProcessedSide(lastUploadedSide.side);
        } else {
          console.log('[ValuationPage] ❌ Step not found for side:', lastUploadedSide.side, 'Available steps:', steps.map(s => s.Name));
          processedSidesRef.current[lastUploadedSide.side] = true;
          setLastProcessedSide(lastUploadedSide.side);
        }
      } else if (isAlreadyProcessed) {
        console.log('[ValuationPage] ⏭️  Skipping modal - side already processed:', lastUploadedSide?.side);
      }
    }
  }, [sideUploads?.length, steps, getSideQuestion, vehicleType, lastProcessedSide]);

  const clickableImageSides = useMemo(() => {
    if (!steps || !Array.isArray(steps)) return [];
    return steps
      .filter((step) => step.Images !== false) // step.Images is boolean or undefined
      .map((step) => step.Name || "");
  }, [steps]);

  const optionalInfoItems = useMemo(() => {
    if (!steps || !Array.isArray(steps)) return [];
    return steps.filter((step) => step.Images === false);
  }, [steps]);

  useEffect(() => {
    if (!leadId) return;
    if (clickableImageSides.length === 0) return;

    const leadIdStr = leadId.toString();

    // Set expected total images for this lead (used in ValuatedLeads progress)
    setTotalCount(leadIdStr, clickableImageSides.length).catch((error) => {
      console.error('[ValuationPage] Failed to set total count:', error);
    });

    // Persist key lead metadata so ValuatedLeads can reliably navigate back
    // with the correct vehicleType and identifiers, even after app restarts.
    const dbVehicleType =
      vehicleType ||
      (leadData?.VehicleType ? leadData.VehicleType.toString() : '');

    const dbRegNo =
      (leadData?.RegNo || '').toString().toUpperCase() ||
      (displayId || '').toString();

    const dbProspectNo =
      (leadData as any)?.LeadUId?.toString() ||
      (leadData as any)?.ProspectNo?.toString() ||
      '';

    updateLeadMetadata(leadIdStr, {
      regNo: dbRegNo,
      prospectNo: dbProspectNo,
      vehicleType: dbVehicleType,
    }).catch((error) => {
      console.error('[ValuationPage] Failed to update lead metadata:', error);
    });
  }, [leadId, clickableImageSides.length, vehicleType, leadData, displayId]);

  const ClickedSideImage = (side: string) => {
    // Get image URI from Zustand store
    const sideUpload = getSideUpload(side);
    return sideUpload?.localUri || "";
  };

  const isVideoRecorded = () => {
    // Check if video is recorded from Zustand store (same pattern as images)
    const videoUpload = getSideUpload('Video');
    return videoUpload?.localUri ? true : false;
  };

  const HandleVideoNavigation = () => {
    // @ts-ignore
    navigation.navigate("VideoCamera", {
      id: leadId,
      side: "Video",
      vehicleType,
    });
  };

  const isAllImagesCaptured = () => {
    if (!clickableImageSides.length) return false;
    return clickableImageSides.every((side) => !!ClickedSideImage(side));
  };

  const handleNextClick = async () => {
    if (!isAllImagesCaptured()) {
      ToastAndroid.show("Please capture all images first", ToastAndroid.SHORT);
      return;
    }
    // Match Expo behavior: navigate to VehicleDetails screen
    // @ts-ignore
    navigation.navigate("VehicleDetails", {
      carId: leadId,
      leadData,
      vehicleType,
    });
  };

  if (isLoading && steps.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {clickableImageSides.length ? (
        <View style={styles.mainContainer}>
          <View style={styles.contentContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.headerContainer}>
                <RNText style={styles.carIdText}>{displayId || leadId}</RNText>
                {/* Offline Mode Indicator */}
                {/* {steps.length > 0 && (
                  <View style={styles.offlineBanner}>
                    <MaterialCommunityIcons name="database-check" size={16} color="#4CAF50" />
                    <RNText style={styles.offlineBannerText}>
                      Offline Mode: {steps.length} steps loaded from cache
                    </RNText>
                  </View>
                )} */}
              </View>

              <View style={styles.videoContainer}>
                <TouchableOpacity
                  style={[
                    styles.videoCard,
                    isVideoRecorded() && styles.videoCardCompleted,
                  ]}
                  onPress={HandleVideoNavigation}
                  activeOpacity={0.7}
                >
                  <RNText style={styles.videoCardText}>Record Video</RNText>
                </TouchableOpacity>
              </View>
              <View style={styles.cardContainer}>
                {!clickableImageSides.length && (
                  <RNText style={styles.noDataText}>No Data Found</RNText>
                )}
                {clickableImageSides?.map((side, index: number) => {
                  const isUnlocked =
                    index === 0 ||
                    clickableImageSides
                      .slice(0, index)
                      .every((prevSide) => !!ClickedSideImage(prevSide));
                  return (
                    <ValuateCard
                      key={side + index}
                      id={leadId}
                      isDone={ClickedSideImage(side)}
                      isClickable={isUnlocked}
                      vehicleType={vehicleType}
                      text={side}
                      appColumn={steps.find(s => s.Name === side)?.Appcolumn || side}
                      isUploading={false}
                      uploadStatus={sideUploadStatus[side]}
                    />
                  );
                })}
                <View style={styles.infoRecordContainer}>
                  <RNText style={styles.infoRecordTitle}>
                    Optional Information Record
                  </RNText>
                  {optionalInfoItems.map((item, index) => {
                    const questionKey = Array.isArray(item.Questions)
                      ? item.Questions.join(',')
                      : (item.Questions || "");
                    return (
                      <Selector
                        key={index + questionKey}
                        keyText={questionKey}
                        valueText={
                          OptionalInfoQuestionAnswer?.[questionKey] || ""
                        }
                        onPress={() => {
                          setOptionalInfoModalState({
                            open: true,
                            Questions: questionKey,
                            Answer: item.Answer || "",
                          });
                        }}
                      />
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
          <View
            style={[
              styles.nextBtnContainer,
              { paddingBottom: insets.bottom },
            ]}
          >
            <TouchableOpacity
              onPress={handleNextClick}
              style={[
                styles.nextBtn,
                isAllImagesCaptured() ? styles.nextBtnEnabled : styles.nextBtnDisabled,
              ]}
              // disabled={!isAllImagesCaptured()} // Removed to allow toast on press
              activeOpacity={0.7}
            >
              <RNText style={styles.nextBtnText}>Next</RNText>
            </TouchableOpacity>
          </View>
          <ConditionModal
            open={showConditionModal}
            sideName={currentSideForCondition}
            questionsData={currentSideQuestionData}
            onSubmit={async ({ selectedAnswer, odometerReading, keyAvailable, chassisPlate }) => {
              if (selectedAnswer) {
                setSideConditions({
                  ...sideConditions,
                  [currentSideForCondition]: selectedAnswer,
                });
              }

              setShowConditionModal(false);

              const step = steps.find(s => s.Name === currentSideForCondition);
              if (!step) return;

              const stepName = (step.Name || '').toLowerCase();
              const isOdometer = stepName.includes('odometer') || stepName.includes('odmeter');
              const isChassisPlate = stepName.includes('chassis plate');

              let payload: any = { LeadId: leadId };

              if (isOdometer) {
                payload = {
                  ...payload,
                  Odometer: odometerReading,
                  LeadFeature: { Keys: keyAvailable },
                };
              } else if (isChassisPlate) {
                payload = {
                  ...payload,
                  LeadList: { ChassisNo: chassisPlate || selectedAnswer },
                };
              } else {
                payload = {
                  ...payload,
                  [step.Appcolumn || step.Name || 'Unknown']: { Value: selectedAnswer },
                };
              }

              try {
                await submitLeadReportApi(payload);
                ToastAndroid.show("Answer submitted successfully", ToastAndroid.SHORT);
              } catch (error: any) {
                console.error("Submit answer error:", error);
                ToastAndroid.show("Failed to submit answer", ToastAndroid.LONG);
              }
            }}
            onClose={() => setShowConditionModal(false)}
          />
          {OptionalInfoModalState.open && (
            <OptionalInfoModal
              open={OptionalInfoModalState.open}
              closeModal={() =>
                setOptionalInfoModalState({
                  ...OptionalInfoModalState,
                  open: false,
                })
              }
              Questions={OptionalInfoModalState.Questions}
              Answers={OptionalInfoModalState.Answer}
              onSubmit={(selectedAnswer) => {
                setOptionalInfoModalState({
                  ...OptionalInfoModalState,
                  open: false,
                });
                setOptionalInfoQuestionAnswer({
                  ...OptionalInfoQuestionAnswer,
                  [OptionalInfoModalState.Questions]: selectedAnswer,
                });
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <RNText style={styles.noDataTextLarge}>No Data Found</RNText>
        </View>
      )}

      {/* Floating Upload Queue Button */}
      {/* {queueCount > 0 && (
        <TouchableOpacity
          style={styles.floatingQueueButton}
          onPress={() => setShowQueueModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="cloud-upload" size={24} color="#fff" />
          <View style={styles.queueBadge}>
            <RNText style={styles.queueBadgeText}>{queueCount}</RNText>
          </View>
        </TouchableOpacity>
      )} */}

      {/* Upload Queue Modal */}
      {/* <UploadQueueStatus
        visible={showQueueModal}
        onClose={() => setShowQueueModal(false)}
      /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    height: "90%",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  carIdText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.Dashboard.text.Grey,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },
  videoContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  videoCard: {
    width: "89%",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: "white",
  },
  videoCardCompleted: {
    backgroundColor: "#ABEB94",
  },
  videoCardText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.Dashboard.text.Grey,
    textAlign: "center",
  },
  cardContainer: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 10,
  },
  card: {
    width: "40%",
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  uploadingText: {
    fontSize: 16,
    color: "#0E4DEF",
    textAlign: "center",
    paddingVertical: 20,
  },
  cardText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.Dashboard.text.Grey,
  },
  capturedContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  checkIcon: {
    marginBottom: 4,
  },
  capturedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
    textAlign: "center",
  },
  retakeIndicator: {
    position: 'absolute',
    bottom: 30,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  retakeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  infoRecordContainer: {
    width: "100%",
    paddingHorizontal: 25,
    marginTop: 20,
  },
  infoRecordTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.Dashboard.text.Grey,
    marginBottom: 12,
    paddingLeft: 8,
  },
  nextBtnContainer: {
    width: "100%",
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  nextBtn: {
    width: "70%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "darkblue",
    opacity: 0.5,
  },
  nextBtnEnabled: {
    backgroundColor: COLORS.Dashboard.text.Grey,
    opacity: 1,
  },
  nextBtnDisabled: {
    backgroundColor: "darkblue",
    opacity: 0.5,
  },
  nextBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.AppTheme.primary,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "80%",
  },
  noDataTextLarge: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.AppTheme.primary,
  },
  // Selector Styles
  selectorContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderRadius: 8,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.AppTheme.primary,
  },
  selectorValue: {
    fontSize: 14,
    color: "#666",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.AppTheme.primary,
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 45,
    textAlignVertical: "center",
    marginBottom: 12,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f0f0f0",
  },
  modalButtonSubmit: {
    backgroundColor: COLORS.AppTheme.primary,
  },
  modalButtonTextCancel: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextSubmit: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  optionsContainer: {
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  optionsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
  },
  optionButtonSelected: {
    backgroundColor: COLORS.AppTheme.primary,
    borderColor: COLORS.AppTheme.primary,
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionButtonTextSelected: {
    color: "#fff",
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  floatingQueueButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  queueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  queueBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ValuationPage;
