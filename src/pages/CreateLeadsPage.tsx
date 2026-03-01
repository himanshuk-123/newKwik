/**
 * CreateLead Screen — OFFLINE FIRST
 *
 * Sab dropdowns LOCAL DB se aate hain — koi API call nahi
 * Login ke waqt syncAllData() ne sab save kar diya hai
 *
 * Submit:
 *   Online  → API call seedha
 *   Offline → pending_leads table → background sync karega
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS } from '../constants/Colors';
import { STATE_CITY_LIST } from '../constants/StateCityList';
import { select, run } from '../database/db';
import {  CreateLeadPayload } from '../services/ApiClient';
import { fetchAreasForCity } from '../services/syncService';
import { useAppStore } from '../store/AppStore';
import { submitCreateLeadApi } from '../services/CreateLead';
// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface FormData {
  company_id: string;
  company_name: string;
  vehicle_type_id: string;
  vehicle_type_name: string;
  vehicle_category: string;     // "2W" | "4W" | "3W" etc — name1 se aata hai
  client_city_id: string;
  client_city_name: string;
  reg_no: string;
  prospect_no: string;
  customer_name: string;
  customer_mobile: string;
  state_id: string;
  state_name: string;
  city_id: string;
  city_name: string;
  area_id: string;
  area_name: string;
  customer_pin: string;
  yard_id: string;
  yard_name: string;
  chassis_no: string;
}

interface DropdownItem {
  id: string;
  name: string;
}

interface VehicleTypeItem extends DropdownItem {
  vehicle_categories: string; // "2W,3W" — name1 from API
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  company_id: '', company_name: '',
  vehicle_type_id: '', vehicle_type_name: '', vehicle_category: '',
  client_city_id: '', client_city_name: '',
  reg_no: '', prospect_no: '',
  customer_name: '', customer_mobile: '',
  state_id: '', state_name: '',
  city_id: '', city_name: '',
  area_id: '', area_name: '',
  customer_pin: '',
  yard_id: '', yard_name: '',
  chassis_no: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const CreateLeads = () => {
  const navigation = useNavigation<any>();
  const { user } = useAppStore();

  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM });

  // Dropdown lists
  const [companies, setCompanies] = useState<DropdownItem[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeItem[]>([]);
  const [vehicleCategories, setVehicleCategories] = useState<DropdownItem[]>([]);
  const [customerCities, setCustomerCities] = useState<DropdownItem[]>([]);
  const [areas, setAreas] = useState<DropdownItem[]>([]);
  const [yards, setYards] = useState<DropdownItem[]>([]);

  // Constants se seedha — no DB/API needed
  const states: DropdownItem[] = useMemo(() =>
    STATE_CITY_LIST.STATE_LIST.CircleList.map(s => ({ id: String(s.id), name: s.name })),
    []
  );
  const clientCities: DropdownItem[] = useMemo(() =>
    STATE_CITY_LIST.CITY_LIST.DataRecord.map(c => ({ id: String(c.id), name: c.name })),
    []
  );

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalItems, setModalItems] = useState<DropdownItem[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [activeField, setActiveField] = useState('');
  const [filterText, setFilterText] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Load companies on focus ─────────────────────────────────────────────

  useFocusEffect(
    useCallback(() => {
      loadCompanies();
    }, [])
  );

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      // companies table: id, name, type_name, state_name, city_name, status
      const rows = await select<{ id: string; name: string }>(
        'SELECT id, name FROM companies ORDER BY name'
      );
      setCompanies(rows);
      console.log('[CreateLeads] Companies from DB:', rows.length);
    } catch (e) {
      console.error('[CreateLeads] loadCompanies error:', e);
      ToastAndroid.show('Failed to load companies', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Field updater ───────────────────────────────────────────────────────

  const setField = (updates: Partial<FormData>) =>
    setFormData(prev => ({ ...prev, ...updates }));

  // ── Modal ───────────────────────────────────────────────────────────────

  const openModal = (field: string, items: DropdownItem[], title: string) => {
    setActiveField(field);
    setModalItems(items);
    setModalTitle(title);
    setFilterText('');
    setShowModal(true);
  };

  const filteredItems = useMemo(
    () => modalItems.filter(i => i.name.toLowerCase().includes(filterText.toLowerCase())),
    [modalItems, filterText]
  );

  const onSelect = async (item: DropdownItem) => {
    setShowModal(false);

    switch (activeField) {

      case 'company':
        setField({
          company_id: item.id, company_name: item.name,
          vehicle_type_id: '', vehicle_type_name: '', vehicle_category: '',
        });
        setVehicleTypes([]);
        setVehicleCategories([]);
        await loadVehicleTypes(item.id);
        break;

      case 'vehicle_type': {
        // vehicle_categories (name1) se categories parse karo
        const vtItem = item as VehicleTypeItem;
        const cats = vtItem.vehicle_categories
          ? vtItem.vehicle_categories
              .split(',')
              .map(c => c.trim())
              .filter(c => c.length > 0)   // ✅ leading comma filter — API data ",2W,3W" → ["2W","3W"]
              .map((c, i) => ({ id: String(i), name: c }))
          : [];
        setVehicleCategories(cats);
        setField({
          vehicle_type_id: item.id,
          vehicle_type_name: item.name,
          vehicle_category: cats.length === 1 ? cats[0].name : '', // auto-select if only one
        });
        break;
      }

      case 'vehicle_category':
        setField({ vehicle_category: item.name });
        break;

      case 'state':
        setField({
          state_id: item.id, state_name: item.name,
          city_id: '', city_name: '',
          area_id: '', area_name: '',
          yard_id: '', yard_name: '',
        });
        setCustomerCities([]);
        setAreas([]);
        setYards([]);
        loadCustomerCities(item.id);
        await loadYards(item.id);
        break;

      case 'city':
        setField({ city_id: item.id, city_name: item.name, area_id: '', area_name: '' });
        setAreas([]);
        await loadAreas(item.id);
        break;

      case 'area':
        setField({ area_id: item.id, area_name: item.name });
        break;

      case 'client_city':
        setField({ client_city_id: item.id, client_city_name: item.name });
        break;

      case 'yard':
        setField({ yard_id: item.id, yard_name: item.name });
        break;
    }
  };

  // ── DB Loaders ──────────────────────────────────────────────────────────

  const loadVehicleTypes = async (companyId: string) => {
    try {
      // vehicle_types: id, company_id, name, vehicle_categories
      const rows = await select<VehicleTypeItem>(
        'SELECT id, name, vehicle_categories FROM vehicle_types WHERE company_id = ? ORDER BY name',
        [companyId]
      );
      setVehicleTypes(rows);
      console.log('[CreateLeads] VehicleTypes from DB:', rows.length, 'for company:', companyId);

      if (!rows.length) {
        ToastAndroid.show('No vehicle types found. Data still syncing?', ToastAndroid.SHORT);
      }
    } catch (e) {
      console.error('[CreateLeads] loadVehicleTypes error:', e);
    }
  };

  const loadCustomerCities = (stateId: string) => {
    // Constants se filter — stateid field check karo
    const filtered = STATE_CITY_LIST.CITY_LIST.DataRecord
      .filter(c => String(c.stateid) === stateId)
      .map(c => ({ id: String(c.id), name: c.name }));
    setCustomerCities(filtered);
    console.log('[CreateLeads] Cities for state', stateId, ':', filtered.length);
  };

  const loadYards = async (stateId: string) => {
    try {
      // yards: id, name, state_id, city_id, state_name, city_name, status
      const rows = await select<{ id: string; name: string }>(
        'SELECT id, name FROM yards WHERE state_id = ? ORDER BY name',
        [stateId]
      );
      setYards(rows);
      console.log('[CreateLeads] Yards from DB:', rows.length, 'for state:', stateId);
    } catch (e) {
      console.error('[CreateLeads] loadYards error:', e);
    }
  };

  const loadAreas = async (cityId: string) => {
    try {
      if (!user?.token) return;

      // fetchAreasForCity:
      //   1. DB mein check karo → agar hai to return (no API)
      //   2. DB mein nahi hai → API call karo, save karo, return
      const rows = await fetchAreasForCity(user.token, cityId);
      setAreas(rows);
      console.log('[CreateLeads] Areas:', rows.length, 'for city:', cityId);

      if (!rows.length) {
        ToastAndroid.show('No areas found for this city.', ToastAndroid.SHORT);
      }
    } catch (e) {
      console.error('[CreateLeads] loadAreas error:', e);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!formData.customer_name.trim()) {
      ToastAndroid.show('Customer name required', ToastAndroid.SHORT); return false;
    }
    if (!formData.customer_mobile.trim() || formData.customer_mobile.length !== 10) {
      ToastAndroid.show('Valid 10-digit mobile required', ToastAndroid.SHORT); return false;
    }
    if (!formData.company_id) {
      ToastAndroid.show('Please select a company', ToastAndroid.SHORT); return false;
    }
    if (!formData.vehicle_type_id) {
      ToastAndroid.show('Please select vehicle type', ToastAndroid.SHORT); return false;
    }
    if (!formData.state_id) {
      ToastAndroid.show('Please select state', ToastAndroid.SHORT); return false;
    }
    return true;
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    const isRepo = formData.vehicle_type_name.toLowerCase() === 'repo';

    const payload: CreateLeadPayload = {
      Id: 0,
      CompanyId: Number(formData.company_id),
      RegNo: formData.reg_no.toUpperCase(),
      ProspectNo: formData.prospect_no.toUpperCase(),
      CustomerName: formData.customer_name.toUpperCase(),
      CustomerMobileNo: formData.customer_mobile,
      Vehicle: formData.vehicle_category.toUpperCase(),
      StateId: Number(formData.state_id),
      City: !isRepo && formData.city_id ? Number(formData.city_id) : '',
      Area: !isRepo && formData.area_id ? Number(formData.area_id) : '',
      Pincode: formData.customer_pin,
      ManufactureDate: '',
      ChassisNo: isRepo ? formData.chassis_no.toUpperCase() : '',
      EngineNo: '',
      StatusId: 1,
      ClientCityId: formData.client_city_id ? Number(formData.client_city_id) : '',
      VehicleType: Number(formData.vehicle_type_id),
      vehicleCategoryId: 0,
      VehicleTypeValue: formData.vehicle_type_name.toUpperCase(),
      YardId: isRepo && formData.yard_id ? Number(formData.yard_id) : 0,
      AutoAssign: 1,
    };

    try {
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      if (isOnline && user?.token) {
        try {
          const res = await submitCreateLeadApi(user.token, payload);
          if (res.ERROR === '0') {
            ToastAndroid.show(res.MESSAGE || 'Lead created!', ToastAndroid.LONG);
            setFormData({ ...INITIAL_FORM });
            navigation.goBack();
            return;
          }
          console.warn('[CreateLeads] API error:', res.MESSAGE, '— saving offline');
        } catch (apiErr) {
          console.warn('[CreateLeads] API failed — saving offline:', apiErr);
        }
      }

      // Offline ya API fail → pending_leads
      await run(
        "INSERT INTO pending_leads (payload, status, retry_count) VALUES (?, 'pending', 0)",
        [JSON.stringify(payload)]
      );
      ToastAndroid.show(
        isOnline
          ? 'Server error. Lead saved — will retry.'
          : 'Offline. Lead saved — will sync when online.',
        ToastAndroid.LONG
      );
      setFormData({ ...INITIAL_FORM });
      navigation.goBack();
    } catch (e: any) {
      console.error('[CreateLeads] Submit error:', e);
      ToastAndroid.show('Failed: ' + e.message, ToastAndroid.LONG);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isRepo = formData.vehicle_type_name.toLowerCase() === 'repo';

  return (
    <>
      <Layout style={styles.layoutStyle}>
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={COLORS.AppTheme.primary}
            style={{ alignSelf: 'center', marginBottom: 10 }}
          />
        )}

        <Selector
          keyText="Client Name"
          valueText={formData.company_name}
          onPress={() => openModal('company', companies, 'Select Company')}
        />

        <View style={styles.divider} />

        <Selector
          keyText="Vehicle Type"
          valueText={formData.vehicle_type_name}
          onPress={() => openModal('vehicle_type', vehicleTypes, 'Select Vehicle Type')}
          disabled={!formData.company_id}
        />

        {vehicleCategories.length > 0 && (
          <>
            <View style={styles.divider} />
            <Selector
              keyText="Vehicle Category"
              valueText={formData.vehicle_category}
              onPress={() => openModal('vehicle_category', vehicleCategories, 'Select Category')}
            />
          </>
        )}

        <View style={styles.divider} />

        <Selector
          keyText="Client City"
          valueText={formData.client_city_name}
          onPress={() => openModal('client_city', clientCities, 'Select Client City')}
        />

        <View style={styles.divider} />

        <CustomInput
          placeholder="Registration Number"
          value={formData.reg_no}
          maxLength={11}
          autoCapitalize="characters"
          onChangeText={value => setField({ reg_no: value.toUpperCase() })}
        />

        {isRepo && (
          <>
            <View style={styles.spacer} />
            <CustomInput
              placeholder="Chassis Number"
              value={formData.chassis_no}
              autoCapitalize="characters"
              onChangeText={value => setField({ chassis_no: value.toUpperCase() })}
            />
          </>
        )}

        <View style={styles.spacer} />

        <CustomInput
          placeholder="Prospect Number"
          value={formData.prospect_no}
          autoCapitalize="characters"
          onChangeText={value => setField({ prospect_no: value.toUpperCase() })}
        />

        <View style={styles.spacer} />

        <CustomInput
          placeholder="Customer Name"
          value={formData.customer_name}
          autoCapitalize="words"
          onChangeText={value => setField({ customer_name: value })}
        />

        <View style={styles.spacer} />

        <CustomInput
          isNumeric
          maxLength={10}
          placeholder="Customer Mobile Number"
          value={formData.customer_mobile}
          onChangeText={value => setField({ customer_mobile: value })}
        />

        <View style={styles.spacer} />

        <Selector
          keyText="Customer State"
          valueText={formData.state_name}
          onPress={() => openModal('state', states, 'Select State')}
        />

        <View style={styles.divider} />

        <Selector
          keyText={isRepo ? 'Yard Name' : 'Customer City'}
          valueText={isRepo ? formData.yard_name : formData.city_name}
          onPress={() =>
            isRepo
              ? openModal('yard', yards, 'Select Yard')
              : openModal('city', customerCities, 'Select City')
          }
          disabled={!formData.state_id}
        />

        {!isRepo && (
          <>
            <View style={styles.divider} />

            <Selector
              keyText="Customer Area"
              valueText={formData.area_name}
              onPress={() => openModal('area', areas, 'Select Area')}
              disabled={!formData.city_id}
            />

            <View style={styles.divider} />

            <CustomInput
              isNumeric
              maxLength={6}
              placeholder="Customer Pincode"
              value={formData.customer_pin}
              onChangeText={value => setField({ customer_pin: value })}
            />
          </>
        )}

        <View style={styles.spacer} />
        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </Layout>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder={modalTitle || 'Search'}
              placeholderTextColor="#999"
              value={filterText}
              onChangeText={setFilterText}
            />
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.listItem} onPress={() => onSelect(item)}>
                  <Text style={styles.listItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

interface CustomInputProps {
  isNumeric?: boolean;
  maxLength?: number;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

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
      keyboardType={isNumeric ? 'numeric' : 'default'}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
    />
  );
};

interface SelectorProps {
  keyText: string;
  valueText: string;
  onPress: () => void;
  disabled?: boolean;
}

const Selector = ({ keyText, valueText, onPress, disabled }: SelectorProps) => {
  return (
    <TouchableOpacity
      style={[styles.selectorContainer, disabled && styles.disabledSelector]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.selectorLabel}>{keyText}</Text>
      <Text style={styles.selectorValue}>{valueText || 'Select...'}</Text>
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

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  layoutStyle: {
    backgroundColor: 'white',
    position: 'relative',
  },
  layoutContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledSelector: {
    opacity: 0.6,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.AppTheme.primary,
  },
  selectorValue: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    maxWidth: '60%',
  },
  textInput: {
    height: 50,
    backgroundColor: COLORS.Dashboard.bg.Grey,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#000',
    marginVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
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
    alignItems: 'center',
    marginVertical: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
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
    color: '#000',
    marginBottom: 20,
  },
  listItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemText: {
    fontSize: 14,
    color: COLORS.AppTheme.primary,
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.AppTheme.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    padding: 24,
    color: '#9ca3af',
  },
});

export default CreateLeads;