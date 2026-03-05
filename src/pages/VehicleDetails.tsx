import {
  StyleSheet,
  ToastAndroid,
  View,
  TouchableOpacity,
  BackHandler,
  ScrollView,
  FlatList,
  Text,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useCallback, useEffect, useState } from "react";
import { COLORS } from "../constants/Colors";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
// @ts-ignore
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { useAppStore } from "../store/AppStore";

// ── Offline-first service ──
import {
  getDropdowns,
  fetchCarMMV,
  fetchVahan,
  submitVehicleDetails,
  type DropdownItem,
} from "../services/VehicleDetailService";
import { uploadPendingImagesForLead } from '../services/Imageuploadservice';
import { getPendingCountForLead } from '../database/imageCaptureDb';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface CarData {
  registrationId: string;
  vehicleType: string;
  yearOfManufacture: string;
  make: string;
  model: string;
  variant: string;
  vehicleFuelType: string;
  location: string;
  color: string;
  odometerReading: string;
  ownerName: string;
  HPAStatus: string;
  HPABank: string;
  summary: string;
  chassisNumber: string;
  engineNumber: string;
  customerName: string;
  ownerSerial: string;
  repoDate: any;
  remarks: string;
}

type CarDataKeys =
  | "registrationId"
  | "vehicleType"
  | "yearOfManufacture"
  | "make"
  | "model"
  | "variant"
  | "vehicleFuelType"
  | "location"
  | "color"
  | "odometerReading"
  | "ownerName"
  | "HPAStatus"
  | "HPABank"
  | "chassisNumber"
  | "engineNumber"
  | "customerName"
  | "ownerSerial"
  | "repoDate"
  | "remarks"
  | "summary";

interface RCVahan {
  OwnerName?: string;
  Manufacturedate?: string;
  chassinumber?: string;
  Enginenumber?: string;
  RCOwnerSR?: string;
  VehicleModel?: string;
  color?: string;
}

interface VehicleType extends DropdownItem {
  category: string;
}

// ============ INLINE COMPONENTS ============

const HorizontalBreak = () => <View style={styles.horizontalBreak} />;

interface SelectorProps {
  keyText: string;
  valueText: string;
  disabled?: boolean;
  onPress: () => void;
}

