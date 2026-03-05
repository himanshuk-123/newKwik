/**
 * ValuationPage — FIXED
 * 
 * Fixes:
 * 1. AppStepListDataRecord import fixed (from store)
 * 2. Lead type inline define kiya (types/leads nahi hai)
 * 3. submitLeadReportApi inline ApiClient se call hogi
 * 4. VideoCamera screen → Camera se handle hoga (VideoCamera nahi hai navigator mein)
 * 5. vehicleType route.params se aata hai (item.vehicle_type_value)
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets,SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { COLORS } from "../constants/Colors";
import { useValuationStore } from "../store/valuation.store";
import type { AppStepListDataRecord } from "../services/types";
import { getAppSteps } from "../services/AppStepService";
import { apiCall } from "../services/ApiClient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import RNFS from 'react-native-fs';
import { uploadQueueManager } from "../services/uploadQueue.manager";
import { getCapturedMediaByLeadId, setTotalCount, updateLeadMetadata } from "../database/valuationProgress.db";
import { select } from "../database/db";
import useQuestions from "../services/useQuestions";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

// ✅ Lead type inline (types/leads file nahi hai)
interface Lead {
  id: string;
  lead_uid: string;
  lead_id: string;
  reg_no: string;
  prospect_no: string;
  customer_name: string;
  customer_mobile: string;
  company_id: string;
  company_name: string;
  vehicle: string;
  vehicle_type_id: string;
  vehicle_type_name: string;
  vehicle_type_value: string;
  state_id: string;
  state_name: string;
  city_id: string;
  city_name: string;
  area_id: string;
  area_name: string;
  chassis_no: string;
  engine_no: string;
  status_id: string;
  yard_name: string;
  appointment_date: string;
  [key: string]: any;
}

interface RouteParams {
  leadId: string;
  displayId?: string;
  vehicleType: string; // ✅ item.vehicle_type_value — "2W", "4W", "CV" etc
  leadData?: Lead;
}

// ─────────────────────────────────────────────────────────────────────────────
// submitLeadReportApi — ApiClient ka apiCall use karta hai (correct BASE_URL)
// ─────────────────────────────────────────────────────────────────────────────

const submitLeadReportApi = async (payload: any): Promise<{ ERROR: string; MESSAGE: string }> => {
  const tokenRows = await select<{ token: string }>('SELECT token FROM users LIMIT 1');
  const token = tokenRows[0]?.token ?? '';
  return apiCall<{ ERROR: string; MESSAGE: string }>('LeadReportDataCreateedit', token, {
    Version: '2',
    ...payload,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// ICON MAPPING
// ─────────────────────────────────────────────────────────────────────────────

const getCardIcon = (cardName: string): { name: string; color: string } => {
  const n = cardName?.toLowerCase().trim() || '';
  if (n.includes('odmeter') || n.includes('odometer')) return { name: 'speedometer', color: '#FF6B6B' };
  if (n.includes('dashboard')) return { name: 'view-dashboard', color: '#4ECDC4' };
  if (n.includes('interior back')) return { name: 'car-seat-heater', color: '#95E1D3' };
  if (n.includes('interior')) return { name: 'car-seat', color: '#45B7D1' };
  if (n.includes('engine')) return { name: 'engine-outline', color: '#F38181' };
  if (n.includes('chassis imprint')) return { name: 'stamper', color: '#AA96DA' };
  if (n.includes('chassis plate')) return { name: 'card-text-outline', color: '#FCBAD3' };
  if (n.includes('chassis')) return { name: 'barcode-scan', color: '#A8E6CF' };
  if (n.includes('front side')) return { name: 'car-front', color: '#4A90E2' };
  if (n.includes('right side')) return { name: 'car-side', color: '#50C878' };
  if (n.includes('back side') || n.includes('rear')) return { name: 'car-back', color: '#FFB347' };
  if (n.includes('left side')) return { name: 'car-side', color: '#FF6F91' };
  if (n.includes('front right tyre')) return { name: 'tire', color: '#5DADE2' };
  if (n.includes('rear right tyre')) return { name: 'tire', color: '#AF7AC5' };
  if (n.includes('rear left tyre')) return { name: 'tire', color: '#F39C12' };
  if (n.includes('front left tyre')) return { name: 'tire', color: '#52BE80' };
  if (n.includes('tyre') || n.includes('tire')) return { name: 'car-tire-alert', color: '#566573' };
  if (n.includes('selfie')) return { name: 'account-circle', color: '#E74C3C' };
  if (n.includes('rc front')) return { name: 'file-document-edit', color: '#3498DB' };
  if (n.includes('rc back')) return { name: 'file-document-edit-outline', color: '#9B59B6' };
  if (n.includes('rc')) return { name: 'file-certificate-outline', color: '#1ABC9C' };
  if (n.includes('optional')) return { name: 'camera-plus-outline', color: '#95A5A6' };
  if (n.includes('video')) return { name: 'video-outline', color: '#E67E22' };
  return { name: 'camera-outline', color: '#7F8C8D' };
};

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

interface SelectorProps { keyText: string; valueText: string; onPress: () => void; }
const Selector = ({ keyText, valueText, onPress }: SelectorProps) => (
  <TouchableOpacity style={styles.selectorContainer} onPress={onPress}>
    <RNText style={styles.selectorLabel}>{keyText}</RNText>
    <RNText style={styles.selectorValue}>{valueText || "Select..."}</RNText>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────────────────────
// CONDITION MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface ConditionModalProps {
  open: boolean;
  sideName: string;
  questionsData: AppStepListDataRecord | null;
  onSubmit: (payload: { selectedAnswer?: string; odometerReading?: string; keyAvailable?: string; chassisPlate?: string; }) => void;
  onClose: () => void;
}

const ConditionModal = ({ open, sideName, questionsData, onSubmit, onClose }: ConditionModalProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [keyAvailable, setKeyAvailable] = useState("");
  const [chassisPlate, setChassisPlate] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedAnswer(""); setOdometerReading(""); setKeyAvailable(""); setChassisPlate("");
    }
  }, [open]);

  if (!questionsData) return null;

  const stepName = (questionsData.Name || '').toLowerCase();
  const isOdometer = stepName.includes('odometer') || stepName.includes('odmeter');
  const isChassisPlate = stepName.includes('chassis plate');

  // ── Questions "~" separated → array, Answer "~" per-question, "/" per-option ──
  const questionsList = (questionsData.Questions || '').split('~').map(q => q.trim()).filter(Boolean);
  const hasQuestions = questionsList.length > 0;

  // Answer bhi "~" se split → per-question answer sets, phir "/" se options
  const answerSets = (questionsData.Answer || '').split('~');
  // e.g. Odometer: answerSets = ["", "Available/Not Available"]
  // e.g. Front Side: answerSets = ["Good/Average/Bad/Damaged"]
  const firstOptions = (answerSets[0] || '').split('/').map(i => i.trim()).filter(Boolean);
  const secondOptions = answerSets.length > 1
    ? (answerSets[1] || '').split('/').map(i => i.trim()).filter(Boolean)
    : [];

  const handleSubmit = () => {
    if (!hasQuestions) { onSubmit({}); onClose(); return; }
    if (isOdometer) {
      if (!odometerReading.trim() || !keyAvailable.trim()) {
        ToastAndroid.show("Please enter odometer and select key availability", ToastAndroid.SHORT); return;
      }
      onSubmit({ odometerReading, keyAvailable, selectedAnswer: selectedAnswer || odometerReading });
      setOdometerReading(""); setKeyAvailable(""); setSelectedAnswer(""); onClose(); return;
    }
    if (isChassisPlate) {
      if (!chassisPlate.trim()) { ToastAndroid.show("Please enter chassis plate", ToastAndroid.SHORT); return; }
      onSubmit({ chassisPlate: chassisPlate.trim(), selectedAnswer: chassisPlate.trim() });
      setChassisPlate(""); onClose(); return;
    }
    if (!selectedAnswer.trim()) { ToastAndroid.show("Please select an option", ToastAndroid.SHORT); return; }
    onSubmit({ selectedAnswer }); setSelectedAnswer(""); onClose();
  };

  const isSubmitDisabled = hasQuestions && (
    (isOdometer && (!odometerReading.trim() || !keyAvailable.trim())) ||
    (isChassisPlate && !chassisPlate.trim()) ||
    (!isOdometer && !isChassisPlate && !selectedAnswer)
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <RNText style={styles.modalTitle}>
              {hasQuestions ? questionsList[0] : "Image Captured"}
            </RNText>
            <RNText style={styles.modalSubtitle}>For: {sideName}</RNText>
            {hasQuestions ? (
              <>
                {/* ── ODOMETER: text input + key availability ── */}
                {isOdometer && (
                  <>
                    <RNText style={styles.optionsLabel}>{questionsList[0]}</RNText>
                    <TextInput style={styles.modalInput} placeholder="Odometer Reading" placeholderTextColor="#999" keyboardType="numeric" value={odometerReading} onChangeText={(v) => { setOdometerReading(v); setSelectedAnswer(v); }} />
                    {questionsList.length >= 2 && (
                      <>
                        <RNText style={styles.optionsLabel}>{questionsList[1]}</RNText>
                        <View style={styles.optionsContainer}>
                          {(secondOptions.length ? secondOptions : ['Available', 'Not Available']).map(opt => (
                            <TouchableOpacity key={opt} style={[styles.optionButton, keyAvailable === opt && styles.optionButtonSelected]} onPress={() => setKeyAvailable(opt)} activeOpacity={0.7}>
                              <RNText style={[styles.optionButtonText, keyAvailable === opt && styles.optionButtonTextSelected]}>{opt}</RNText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}

                {/* ── CHASSIS PLATE: text input ── */}
                {isChassisPlate && (
                  <>
                    <RNText style={styles.optionsLabel}>{questionsList[0]}</RNText>
                    <TextInput style={styles.modalInput} placeholder="Chassis Plate" placeholderTextColor="#999" value={chassisPlate} onChangeText={setChassisPlate} />
                  </>
                )}

                {/* ── REGULAR CONDITION: option buttons ── */}
                {!isOdometer && !isChassisPlate && (
                  <>
                    <RNText style={styles.optionsLabel}>Select an option:</RNText>
                    <View style={styles.optionsContainer}>
                      {firstOptions.map((answer: string, idx: number) => (
                        <TouchableOpacity key={idx} style={[styles.optionButton, selectedAnswer === answer && styles.optionButtonSelected]} onPress={() => setSelectedAnswer(answer)} activeOpacity={0.7}>
                          <RNText style={[styles.optionButtonText, selectedAnswer === answer && styles.optionButtonTextSelected]}>{answer}</RNText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </>
            ) : (
              <RNText style={styles.optionsLabel}>✓ Image captured successfully.</RNText>
            )}
          </ScrollView>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onClose}>
              <RNText style={styles.modalButtonTextCancel}>Cancel</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSubmit, isSubmitDisabled && styles.modalButtonDisabled]} onPress={handleSubmit} disabled={isSubmitDisabled}>
              <RNText style={styles.modalButtonTextSubmit}>{hasQuestions ? 'Submit' : 'OK'}</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL INFO MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface OptionalInfoModalProps { open: boolean; closeModal: () => void; Questions: string; Answers: string; onSubmit: (answer: string) => void; }
const OptionalInfoModal = ({ open, closeModal, Questions, Answers, onSubmit }: OptionalInfoModalProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const options = (Answers || "").replaceAll("~", "/").split("/").map(i => i.trim()).filter(Boolean);
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <RNText style={styles.modalTitle}>{Questions}</RNText>
          <RNText style={styles.modalSubtitle}>Select an option</RNText>
          <View style={styles.optionsContainer}>
            {options.map((opt, idx) => (
              <TouchableOpacity key={idx} style={[styles.optionButton, selectedAnswer === opt && styles.optionButtonSelected]} onPress={() => setSelectedAnswer(opt)} activeOpacity={0.7}>
                <RNText style={[styles.optionButtonText, selectedAnswer === opt && styles.optionButtonTextSelected]}>{opt}</RNText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={closeModal}>
              <RNText style={styles.modalButtonTextCancel}>Cancel</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSubmit, !selectedAnswer && styles.modalButtonDisabled]} onPress={() => { if (!selectedAnswer) return; onSubmit(selectedAnswer); setSelectedAnswer(""); }} disabled={!selectedAnswer}>
              <RNText style={styles.modalButtonTextSubmit}>Submit</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VALUATE CARD
// ─────────────────────────────────────────────────────────────────────────────

const ValuateCard = ({
  text, isDone, id, vehicleType, isClickable, appColumn, isUploading, uploadStatus,
}: {
  text: string; id: string; vehicleType: string;
  isDone?: string; isClickable?: boolean; appColumn?: string;
  isUploading?: boolean; uploadStatus?: 'pending' | 'uploaded' | 'failed';
}) => {
  const navigation = useNavigation();
  const icon = getCardIcon(text);

  const handleClick = () => {
    if (!isClickable && !isDone) {
      ToastAndroid.show("Please complete previous steps first", ToastAndroid.SHORT);
      return;
    }
    const isSelfie = text.toLowerCase().includes('selfie');
    // @ts-ignore
    navigation.navigate("Camera", {
      id,
      side: text,
      vehicleType,
      appColumn: appColumn || text.replace(/\s/g, ''),
      useFrontCamera: isSelfie,
    });
  };

  const bgColor = (isDone || uploadStatus === 'uploaded') ? "#ABEB94" : "white";

  return (
    <TouchableOpacity
      onPress={handleClick}
      style={[styles.card, { backgroundColor: bgColor }, !isClickable && !isDone && styles.cardDisabled]}
      activeOpacity={isClickable || isDone ? 0.7 : 1}
      disabled={!isClickable && !isDone}
    >
      {isUploading ? (
        <RNText style={styles.uploadingText}>Uploading...</RNText>
      ) : isDone ? (
        <>
          <Image style={styles.cardImage} source={{ uri: isDone }} resizeMode="cover" />
        </>
      ) : uploadStatus === 'uploaded' ? (
        <View style={styles.capturedContainer}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#4CAF50" />
          <RNText style={styles.capturedText}>Captured</RNText>
        </View>
      ) : (
        <MaterialCommunityIcons name={icon.name} size={40} color={icon.color} style={styles.cardIcon} />
      )}
      <RNText style={styles.cardText}>{text}</RNText>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ValuationPage = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { getSideQuestion } = useQuestions();

  const { leadId, displayId, vehicleType, leadData } = route.params as RouteParams;

  // ── Store sirf sideUploads ke liye (Camera ↔ ValuationPage shared state) ──
  const { sideUploads, getSideUpload, markLocalCaptured, reset } = useValuationStore();

  // ── Steps local state (direct DB read, no store) ──
  const [steps, setSteps] = useState<AppStepListDataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [optionalInfoModalState, setOptionalInfoModalState] = useState({ open: false, Questions: "", Answer: "" });
  const [optionalInfoQuestionAnswer, setOptionalInfoQuestionAnswer] = useState<Record<string, string>>({});
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [currentSideForCondition, setCurrentSideForCondition] = useState("");
  const [currentSideQuestionData, setCurrentSideQuestionData] = useState<AppStepListDataRecord | null>(null);
  const [sideConditions, setSideConditions] = useState<Record<string, string>>({});
  const [sideUploadStatus, setSideUploadStatus] = useState<Record<string, 'pending' | 'uploaded' | 'failed'>>({});
  const [lastProcessedSide, setLastProcessedSide] = useState("");
  const processedSidesRef = useRef<Record<string, boolean>>({});

  // ── Init: DB se steps load karo ────────────────────────────────────────────

  useEffect(() => {
    if (vehicleType) {
      console.log('[ValuationPage] Loading steps for:', vehicleType);
      setIsLoading(true);
      getAppSteps(vehicleType)
        .then(data => {
          setSteps(data || []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('[ValuationPage] Failed to load steps:', err);
          setSteps([]);
          setIsLoading(false);
        });
    }
    processedSidesRef.current = {};
    setLastProcessedSide("");
    return () => reset();
  }, [vehicleType]);

  // ── Load captured media from DB ───────────────────────────────────────────

  const loadCapturedMedia = useCallback(async () => {
    if (!leadId) return;
    try {
      const captured = await getCapturedMediaByLeadId(leadId.toString());
      if (!captured.length) return;

      // Pre-mark ALL as processed to prevent stale modals
      for (const item of captured) {
        if (item.side) processedSidesRef.current[item.side] = true;
      }

      const statusMap: Record<string, 'pending' | 'uploaded' | 'failed'> = {};
      for (const item of captured) {
        if (!item.side || !item.localUri) continue;
        const filePath = item.localUri.replace('file://', '');
        const fileExists = await RNFS.exists(filePath);
        if (fileExists) {
          markLocalCaptured(item.side, item.localUri);
          statusMap[item.side] = item.uploadStatus;
        }
      }
      setSideUploadStatus(statusMap);
    } catch (e) {
      console.error('[ValuationPage] loadCapturedMedia failed:', e);
    }
  }, [leadId, markLocalCaptured]);

  useFocusEffect(useCallback(() => { loadCapturedMedia(); }, [loadCapturedMedia]));

  // ── Upload queue subscription ─────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = uploadQueueManager.subscribe(() => {});
    return unsubscribe;
  }, []);

  // ── Watch for new captures → show condition modal ─────────────────────────

  useEffect(() => {
    if (!sideUploads?.length) return;

    const lastUpload = sideUploads[sideUploads.length - 1];
    if (!lastUpload) return;

    const isNew = lastUpload.side !== lastProcessedSide && !processedSidesRef.current[lastUpload.side];
    if (!isNew) return;

    const stepData = steps.find(s => (s.Name || '').toLowerCase().trim() === lastUpload.side.toLowerCase().trim());
    if (!stepData) {
      processedSidesRef.current[lastUpload.side] = true;
      setLastProcessedSide(lastUpload.side);
      return;
    }

    const questionData = getSideQuestion({ data: steps, vehicleType, nameInApplication: stepData.Name || lastUpload.side });

    setCurrentSideForCondition(lastUpload.side);
    setCurrentSideQuestionData(questionData || stepData);
    setShowConditionModal(true);
    processedSidesRef.current[lastUpload.side] = true;
    setLastProcessedSide(lastUpload.side);
  }, [sideUploads?.length, steps, getSideQuestion, vehicleType, lastProcessedSide]);

  // ── Metadata update ───────────────────────────────────────────────────────

  const clickableImageSides = useMemo(() => {
    if (!steps?.length) return [];
    return steps.filter(s => s.Images !== false).map(s => s.Name || "");
  }, [steps]);

  const optionalInfoItems = useMemo(() => {
    if (!steps?.length) return [];
    return steps.filter(s => s.Images === false);
  }, [steps]);

  useEffect(() => {
    if (!leadId || !clickableImageSides.length) return;
    setTotalCount(leadId.toString(), clickableImageSides.length).catch(console.error);
    updateLeadMetadata(leadId.toString(), {
      regNo: leadData?.reg_no?.toUpperCase() || displayId || '',
      prospectNo: leadData?.prospect_no || '',
      vehicleType: vehicleType || '',
    }).catch(console.error);
  }, [leadId, clickableImageSides.length, vehicleType]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getClickedImage = (side: string) => getSideUpload(side)?.localUri || "";
  const isVideoRecorded = () => !!getSideUpload('Video')?.localUri;
  const isAllImagesCaptured = () => clickableImageSides.length > 0 && clickableImageSides.every(s => !!getClickedImage(s));

  const handleNextClick = () => {
    // if (!isAllImagesCaptured()) {
    //   ToastAndroid.show("Please capture all images first", ToastAndroid.SHORT);
    //   return;
    // }
    // @ts-ignore
    navigation.navigate("VehicleDetails", { carId: leadId, leadData, vehicleType });
  };

  // ✅ Video — Camera screen pe redirect (VideoCamera screen nahi hai navigator mein)
  const handleVideoNavigation = () => {
    // @ts-ignore
    navigation.navigate("VideoRecorder", {
      id: leadId,
      side: "Video",
      vehicleType,
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

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
              </View>

              {/* VIDEO */}
              <View style={styles.videoContainer}>
                <TouchableOpacity
                  style={[styles.videoCard, isVideoRecorded() && styles.videoCardCompleted]}
                  onPress={handleVideoNavigation}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="video-outline" size={28} color={isVideoRecorded() ? "#2E7D32" : COLORS.AppTheme.primary} style={{ marginBottom: 6 }} />
                  <RNText style={styles.videoCardText}>Record Video</RNText>
                </TouchableOpacity>
              </View>

              {/* IMAGE CARDS */}
              <View style={styles.cardContainer}>
                {clickableImageSides.map((side, index) => {
                  const isUnlocked = index === 0 || clickableImageSides.slice(0, index).every(prev => !!getClickedImage(prev));
                  return (
                    <ValuateCard
                      key={side + index}
                      id={leadId}
                      isDone={getClickedImage(side)}
                      isClickable={isUnlocked}
                      vehicleType={vehicleType}
                      text={side}
                      appColumn={steps.find(s => s.Name === side)?.Appcolumn || side}
                      isUploading={false}
                      uploadStatus={sideUploadStatus[side]}
                    />
                  );
                })}

                {/* OPTIONAL INFO */}
                {optionalInfoItems.length > 0 && (
                  <View style={styles.infoRecordContainer}>
                    <RNText style={styles.infoRecordTitle}>Optional Information Record</RNText>
                    {optionalInfoItems.map((item, index) => {
                      const qKey = item.Questions || "";
                      return (
                        <Selector
                          key={index + qKey}
                          keyText={qKey}
                          valueText={optionalInfoQuestionAnswer?.[qKey] || ""}
                          onPress={() => setOptionalInfoModalState({ open: true, Questions: qKey, Answer: item.Answer || "" })}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>

          {/* NEXT BUTTON */}
          <View style={[styles.nextBtnContainer, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity onPress={handleNextClick} style={[styles.nextBtn, isAllImagesCaptured() ? styles.nextBtnEnabled : styles.nextBtnDisabled]} activeOpacity={0.7}>
              <RNText style={styles.nextBtnText}>Next</RNText>
            </TouchableOpacity>
          </View>

          {/* CONDITION MODAL */}
          <ConditionModal
            open={showConditionModal}
            sideName={currentSideForCondition}
            questionsData={currentSideQuestionData}
            onSubmit={async ({ selectedAnswer, odometerReading, keyAvailable, chassisPlate }) => {
              if (selectedAnswer) {
                setSideConditions(prev => ({ ...prev, [currentSideForCondition]: selectedAnswer }));
              }
              setShowConditionModal(false);

              const step = steps.find(s => s.Name === currentSideForCondition);
              if (!step) return;

              const stepName = (step.Name || '').toLowerCase();
              let payload: any = { LeadId: leadId };

              if (stepName.includes('odometer') || stepName.includes('odmeter')) {
                payload = { ...payload, Odometer: odometerReading, LeadFeature: { Keys: keyAvailable } };
              } else if (stepName.includes('chassis plate')) {
                payload = { ...payload, LeadList: { ChassisNo: chassisPlate || selectedAnswer } };
              } else {
                payload = { ...payload, [step.Appcolumn || step.Name || 'Unknown']: { Value: selectedAnswer } };
              }

              try {
                await submitLeadReportApi(payload);
                ToastAndroid.show("Answer submitted", ToastAndroid.SHORT);
              } catch (e) {
                console.error('[ValuationPage] submitLeadReport failed:', e);
                ToastAndroid.show("Failed to submit answer", ToastAndroid.LONG);
              }
            }}
            onClose={() => setShowConditionModal(false)}
          />

          {/* OPTIONAL INFO MODAL */}
          <OptionalInfoModal
            open={optionalInfoModalState.open}
            closeModal={() => setOptionalInfoModalState(prev => ({ ...prev, open: false }))}
            Questions={optionalInfoModalState.Questions}
            Answers={optionalInfoModalState.Answer}
            onSubmit={(answer) => {
              setOptionalInfoModalState(prev => ({ ...prev, open: false }));
              setOptionalInfoQuestionAnswer(prev => ({ ...prev, [optionalInfoModalState.Questions]: answer }));
            }}
          />
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
          ) : (
            <RNText style={styles.noDataTextLarge}>No Data Found</RNText>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default ValuationPage;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, backgroundColor: "white", justifyContent: "center", alignItems: "center" },
  mainContainer: { flex: 1, backgroundColor: "white" },
  contentContainer: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerContainer: { alignItems: "center", paddingTop: 20 },
  carIdText: { fontSize: 24, fontWeight: "600", color: COLORS.Dashboard.text.Grey },
  videoContainer: { width: "100%", alignItems: "center", paddingTop: 20, paddingHorizontal: 20 },
  videoCard: { width: "89%", padding: 20, borderRadius: 10, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, backgroundColor: "white" },
  videoCardCompleted: { backgroundColor: "#ABEB94" },
  videoCardText: { fontSize: 16, fontWeight: "600", color: COLORS.Dashboard.text.Grey, textAlign: "center" },
  cardContainer: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 20, justifyContent: "center", alignItems: "center", paddingTop: 20, paddingBottom: 40, paddingHorizontal: 10 },
  card: { width: "40%", minHeight: 120, justifyContent: "center", alignItems: "center", borderRadius: 10, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  cardImage: { width: "100%", height: 80, borderRadius: 8, marginBottom: 8 },
  cardIcon: { marginBottom: 8 },
  cardDisabled: { opacity: 0.5 },
  uploadingText: { fontSize: 16, color: "#0E4DEF", textAlign: "center", paddingVertical: 20 },
  cardText: { textAlign: "center", fontSize: 14, fontWeight: "600", color: COLORS.Dashboard.text.Grey },
  capturedContainer: { justifyContent: "center", alignItems: "center", gap: 4 },
  capturedText: { fontSize: 12, fontWeight: "600", color: "#4CAF50", textAlign: "center" },
  retakeIndicator: { position: 'absolute', bottom: 30, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  retakeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  infoRecordContainer: { width: "100%", paddingHorizontal: 25, marginTop: 20 },
  infoRecordTitle: { fontSize: 16, fontWeight: "600", color: COLORS.Dashboard.text.Grey, marginBottom: 12, paddingLeft: 8 },
  nextBtnContainer: { width: "100%", height: 80, justifyContent: "center", alignItems: "center" },
  nextBtn: { width: "70%", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  nextBtnEnabled: { backgroundColor: COLORS.Dashboard.text.Grey, opacity: 1 },
  nextBtnDisabled: { backgroundColor: "darkblue", opacity: 0.5 },
  nextBtnText: { color: "white", fontSize: 16, fontWeight: "600" },
  noDataContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noDataTextLarge: { fontSize: 24, fontWeight: "600", color: COLORS.AppTheme.primary },
  selectorContainer: { paddingVertical: 15, paddingHorizontal: 15, backgroundColor: COLORS.Dashboard.bg.Grey, borderRadius: 8, marginVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectorLabel: { fontSize: 14, fontWeight: "600", color: COLORS.AppTheme.primary },
  selectorValue: { fontSize: 14, color: "#666" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 15, width: "100%", maxWidth: 420, maxHeight: "80%" },
  modalScrollContent: { paddingBottom: 10 },
  modalTitle: { fontSize: 16, fontWeight: "600", color: COLORS.AppTheme.primary, marginBottom: 5 },
  modalSubtitle: { fontSize: 13, color: "#666", marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 14, height: 45, textAlignVertical: "center", marginBottom: 12 },
  modalButtonContainer: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  modalButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  modalButtonCancel: { backgroundColor: "#f0f0f0" },
  modalButtonSubmit: { backgroundColor: COLORS.AppTheme.primary },
  modalButtonTextCancel: { color: "#666", fontSize: 16, fontWeight: "600" },
  modalButtonTextSubmit: { color: "#fff", fontSize: 16, fontWeight: "600" },
  optionsContainer: { gap: 8, marginTop: 8, marginBottom: 12 },
  optionsLabel: { fontSize: 13, fontWeight: "600", color: "#666", marginTop: 10, marginBottom: 8 },
  optionButton: { backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: "center", borderWidth: 2, borderColor: "#ddd" },
  optionButtonSelected: { backgroundColor: COLORS.AppTheme.primary, borderColor: COLORS.AppTheme.primary },
  optionButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  optionButtonTextSelected: { color: "#fff" },
  modalButtonDisabled: { opacity: 0.5 },
});