import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
  ToastAndroid,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants/Colors";

/**
 * Create Lead Screen
 * 
 * FLOW:
 * 1. Load dropdown data from DATABASE (works OFFLINE ✅)
 * 2. User fills form:
 *    - Customer name
 *    - Mobile number
 *    - Select company, state, city, area, vehicle type, etc
 * 3. User clicks "Create Lead"
 * 4. Save to DATABASE immediately (works OFFLINE ✅)
 * 5. Add to SYNC QUEUE to upload later
 * 6. Show success message
 * 7. Go back to Dashboard
 * 8. Background worker syncs when online
 */

interface FormData {
  customer_name: string;
  customer_mobile_no: string;
  company_id: string;
  state_id: string;
  city_id: string;
  area_id: string;
  yard_id: string;
  reg_no: string;
  vehicle_category: string;
  vehicle_type_id: string;
  manufacture_date: string;
  chassis_no: string;
  engine_no: string;
}

interface Dropdown {
  id: number | string;
  name: string;
}

const CreateLeads = () => {
  const navigation = useNavigation<any>();

  // Form State
  const [formData, setFormData] = useState<FormData>({
    customer_name: "",
    customer_mobile_no: "",
    company_id: "",
    state_id: "",
    city_id: "",
    area_id: "",
    yard_id: "",
    reg_no: "",
    vehicle_category: "4W",
    vehicle_type_id: "",
    manufacture_date: "",
    chassis_no: "",
    engine_no: "",
  });

  // Dropdown Data (loaded from DATABASE)
  const [dropdowns, setDropdowns] = useState({
    companies: [] as Dropdown[],
    states: [] as Dropdown[],
    cities: [] as Dropdown[],
    areas: [] as Dropdown[],
    yards: [] as Dropdown[],
    vehicleTypes: [] as Dropdown[],
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<Dropdown[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalKey, setModalKey] = useState<keyof FormData | null>(null);
  const [filterText, setFilterText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load drop down data from DATABASE on focus
  useFocusEffect(
    useCallback(() => {
      loadDropdownData();
    }, [])
  );

  const loadDropdownData = async () => {
    try {
      setIsLoading(true);

      const {
        companyQueries,
        stateQueries,
        cityQueries,
        areaQueries,
        yardQueries,
      } = await import("../database");

      // Load from database
      const companies = await companyQueries.getAll();
      const states = await stateQueries.getAll();
      const cities = await cityQueries.getAll();
      const areas = await areaQueries.getAll();
      const yards = await yardQueries.getAll();

      setDropdowns({
        companies: companies.map((c: any) => ({
          id: c.id,
          name: c.name,
        })),
        states: states.map((s: any) => ({
          id: s.id,
          name: s.name,
        })),
        cities: cities.map((c: any) => ({
          id: c.id,
          name: c.name,
        })),
        areas: areas.map((a: any) => ({
          id: a.id,
          name: a.name,
        })),
        yards: yards.map((y: any) => ({
          id: y.id,
          name: y.name,
        })),
        vehicleTypes: [],
      });

      console.log(
        "[CreateLeads] Loaded dropdowns:",
        companies.length,
        states.length
      );
    } catch (error) {
      console.error("[CreateLeads] Error loading dropdowns:", error);
      ToastAndroid.show("Failed to load form data", ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered modal data
  const filteredModalData = useMemo(() => {
    return modalData.filter((item) =>
      item.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [modalData, filterText]);

  const openModal = (
    key: keyof FormData,
    data: Dropdown[],
    title: string
  ) => {
    setModalKey(key);
    setModalData(data);
    setModalTitle(title);
    setFilterText("");
    setShowModal(true);
  };

  const selectValue = (item: Dropdown) => {
    setFormData((prev) => ({
      ...prev,
      [modalKey!]: String(item.id),
    }));
    setShowModal(false);

    // When company is selected, load vehicle types from database
    if (modalKey === "company_id") {
      loadVehicleTypesForCompany(Number(item.id));
    }

    // When city is selected, load areas
    if (modalKey === "city_id") {
      loadAreasForCity(Number(item.id));
    }
  };

  const loadVehicleTypesForCompany = async (companyId: number) => {
    try {
      const { vehicleTypeQueries } = await import("../database");

      // Get vehicle types for selected company from database
      const types = await vehicleTypeQueries.getAll();
      const filtered = types.filter(
        (t: any) => t.company_id === companyId
      );

      setDropdowns((prev) => ({
        ...prev,
        vehicleTypes: filtered.map((t: any) => ({
          id: t.id,
          name: t.name,
        })),
      }));
    } catch (error) {
      console.error("[CreateLeads] Error loading vehicle types:", error);
    }
  };

  const loadAreasForCity = async (cityId: number) => {
    try {
      const { areaQueries } = await import("../database");

      // Get areas for selected city from database
      const areas = await areaQueries.getAll();
      const filtered = areas.filter((a: any) => a.city_id === cityId);

      setDropdowns((prev) => ({
        ...prev,
        areas: filtered.map((a: any) => ({
          id: a.id,
          name: a.name,
        })),
      }));
    } catch (error) {
      console.error("[CreateLeads] Error loading areas:", error);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.customer_name || !formData.customer_mobile_no) {
      ToastAndroid.show("Please fill all required fields", ToastAndroid.SHORT);
      return;
    }

    if (!formData.company_id || !formData.state_id || !formData.city_id) {
      ToastAndroid.show("Please select company, state, and city", ToastAndroid.LONG);
      return;
    }

    try {
      setIsSubmitting(true);

      const { leadQueries, syncQueueQueries } = await import("../database");
      const uuid = `lead-${Date.now()}-${Math.random()}`;

      // 1️⃣ SAVE TO DATABASE (IMMEDIATELY - works OFFLINE)
      await leadQueries.create({
        id: uuid,
        customer_name: formData.customer_name,
        customer_mobile_no: formData.customer_mobile_no,
        company_id: Number(formData.company_id),
        state_id: Number(formData.state_id),
        city_id: Number(formData.city_id),
        area_id: formData.area_id ? Number(formData.area_id) : 0,
        yard_id: formData.yard_id ? Number(formData.yard_id) : 0,
        reg_no: formData.reg_no,
        vehicle_category: formData.vehicle_category,
        vehicle_type_id: formData.vehicle_type_id
          ? Number(formData.vehicle_type_id)
          : 0,
        manufacture_date: formData.manufacture_date,
        chassis_no: formData.chassis_no,
        engine_no: formData.engine_no,
        is_synced: 0, // NOT synced yet
        created_at: new Date().toISOString(),
      });

      // 2️⃣ ADD TO SYNC QUEUE (for background sync)
      await syncQueueQueries.add({
        id: `sync-${Date.now()}`,
        entity_type: "lead",
        entity_id: uuid,
        operation: "create",
        payload: JSON.stringify(formData),
        retry_count: 0,
        created_at: new Date().toISOString(),
      });

      ToastAndroid.show(
        "Lead created! Will sync when online.",
        ToastAndroid.LONG
      );

      // 3️⃣ GO BACK TO DASHBOARD
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error("[CreateLeads] Submit error:", error);
      ToastAndroid.show(
        "Failed to create lead",
        ToastAndroid.LONG
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const getSelectedValue = (key: keyof FormData) => {
    const value = formData[key];
    if (!value) return "Select...";

    // Find matching dropdown name
    if (key === "company_id") {
      return dropdowns.companies.find((c) => c.id === Number(value))?.name ||
        "Select...";
    }
    if (key === "state_id") {
      return dropdowns.states.find((s) => s.id === Number(value))?.name ||
        "Select...";
    }
    if (key === "city_id") {
      return dropdowns.cities.find((c) => c.id === Number(value))?.name ||
        "Select...";
    }
    if (key === "area_id") {
      return dropdowns.areas.find((a) => a.id === Number(value))?.name ||
        "Select...";
    }
    if (key === "vehicle_type_id") {
      return dropdowns.vehicleTypes.find((v) => v.id === Number(value))?.name ||
        "Select...";
    }

    return value;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Lead</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Customer Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={formData.customer_name}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  customer_name: text,
                }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              keyboardType="numeric"
              maxLength={10}
              value={formData.customer_mobile_no}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  customer_mobile_no: text,
                }))
              }
            />
          </View>
        </View>

        {/* Company & Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company & Location</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Company *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() =>
                openModal("company_id", dropdowns.companies, "Select Company")
              }
            >
              <Text style={styles.selectorText}>
                {getSelectedValue("company_id")}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>State *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() =>
                openModal("state_id", dropdowns.states, "Select State")
              }
            >
              <Text style={styles.selectorText}>
                {getSelectedValue("state_id")}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>City *</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() =>
                openModal("city_id", dropdowns.cities, "Select City")
              }
            >
              <Text style={styles.selectorText}>
                {getSelectedValue("city_id")}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Area</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() =>
                openModal("area_id", dropdowns.areas, "Select Area")
              }
            >
              <Text style={styles.selectorText}>
                {getSelectedValue("area_id")}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Registration Number</Text>
            <TextInput
              style={styles.input}
              placeholder="MH01AB1234"
              value={formData.reg_no}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  reg_no: text.toUpperCase(),
                }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() =>
                openModal(
                  "vehicle_type_id",
                  dropdowns.vehicleTypes,
                  "Select Vehicle Type"
                )
              }
              disabled={!formData.company_id}
            >
              <Text style={styles.selectorText}>
                {getSelectedValue("vehicle_type_id")}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#6b7280" />
            </TouchableOpacity>
            {!formData.company_id && (
              <Text style={styles.helperText}>
                Select company first
              </Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Manufacture Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.manufacture_date}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  manufacture_date: text,
                }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Chassis Number</Text>
            <TextInput
              style={styles.input}
              placeholder="CH123456"
              value={formData.chassis_no}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  chassis_no: text.toUpperCase(),
                }))
              }
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Engine Number</Text>
            <TextInput
              style={styles.input}
              placeholder="EN789012"
              value={formData.engine_no}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  engine_no: text.toUpperCase(),
                }))
              }
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Creating..." : "Create Lead"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for selecting dropdown items */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={filterText}
              onChangeText={setFilterText}
              placeholderTextColor="#9ca3af"
            />

            <FlatList
              data={filteredModalData}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectValue(item)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              scrollEnabled={true}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CreateLeads;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#000",
  },
  selector: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 14,
    color: "#000",
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#FF6B35",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalItemText: {
    fontSize: 14,
    color: "#000",
  },
});