const Selector = ({ keyText, valueText, disabled, onPress }: SelectorProps) => {
  return (
    <TouchableOpacity
      style={[styles.selectorContainer, disabled && styles.selectorDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.selectorLabel}>{keyText}</Text>
      <Text style={styles.selectorValue}>{valueText || "Select..."}</Text>
    </TouchableOpacity>
  );
};

const InputComponent = ({
  placeholder,
  parameter: _parameter,
  onChangeText,
  value,
  disabled = false,
}: {
  parameter?: string;
  placeholder: string;
  value: string;
  onChangeText: (data: string) => void;
  disabled?: boolean;
}) => {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        autoCapitalize="characters"
        secureTextEntry={false}
      />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const VehicleDetails = ({ route }: { route: any }) => {
  const { carId, leadData, vehicleType } = route.params || { carId: "KWC12345" };
  useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAppStore();
  const token = user?.token || "";

  // Use actual registration number from leadData
  const registrationNumber = leadData?.RegNo || leadData?.LeadUId || carId;

  const [filterData, setFilterData] = useState<string>("");
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [carData, setCarData] = useState<CarData>({
    registrationId: registrationNumber,
    vehicleType: "",
    yearOfManufacture: "",
    make: "",
    model: "",
    variant: "",
    vehicleFuelType: "",
    location: "",
    color: "",
    odometerReading: "",
    ownerName: "Neeraj Dave",
    HPAStatus: "",
    HPABank: "",
    summary: "",
    chassisNumber: "",
    customerName: "",
    engineNumber: "",
    ownerSerial: "",
    repoDate: "",
    remarks: "",
  });
  const [fetchVahanApiData, setFetchVahanApiData] = useState<RCVahan>({});
  const [colorType, setColorType] = useState<DropdownItem[]>([]);
  const [makeType, setMakeType] = useState<string[]>([]);
  const [modelType, setModelType] = useState<string[]>([]);
  const [variantType, setVariantType] = useState<string[]>([]);
  const [vehicleFuelType, setVehicleFuelType] = useState<DropdownItem[]>([]);
  const [vehicleOwnershipType, setVehicleOwnershipType] = useState<VehicleType[]>([]);
  const [bottomSheetData, setBottomSheetData] = useState<{
    key: CarDataKeys;
    value: string[];
  }>();
  const [modalVisible, setModalVisible] = useState(false);
  const [isFetchingVahan, setIsFetchingVahan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMake, setIsLoadingMake] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isLoadingVariant, setIsLoadingVariant] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);

  // variables
  const vehicleTypeCategory = (leadData?.VehicleTypeValue || vehicleType || "").toString();
  const leadTypeName = (leadData?.LeadTypeName || "").toString();

  // ── Network listener ──
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(!!(state.isConnected && state.isInternetReachable));
    });
    return () => unsubscribe();
  }, []);

  const setParam = (param: CarDataKeys, data: string) => {
    setCarData({
      ...carData,
      [param]: data.toUpperCase(),
    });
  };

  // ── Fetch Vahan — Online only ──
  const FetchVahan = async () => {
    if (!isOnline) {
      ToastAndroid.show("Fetch Vahan requires internet", ToastAndroid.SHORT);
      return;
    }
    setIsFetchingVahan(true);
    try {
      const result = await fetchVahan(token, carId);
      if (result.success && result.data) {
        setFetchVahanApiData(result.data);
        setCarData({
          ...carData,
          yearOfManufacture: result.data.Manufacturedate || carData.yearOfManufacture,
          customerName: result.data.OwnerName || carData.customerName,
          chassisNumber: result.data.chassinumber || carData.chassisNumber,
          engineNumber: result.data.Enginenumber || carData.engineNumber,
          ownerSerial: result.data.RCOwnerSR || carData.ownerSerial,
          color: result.data.color || carData.color,
        });
      }
      ToastAndroid.show(result.message, ToastAndroid.SHORT);
    } catch (error: any) {
      console.error("FetchVahan error:", error);
      ToastAndroid.show("Something went wrong fetching vahan", ToastAndroid.SHORT);
    } finally {
      setIsFetchingVahan(false);
    }
  };

  const handleSetData = (key: CarDataKeys, value: any) => {
    setCarData({ ...carData, [key]: value });
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const doesExist = (data?: string) => {
    return !!data && data.length !== 0;
  };

  // ── Dropdowns — Offline-first (cached locally) ──
  const fetchDropDowns = useCallback(async () => {
    if (!vehicleTypeCategory) return;
    setIsLoadingDropdowns(true);
    try {
      const [colors, ownership, fuel] = await Promise.all([
        getDropdowns(token, "ColorsType", vehicleTypeCategory),
        getDropdowns(token, "VehicleTypeMode", vehicleTypeCategory),
        getDropdowns(token, "FuelType", vehicleTypeCategory),
      ]);

      setColorType(colors || []);
      setVehicleOwnershipType((ownership || []) as VehicleType[]);
      setVehicleFuelType(fuel || []);
    } finally {
      setIsLoadingDropdowns(false);
    }
  }, [vehicleTypeCategory, token]);

  // ── CarMMV — Cache-as-you-go ──
  const carMMV = useCallback(async (request: {
    Year: string;
    Make: string;
    Model: string;
    ActionType: string;
    Variant: string;
  }) => {
    try {
      const resp = await fetchCarMMV(token, {
        ...request,
        LeadId: carId,
      });
      return resp || [];
    } catch (error) {
      console.error("CarMMV error:", error);
      return [];
    }
  }, [carId, token]);

  useEffect(() => {
    fetchDropDowns();
  }, [fetchDropDowns]);

  useEffect(() => {
    const fetchData = async () => {
      if (!carData.yearOfManufacture) return;

      const year = carData.yearOfManufacture.split("/")[1] || "";
      if (!year) return;

      setIsLoadingMake(true);
      try {
        const resp = await carMMV({
          Year: year,
          Make: "",
          Model: "",
          Variant: "",
          ActionType: "YEAR",
        });

        if (Array.isArray(resp) && resp.length) {
          setMakeType(resp.map((item: any) => item.name));
        }
      } finally {
        setIsLoadingMake(false);
      }
    };

    fetchData();
  }, [carData.yearOfManufacture, carMMV]);

  useEffect(() => {
    const fetchData = async () => {
      if (!carData.make) return;

      const year = carData.yearOfManufacture.split("/")[1] || "";
      if (!year) return;

      setIsLoadingModel(true);
      try {
        const resp = await carMMV({
          Year: year,
          Make: carData.make,
          Model: "",
          Variant: "",
          ActionType: "Make",
        });

        if (Array.isArray(resp) && resp.length) {
          setModelType(resp.map((item: any) => item.name));
        }
      } finally {
        setIsLoadingModel(false);
      }
    };

    fetchData();
  }, [carData.make, carData.yearOfManufacture, carMMV]);

  useEffect(() => {
    const fetchData = async () => {
      if (!carData.model) return;

      const year = carData.yearOfManufacture.split("/")[1] || "";
      if (!year) return;

      setIsLoadingVariant(true);
      try {
        const resp = await carMMV({
          Year: year,
          Make: carData.make,
          Model: carData.model,
          Variant: "",
          ActionType: "Model",
        });

        if (Array.isArray(resp) && resp.length) {
          setVariantType(resp.map((item: any) => item.name));
        }
      } finally {
        setIsLoadingVariant(false);
      }
    };

    fetchData();
  }, [carData.model, carData.make, carData.yearOfManufacture, carMMV]);

  useEffect(() => {
    const backAction = () => {
      if (modalVisible) {
        closeModal();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [modalVisible]);

  // ── Auto-sync modal data when source arrays update while modal is open ──
  useEffect(() => {
    if (!modalVisible || !bottomSheetData?.key) return;
    const dataMap: Record<string, string[]> = {
      make: makeType,
      model: modelType,
      variant: variantType,
      vehicleType: vehicleOwnershipType.map(i => i.name),
      vehicleFuelType: vehicleFuelType.map(i => i.name),
      color: colorType.map(i => i.name),
    };
    const newData = dataMap[bottomSheetData.key];
    if (newData) {
      setBottomSheetData(prev => prev ? { ...prev, value: newData } : prev);
    }
  }, [modalVisible, bottomSheetData?.key, makeType, modelType, variantType, vehicleOwnershipType, vehicleFuelType, colorType]);

  // ── Submit — Online direct / Offline queue ──
  const HandleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const chassisNumber = fetchVahanApiData.chassinumber || carData.chassisNumber;
      const engineNumber = fetchVahanApiData.Enginenumber || carData.engineNumber;
      const customerName = fetchVahanApiData.OwnerName || carData.customerName;
      const yearOfManufacture = fetchVahanApiData.Manufacturedate || carData.yearOfManufacture;
      const ownerSerial = fetchVahanApiData.RCOwnerSR || carData.ownerSerial;
      const color = fetchVahanApiData.color || carData.color;

      if (
        !color ||
        !carData.vehicleType ||
        !carData.vehicleFuelType ||
        !customerName ||
        !yearOfManufacture ||
        !carData.make ||
        !carData.model ||
        !carData.variant ||
        !chassisNumber ||
        !engineNumber ||
        !ownerSerial
      ) {
        ToastAndroid.show("Please fill all the fields", ToastAndroid.LONG);
        return;
      }

      const colorId = colorType.find((item) => item.name === color)?.id;
      const fuelTypeId = vehicleFuelType.find(
        (item) => item.name === carData.vehicleFuelType
      )?.id;
      const vehicleTypeModeId = vehicleOwnershipType.find(
        (item) => item.name === carData.vehicleType
      )?.id;

      const vehicleModel = `${carData.model} ${carData.variant}`.trim();

      // ── Pre-submit: Pending images pehle upload karo ─────────────────────
      const currentLeadId = String(leadData?.Id || carId);
      if (isOnline) {
        const pendingCount = await getPendingCountForLead(currentLeadId);
        if (pendingCount > 0) {
          ToastAndroid.show(
            `Uploading ${pendingCount} pending images before submit...`,
            ToastAndroid.LONG
          );
          const syncResult = await uploadPendingImagesForLead(token, currentLeadId);
          if (syncResult.failed > 0) {
            ToastAndroid.show(
              `${syncResult.failed} image(s) failed to upload. Please retry.`,
              ToastAndroid.LONG
            );
            return;
          }
          console.log(`[VehicleDetails] ✅ All ${syncResult.uploaded} images uploaded before submit`);
        }
      }

      const payload = {
        Id: 1,
        LeadId: leadData?.Id || carId,
        FuelTypeId: fuelTypeId,
        ColorsTypeId: colorId,
        VehicleTypeModeId: vehicleTypeModeId,
        Summary: carData.remarks,
        LeadList: {
          ProspectNo: leadData?.ProspectNo,
          CustomerName: customerName,
          CustomerMobileNo: leadData?.CustomerMobileNo,
          Vehicle: leadData?.VehicleType || leadData?.VehicleTypeValue,
          ManufactureDate: yearOfManufacture,
          ChassisNo: chassisNumber,
          EngineNo: engineNumber,
          RepoDate: carData.repoDate,
          MakeCompany: carData.make,
          VehicleModel: vehicleModel,
        },
        MMVTable: {
          ProspectNo: leadData?.ProspectNo,
          CustomerName: customerName,
          OwnerName: customerName,
          CustomerMobileNo: leadData?.CustomerMobileNo,
          MobileNo: leadData?.CustomerMobileNo,
          Vehicle: leadData?.VehicleType || leadData?.VehicleTypeValue,
          VehicleCategory: leadData?.VehicleType || leadData?.VehicleTypeValue,
          ManufactureDate: yearOfManufacture,
          Manufacturedate: yearOfManufacture,
          ChassisNo: chassisNumber,
          chassinumber: chassisNumber,
          EngineNo: engineNumber,
          Enginenumber: engineNumber,
          MakeCompany: carData.make,
          VehicleModel: vehicleModel,
        },
        LeadStatus: "5",
      };

      const result = await submitVehicleDetails(token, payload);

      if (result.success) {
        ToastAndroid.show(result.message, ToastAndroid.LONG);
        navigation.pop(2);
      } else {
        ToastAndroid.show(result.message, ToastAndroid.LONG);
      }
    } catch (error) {
      console.log(error);
      ToastAndroid.show("Error saving data", ToastAndroid.SHORT);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Offline indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>Offline Mode</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesome6 name="arrow-left" size={20} color={"white"} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vehicle Details</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.fetchVahanBtn,
              (isFetchingVahan || !isOnline) && styles.fetchVahanBtnDisabled,
            ]}
            onPress={FetchVahan}
            disabled={isFetchingVahan || !isOnline}
            activeOpacity={0.7}
          >
            {isFetchingVahan ? (
              <ActivityIndicator size="small" color={COLORS.AppTheme.primary} />
            ) : (
              <Text style={styles.fetchVahanText}>
                {isOnline ? "Fetch vahan" : "Offline"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <InputComponent
            parameter="registrationId"
            placeholder="Registration Number"
            disabled
            onChangeText={(text) =>
              setParam("registrationId", text)
            }
            value={carData.registrationId}
          />

          <Selector
            keyText="Year of Manufacturing"
            valueText={
              fetchVahanApiData.Manufacturedate
                ? fetchVahanApiData.Manufacturedate
                : carData.yearOfManufacture
            }
            disabled={doesExist(fetchVahanApiData.Manufacturedate)}
            onPress={() => {
              DateTimePickerAndroid.open({
                value: new Date(),
                onChange: (e, date) => {
                  if (e.type !== "dismissed") {
                    const formattedDate = date?.toLocaleDateString("en-IN", {
                      month: "2-digit",
                      year: "numeric",
                    }) || "";
                    setParam("yearOfManufacture", formattedDate);
                  }
                },
                mode: "date",
                timeZoneName: "Asia/Kolkata",
                display: "spinner",
              });
            }}
          />
          <HorizontalBreak />
          {fetchVahanApiData.VehicleModel && (
            <>
              <InputComponent
                parameter="vehicleModel"
                disabled
                value={fetchVahanApiData.VehicleModel}
                onChangeText={() => { }}
                placeholder=""
              />
              <HorizontalBreak />
            </>
          )}
          <Selector
            keyText="Make"
            valueText={carData.make}
            onPress={() => {
              if (!carData.yearOfManufacture) {
                ToastAndroid.show("Please select Year of Manufacturing first", ToastAndroid.LONG);
                return;
              }
              if (!makeType.length) {
                if (isLoadingMake) {
                  openModal();
                  setBottomSheetData({ key: "make", value: [] });
                  return;
                }
                ToastAndroid.show("No makes available. Please try again.", ToastAndroid.LONG);
                return;
              }
              openModal();
              setBottomSheetData({
                key: "make",
                value: makeType,
              });
            }}
          />

          <HorizontalBreak />
          <Selector
            keyText="Model"
            valueText={carData.model}
            onPress={() => {
              if (!carData.make) {
                ToastAndroid.show("Please select Make first", ToastAndroid.LONG);
                return;
              }
              if (!modelType.length) {
                if (isLoadingModel) {
                  openModal();
                  setBottomSheetData({ key: "model", value: [] });
                  return;
                }
                ToastAndroid.show("No models available. Please try again.", ToastAndroid.LONG);
                return;
              }
              openModal();
              setBottomSheetData({
                key: "model",
                value: modelType,
              });
            }}
          />

          <HorizontalBreak />
          <Selector
            keyText="Variant"
            valueText={carData.variant}
            onPress={() => {
              if (!carData.model) {
                ToastAndroid.show("Please select Model first", ToastAndroid.LONG);
                return;
              }
              if (!variantType.length) {
                if (isLoadingVariant) {
                  openModal();
                  setBottomSheetData({ key: "variant", value: [] });
                  return;
                }
                ToastAndroid.show("No variants available. Please try again.", ToastAndroid.LONG);
                return;
              }
              openModal();
              setBottomSheetData({
                key: "variant",
                value: variantType,
              });
            }}
          />

          <HorizontalBreak />
          <Selector
            keyText="Vehicle Type"
            valueText={carData.vehicleType}
            onPress={() => {
              if (!carData.variant) {
                ToastAndroid.show("Please select Variant first", ToastAndroid.LONG);
                return;
              }
              if (!vehicleOwnershipType.length) {
                if (isLoadingDropdowns) {
                  openModal();
                  setBottomSheetData({ key: "vehicleType", value: [] });
                  return;
                }
                ToastAndroid.show("No vehicle types available. Please try again.", ToastAndroid.LONG);
                return;
              }
              openModal();
              setBottomSheetData({
                key: "vehicleType",
                value: vehicleOwnershipType.map((item) => item.name),
              });
            }}
          />

          <HorizontalBreak />
          <Selector
            keyText="Fuel Type"
            valueText={carData.vehicleFuelType}
            onPress={() => {
              if (!carData.vehicleType) {
                ToastAndroid.show(
                  "Please select Vehicle Type first",
                  ToastAndroid.LONG
                );
                return;
              }
              if (!vehicleFuelType.length) {
                if (isLoadingDropdowns) {
                  openModal();
                  setBottomSheetData({ key: "vehicleFuelType", value: [] });
                  return;
                }
                ToastAndroid.show("No fuel types available. Please try again.", ToastAndroid.LONG);
                return;
              }
              openModal();
              setBottomSheetData({
                key: "vehicleFuelType",
                value: vehicleFuelType.map((item) => item.name),
              });
            }}
          />

          <HorizontalBreak />
          <InputComponent
            parameter="chassisNumber"
            disabled={doesExist(fetchVahanApiData.chassinumber)}
            placeholder="Chassis Number"
            onChangeText={(text) => setParam("chassisNumber", text)}
            value={
              fetchVahanApiData.chassinumber
                ? fetchVahanApiData.chassinumber
                : carData.chassisNumber
            }
          />

          <InputComponent
            parameter="engineNumber"
            disabled={doesExist(fetchVahanApiData.Enginenumber)}
            placeholder="Engine Number"
            onChangeText={(text) => setParam("engineNumber", text)}
            value={
              fetchVahanApiData.Enginenumber
                ? fetchVahanApiData.Enginenumber
                : carData.engineNumber
            }
          />

          <InputComponent
            disabled={doesExist(fetchVahanApiData.OwnerName)}
            placeholder="Customer Name"
            onChangeText={(text) => setParam("customerName", text)}
            value={
              fetchVahanApiData.OwnerName
                ? fetchVahanApiData.OwnerName
                : carData.customerName
            }
          />

          <Selector
            keyText="Owner Serial"
            disabled={doesExist(fetchVahanApiData.RCOwnerSR)}
            valueText={
              fetchVahanApiData.RCOwnerSR
                ? fetchVahanApiData.RCOwnerSR
                : carData.ownerSerial
            }
            onPress={() => {
              openModal();
              setBottomSheetData({
                key: "ownerSerial",
                value: [
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "10",
                  "11",
                  "12",
                ],
              });
            }}
          />

          <HorizontalBreak />
          <Selector
            keyText="Color"
            disabled={doesExist(fetchVahanApiData.color)}
            valueText={
              fetchVahanApiData.color ? fetchVahanApiData.color : carData.color
            }
            onPress={() => {
              if (!colorType.length) {
                if (isLoadingDropdowns) {
                  openModal();
                  setBottomSheetData({ key: "color", value: [] });
                  return;
                }
                ToastAndroid.show("No colors available. Please try again.", ToastAndroid.LONG);
                return;
              }
              openModal();
              setBottomSheetData({
                key: "color",
                value: colorType.map((item) => item.name),
              });
            }}
          />
          <HorizontalBreak />

          {(carData.vehicleType.toLowerCase() === "repo" ||
            leadTypeName.toLowerCase() === "repo") && (
              <>
                <Selector
                  keyText="Repo Date"
                  valueText={carData.repoDate}
                  onPress={() => {
                    DateTimePickerAndroid.open({
                      value: new Date(),
                      minimumDate: new Date(),
                      onChange: (event, date) => {
                        if (event.type === "dismissed") {
                          setParam("repoDate", "");
                          return;
                        }
                        const formattedRepoDate = (date?.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }) || "").replace(/\//g, "-");
                        setParam("repoDate", formattedRepoDate);
                      },
                      mode: "date",
                      timeZoneName: "Asia/Kolkata",
                      display: "spinner",
                    });
                  }}
                />
                <HorizontalBreak />
              </>
            )}

          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Remarks"
              placeholderTextColor="#999"
              value={carData.remarks}
              onChangeText={(e) => {
                setParam("remarks", e);
              }}
            />
          </View>

          <TouchableOpacity
            onPress={HandleSubmit}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isOnline ? "Submit" : "Save Offline"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal for selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />

            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#999"
                maxLength={50}
                onChangeText={(value) => setFilterData(value)}
                value={filterData}
              />
            </View>

            <FlatList
              initialNumToRender={5}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews
              style={styles.flatList}
              data={bottomSheetData?.value.filter((item) =>
                item?.toLowerCase()?.includes(filterData.toLowerCase())
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => {
                    if (!bottomSheetData?.key) {
                      ToastAndroid.show(
                        "Something went wrong while saving data",
                        ToastAndroid.SHORT
                      );
                      return;
                    }
                    handleSetData(bottomSheetData?.key, item);
                    closeModal();
                    setFilterData("");
                  }}
                >
                  <Text style={styles.listItemText}>
                    {item.replaceAll("(Client)", "")}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(_, index) => index.toString()}
              ListEmptyComponent={
                (bottomSheetData?.key === 'make' && isLoadingMake) ||
                (bottomSheetData?.key === 'model' && isLoadingModel) ||
                (bottomSheetData?.key === 'variant' && isLoadingVariant) ||
                (['vehicleType', 'vehicleFuelType', 'color'].includes(bottomSheetData?.key || '') && isLoadingDropdowns)
                  ? <View style={styles.modalLoaderContainer}><ActivityIndicator size="large" color={COLORS.AppTheme.primary} /><Text style={styles.modalLoaderText}>Loading...</Text></View>
                  : <Text style={styles.modalEmptyText}>No results</Text>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default VehicleDetails;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.AppTheme.primaryBg,
  },
  offlineBanner: {
    backgroundColor: '#FF9800',
    paddingVertical: 6,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.AppTheme.primaryBg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  fetchVahanBtn: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  fetchVahanBtnDisabled: {
    opacity: 0.6,
  },
  fetchVahanText: {
    color: "black",
    fontSize: 15,
    fontWeight: "500",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  horizontalBreak: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 10,
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
  selectorDisabled: {
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
    maxWidth: "50%",
    textAlign: "right",
  },
  detailsListContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  detailsListCell: {
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    minHeight: 50,
    paddingHorizontal: 8,
  },
  detailsListHeader: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  detailsListValue: {
    fontSize: 16,
    paddingLeft: 8,
  },
  inputWrapper: {
    marginVertical: 7,
    width: "100%",
  },
  input: {
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderWidth: 0,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  inputDisabled: {
    opacity: 0.6,
  },
  textAreaWrapper: {
    marginVertical: 7,
    width: "100%",
  },
  textArea: {
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderWidth: 0,
    minHeight: 100,
    maxHeight: 150,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: COLORS.AppTheme.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '50%',
    padding: 20,
    elevation: 5,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ccc',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10,
  },
  searchInputWrapper: {
    width: "100%",
    marginVertical: 10,
  },
  searchInput: {
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderWidth: 0,
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  flatList: {
    width: "100%",
    flex: 1,
  },
  listItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listItemText: {
    textAlign: "center",
    fontSize: 16,
    textTransform: "capitalize",
    color: "#333",
  },
  modalLoaderContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  modalLoaderText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  modalEmptyText: {
    textAlign: 'center',
    padding: 24,
    color: '#9ca3af',
  },
});
