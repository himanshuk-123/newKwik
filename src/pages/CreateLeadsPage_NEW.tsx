import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text as RNText,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TextInput,
  FlatList,
  Modal,
  BackHandler,
  ToastAndroid,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/Colors";
import { useCreateLeadStore } from "../features/createLead/createLead.store";

// ============ TYPE DEFINITIONS ============

type DisplayProps = {
  value: number;
  text: string;
  icon: string;
  color: "Grey" | "Orange" | "Blue" | "Green";
  redirectTo?: string;
};

interface CustomInputProps {
  isNumeric?: boolean;
  maxLength?: number;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

interface SelectorProps {
  keyText: string;
  valueText: string;
  onPress: () => void;
  disabled?: boolean;
}

// ============ COMPONENTS ============

const CustomInput = ({
  isNumeric,
  maxLength,
  placeholder,
  value,
  onChangeText,
  autoCapitalize = 'none',
}: CustomInputProps) => {
  return (
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={onChangeText}
      keyboardType={isNumeric ? "numeric" : "default"}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
    />
  );
};

const Selector = ({ keyText, valueText, onPress, disabled }: SelectorProps) => {
  return (
    <TouchableOpacity
      style={[styles.selectorContainer, disabled && styles.disabledSelector]}
      onPress={() => {
        console.log('[Selector] Pressed:', keyText, 'disabled:', disabled);
        if (!disabled) onPress();
      }}
      disabled={disabled}
    >
      <RNText style={styles.selectorLabel}>{keyText}</RNText>
      <RNText style={styles.selectorValue}>
        {valueText || "Select..."}
      </RNText>
    </TouchableOpacity>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  style?: any;
}

const Layout = ({ children, style }: LayoutProps) => {
  return (
    <SafeAreaView style={[styles.layoutContainer, style]}>
      <ScrollView
        contentContainerStyle={styles.layoutContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
};

// ============ MAIN SCREEN ============

const CreateLeads = () => {
  const navigation = useNavigation<any>();
  const [showModal, setShowModal] = useState(false);
  const [filterData, setFilterData] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Local state for modal to handle dynamic lists
  const [bottomSheetData, setBottomSheetData] = useState<{
    key: string;
    value: Array<{ id: number; name: string }>;
  }>({ key: "", value: [] });

  // Get store data and methods
  const {
    formData,
    dropdowns,
    isLoading,
    error,
    successMessage,
    initialize,
    reset,
    setField,
    fetchVehicleTypesForCompany,
    fetchYardsForState,
    fetchClientCitiesForState,
    fetchAreasForCity,
    submit
  } = useCreateLeadStore();

  // Initialize on Mount
  useFocusEffect(
    useCallback(() => {
      console.log('[CreateLeads-UI] 🚀 Page focused, initializing store...');
      initialize();
      return () => {
        console.log('[CreateLeads-UI] 🔄 Page unfocused, resetting...');
        reset();
      };
    }, [initialize, reset])
  );

  // Debug: Log dropdowns when they change
  useEffect(() => {
    console.log('[CreateLeads-UI] 📊 Dropdowns updated:', {
      companies: dropdowns.companies.length,
      states: dropdowns.states.length,
      vehicleTypes: dropdowns.vehicleTypes.length,
      yards: dropdowns.yards.length,
    });
  }, [dropdowns]);

  // Handle Success/Error Messages
  useEffect(() => {
    if (error) {
      ToastAndroid.show(error, ToastAndroid.LONG);
    }
    if (successMessage) {
      ToastAndroid.show(successMessage, ToastAndroid.LONG);
      // Go back to Dashboard after successful submission
      setTimeout(() => {
        (navigation as any).goBack();
      }, 1000);
    }
  }, [error, successMessage, navigation]);

  // Modal Handlers
  const handlePresentModalPress = useCallback(() => setShowModal(true), []);
  const handleCloseModalPress = useCallback(() => {
    setShowModal(false);
    setFilterData("");
  }, []);

  // Get options with proper typing
  const getOptionsByKey = useCallback((key: string): Array<{ id: number; name: string }> => {
    switch (key) {
      case "clientName":
        return dropdowns.companies;
      case "vehicleType":
        return dropdowns.vehicleTypes;
      case "clientCity":
        return dropdowns.clientCities;
      case "customerState":
        return dropdowns.states;
      case "yardName":
        return dropdowns.yards;
      case "customerCity":
        return dropdowns.customerCities;
      case "customerArea":
        return dropdowns.areas;
      case "vehicleCategory":
        // Vehicle categories are static
        return [
          { id: 1, name: "2W" },
          { id: 2, name: "3W" },
          { id: 3, name: "4W" },
          { id: 4, name: "FE" },
          { id: 5, name: "CV" },
          { id: 6, name: "CE" },
        ];
      default:
        return [];
    }
  }, [dropdowns]);

  // Back handler for modal
  useEffect(() => {
    const backAction = () => {
      if (showModal) {
        handleCloseModalPress();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [showModal, handleCloseModalPress]);

  // Handle dropdown selection
  const handleSelectItem = useCallback(async (key: string, selectedOption: { id: number; name: string }) => {
    try {
      switch (key) {
        case "clientName":
          setField("clientName", selectedOption.name);
          setField("clientNameId", selectedOption.id);
          // Load vehicle types for this company
          await fetchVehicleTypesForCompany(selectedOption.id);
          break;

        case "vehicleType":
          setField("vehicleType", selectedOption.name);
          setField("vehicleTypeId", selectedOption.id);
          break;

        case "vehicleCategory":
          setField("vehicleCategory", selectedOption.name);
          break;

        case "clientCity":
          setField("clientCity", selectedOption.name);
          setField("clientCityId", selectedOption.id);
          break;

        case "customerState":
          setField("customerState", selectedOption.name);
          setField("customerStateId", selectedOption.id);
          // Load cities and yards for this state
          await Promise.all([
            fetchClientCitiesForState(selectedOption.id),
            fetchYardsForState(selectedOption.id),
          ]);
          break;

        case "yardName":
          setField("yardName", selectedOption.name);
          setField("yardId", selectedOption.id);
          break;

        case "customerCity":
          setField("customerCity", selectedOption.name);
          setField("customerCityId", selectedOption.id);
          // Load areas for this city
          await fetchAreasForCity(selectedOption.id);
          break;

        case "customerArea":
          setField("customerArea", selectedOption.name);
          setField("customerAreaId", selectedOption.id);
          break;
      }

      handleCloseModalPress();
    } catch (error) {
      console.error('[CreateLeads] Error selecting item:', error);
      ToastAndroid.show("Error loading data", ToastAndroid.SHORT);
    }
  }, [setField, fetchVehicleTypesForCompany, fetchClientCitiesForState, fetchYardsForState, fetchAreasForCity, handleCloseModalPress]);

  // Open selection modal
  const openSelection = (key: string) => {
    console.log('[CreateLeads-UI] 🔍 Opening selection modal for key:', key);
    const list = getOptionsByKey(key);
    console.log('[CreateLeads-UI] 📊 Data available for', key, ':', list.length, 'items');
    
    setBottomSheetData({ key, value: [] });
    setPendingKey(key);
    setIsModalLoading(true);
    setFilterData("");
    handlePresentModalPress();
    console.log('[CreateLeads-UI] ✅ Modal should be visible now');
  };

  // Load modal data once pendingKey is set
  useEffect(() => {
    if (!pendingKey) return;
    console.log('[CreateLeads-UI] 📋 Loading data for pendingKey:', pendingKey);
    const list = getOptionsByKey(pendingKey);
    console.log('[CreateLeads-UI] 📝 Got list with', list.length, 'items, isLoading:', isLoading);
    
    if (list.length > 0 && !isLoading) {
      console.log('[CreateLeads-UI] ✅ Setting bottom sheet data');
      setBottomSheetData({ key: pendingKey, value: list });
      setPendingKey(null);
      setIsModalLoading(false);
    } else if (!isLoading) {
      console.log('[CreateLeads-UI] ⚠️ No data available for', pendingKey, ', list.length:', list.length, ', isLoading:', isLoading);
      setPendingKey(null);
      setIsModalLoading(false);
      ToastAndroid.show("No data available for " + pendingKey, ToastAndroid.SHORT);
    }
  }, [pendingKey, isLoading, getOptionsByKey]);

  // Form submission handler
  const HandleSubmit = () => {
    const isRepo = formData.vehicleType.toLowerCase() === "repo";

    // Validate mandatory fields
    if (!formData.clientName || !formData.vehicleType || !formData.registrationNumber || !formData.customerName || !formData.customerMobile) {
      ToastAndroid.show("Please fill mandatory fields", ToastAndroid.SHORT);
      return;
    }

    // Validate registration number
    if (formData.registrationNumber.length < 8) {
      ToastAndroid.show("Invalid Registration Number", ToastAndroid.SHORT);
      return;
    }

    // Validate mobile number
    if (formData.customerMobile.length !== 10) {
      ToastAndroid.show("Mobile number must be 10 digits", ToastAndroid.SHORT);
      return;
    }

    // Validate mobile first digit
    const firstDigit = parseInt(formData.customerMobile[0]);
    if (firstDigit < 6) {
      ToastAndroid.show("Mobile number should start with 6-9", ToastAndroid.SHORT);
      return;
    }

    // Repo-specific validations
    if (isRepo && (!formData.yardName || !formData.chassisNo)) {
      ToastAndroid.show("Yard Name and Chassis No are required for Repo", ToastAndroid.SHORT);
      return;
    }

    // Retail-specific validations
    if (!isRepo && (!formData.customerState || !formData.customerCity)) {
      ToastAndroid.show("State and City are required for Retail", ToastAndroid.SHORT);
      return;
    }

    // Submit via store
    submit().catch(() => {
      // Error is already handled by store
    });
  };

  return (
    <>
      <Layout style={styles.layoutStyle}>
        {isLoading && <ActivityIndicator size="small" color={COLORS.AppTheme.primary} style={{ alignSelf: 'center', marginBottom: 10 }} />}

        {/* Client Name */}
        <Selector
          keyText="Client Name"
          valueText={formData.clientName}
          onPress={() => openSelection("clientName")}
        />

        <View style={styles.divider} />

        {/* Vehicle Type */}
        <Selector
          keyText="Vehicle Type"
          valueText={formData.vehicleType}
          onPress={() => openSelection("vehicleType")}
          disabled={!formData.clientName}
        />

        <View style={styles.divider} />

        {/* Vehicle Category */}
        <Selector
          keyText="Vehicle Category"
          valueText={formData.vehicleCategory}
          onPress={() => openSelection("vehicleCategory")}
        />

        <View style={styles.divider} />

        {/* Client City */}
        <Selector
          keyText="Client City"
          valueText={formData.clientCity}
          onPress={() => openSelection("clientCity")}
        />

        <View style={styles.divider} />

        {/* Registration Number */}
        <CustomInput
          placeholder="Registration Number"
          value={formData.registrationNumber}
          maxLength={11}
          autoCapitalize="characters"
          onChangeText={(value) => setField("registrationNumber", value.toUpperCase())}
        />

        {/* Chassis Number (Repo Only) */}
        {formData.vehicleType.toLowerCase() === "repo" && (
          <>
            <View style={styles.spacer} />
            <CustomInput
              placeholder="Chassis Number"
              value={formData.chassisNo}
              autoCapitalize="characters"
              onChangeText={(value) => setField("chassisNo", value.toUpperCase())}
            />
          </>
        )}

        <View style={styles.spacer} />

        {/* Prospect Number */}
        <CustomInput
          placeholder="Prospect Number"
          value={formData.prospectNumber}
          autoCapitalize="characters"
          onChangeText={(value) => setField("prospectNumber", value.toUpperCase())}
        />

        <View style={styles.spacer} />

        {/* Customer Name */}
        <CustomInput
          placeholder="Customer Name"
          value={formData.customerName}
          autoCapitalize="words"
          onChangeText={(value) => setField("customerName", value.toUpperCase())}
        />

        <View style={styles.spacer} />

        {/* Customer Mobile */}
        <CustomInput
          isNumeric
          maxLength={10}
          placeholder="Customer Mobile Number"
          value={formData.customerMobile}
          onChangeText={(value) => {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            setField("customerMobile", numericValue);
          }}
        />

        <View style={styles.spacer} />

        {/* Customer State */}
        <Selector
          keyText="Customer State"
          valueText={formData.customerState}
          onPress={() => openSelection("customerState")}
        />

        <View style={styles.divider} />

        {/* Yard Name / Customer City */}
        <Selector
          keyText={formData.vehicleType.toLowerCase() === "repo" ? "Yard Name" : "Customer City"}
          valueText={formData.vehicleType.toLowerCase() === "repo" ? formData.yardName : formData.customerCity}
          onPress={() => {
            if (!formData.customerState) {
              ToastAndroid.show("Please Select Customer State first", ToastAndroid.SHORT);
              return;
            }

            if (formData.vehicleType.toLowerCase() === "repo") {
              openSelection("yardName");
            } else {
              openSelection("customerCity");
            }
          }}
        />

        {/* Customer Area & Pin (Retail Only) */}
        {formData.vehicleType.toLowerCase() !== "repo" && (
          <>
            <View style={styles.divider} />

            <Selector
              keyText="Customer Area"
              valueText={formData.customerArea}
              onPress={() => {
                if (!formData.customerCity) {
                  ToastAndroid.show("Please Select Customer City first", ToastAndroid.SHORT);
                  return;
                }
                openSelection("customerArea");
              }}
            />

            <View style={styles.divider} />

            <CustomInput
              isNumeric
              maxLength={6}
              placeholder="Customer Pincode"
              value={formData.customerPin}
              onChangeText={(value) => setField("customerPin", value)}
            />

            <View style={styles.spacer} />

            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Customer Address"
              placeholderTextColor="#999"
              value={formData.customerAddress}
              onChangeText={(value) => setField("customerAddress", value.toUpperCase())}
              autoCapitalize="characters"
              multiline
              numberOfLines={4}
            />
          </>
        )}

        <View style={styles.spacer} />
        <View style={styles.spacer} />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
          onPress={HandleSubmit}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <RNText style={styles.submitButtonText}>{isLoading ? "Submitting..." : "Submit"}</RNText>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </Layout>

      {/* Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModalPress}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={filterData}
              onChangeText={setFilterData}
            />
            {isModalLoading ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="small" color={COLORS.AppTheme.primary} />
                <RNText style={styles.modalLoaderText}>Loading...</RNText>
              </View>
            ) : (
              <FlatList
                data={bottomSheetData.value.filter((item) =>
                  item.name.toLowerCase().includes(filterData.toLowerCase())
                )}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => handleSelectItem(bottomSheetData.key, item)}
                  >
                    <RNText style={styles.listItemText}>{item.name}</RNText>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseModalPress}
            >
              <RNText style={styles.closeButtonText}>Close</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CreateLeads;

// ============ STYLES ============

const styles = StyleSheet.create({
  layoutStyle: {
    backgroundColor: "white",
    position: "relative",
  },
  layoutContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  layoutContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
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
  disabledSelector: {
    opacity: 0.6,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.AppTheme.primary,
  },
  selectorValue: {
    fontSize: 14,
    color: "#666",
    textTransform: "capitalize",
    maxWidth: '60%'
  },
  textInput: {
    height: 50,
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#000",
    marginVertical: 8,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: "top",
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  spacer: {
    height: 8,
  },
  bottomPadding: {
    height: 80,
  },
  submitButton: {
    backgroundColor: COLORS.AppTheme.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  searchInput: {
    height: 50,
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 14,
    color: "#000",
    marginBottom: 20,
  },
  modalLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  modalLoaderText: {
    fontSize: 14,
    color: COLORS.AppTheme.primary,
  },
  listItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listItemText: {
    fontSize: 14,
    color: COLORS.AppTheme.primary,
    textTransform: "capitalize",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: COLORS.AppTheme.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
