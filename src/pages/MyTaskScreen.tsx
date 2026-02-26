/**
 * MyTasksPage — FIXED
 * Fix 1: vehicleType: item.vehicle_type_value (pehle selectedVehicleType tha — wrong)
 * Fix 2: loadPendingCounts — getPendingCountByLead() se N+1 solve
 */

import {
  Image, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, TouchableWithoutFeedback, View,
  ActivityIndicator, ToastAndroid,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRef, useState, useCallback, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import SingleCard from '../components/SingleCard';
import { COLORS } from '../constants/Colors';
import { VehicleCE } from '../assets';
import { select, run } from '../database/db';
import { getPendingCountByLead } from '../database/imageCaptureDb'; // ✅ batch call
import { confirmAppointmentApi } from '../services/ApiClient';
import { useAppStore } from '../store/AppStore';

const ICON_SIZE_23 = { fontSize: 23 };
const ICON_SIZE_24 = { fontSize: 24 };
const VEHICLE_CE_ICON_STYLE = { width: 30, height: 20 };
const ICON_STRIP_STYLE = { height: 60 };

const DisplayIcons = [
  { vehicleType: '2W', icon: () => <Text style={ICON_SIZE_23}>🏍️</Text> },
  { vehicleType: '3W', icon: () => <Text style={ICON_SIZE_24}>🛺</Text> },
  { vehicleType: '4W', icon: () => <Text style={ICON_SIZE_24}>🚗</Text> },
  { vehicleType: 'FE', icon: () => <Text style={ICON_SIZE_24}>🚜</Text> },
  { vehicleType: 'CV', icon: () => <Text style={ICON_SIZE_24}>🚚</Text> },
  { vehicleType: 'CE', icon: () => <Image style={VEHICLE_CE_ICON_STYLE} source={VehicleCE} /> },
];

interface LeadFromDB {
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
  state_id: string; state_name: string;
  city_id: string; city_name: string;
  area_id: string; area_name: string;
  client_city_id: string; client_city_name: string;
  pincode: string; chassis_no: string; engine_no: string;
  status_id: string; yard_name: string;
  lead_report_id: string; view_url: string; download_url: string;
  appointment_date: string; added_by_date: string;
  retail_bill_type: string; retail_fees_amount: number;
  repo_bill_type: string; repo_fees_amount: number;
  cando_bill_type: string; cando_fees_amount: number;
  asset_bill_type: string; valuator_name: string; admin_ro: string;
}

const isBillingAllowed = (item: LeadFromDB): boolean => {
  if (!item.vehicle_type_name) return false;
  switch (item.vehicle_type_name.toLowerCase()) {
    case 'retail': return parseInt(item.retail_bill_type, 10) === 2;
    case 'repo':   return parseInt(item.repo_bill_type, 10) === 2;
    case 'cando':  return parseInt(item.cando_bill_type, 10) === 2;
    case 'asset':  return parseInt(item.asset_bill_type, 10) === 2;
    default:       return false;
  }
};

const getCashToCollect = (item: LeadFromDB): number => {
  const type = item.vehicle_type_name?.toLowerCase();
  if (type === 'repo')  return item.repo_fees_amount ?? 0;
  if (type === 'cando') return item.cando_fees_amount ?? 0;
  return item.retail_fees_amount ?? 0;
};

const MyTasksPage = () => {
  const navigation = useNavigation();
  const searchRef = useRef<any>(null);
  const { user } = useAppStore();

  const [allLeads, setAllLeads] = useState<LeadFromDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [selectedVehicleType, setSelectedVehicleType] = useState('2W');

  useFocusEffect(
    useCallback(() => {
      loadLeadsFromDB();
      loadPendingCounts();
    }, [])
  );

  const loadLeadsFromDB = async () => {
    try {
      setIsLoading(true);
      const rows = await select<LeadFromDB>('SELECT * FROM leads ORDER BY id DESC');
      setAllLeads(rows);
      console.log('[MyTasks] Leads from DB:', rows.length);
    } catch (e) {
      console.error('[MyTasks] loadLeadsFromDB error:', e);
      ToastAndroid.show('Failed to load tasks', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIX: Single batch call — N+1 problem solved
  const loadPendingCounts = async () => {
    try {
      const pendingByLead = await getPendingCountByLead();
      const counts: Record<string, number> = {};
      for (const item of pendingByLead) counts[item.lead_id] = item.count;
      setPendingCounts(counts);
    } catch (e) {
      console.error('[MyTasks] loadPendingCounts error:', e);
    }
  };

  const countsByVehicle = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const icon of DisplayIcons) {
      counts[icon.vehicleType] = allLeads.filter(l => l.vehicle_type_value === icon.vehicleType).length;
    }
    return counts;
  }, [allLeads]);

  const filteredTasks = useMemo(() => {
    let result = allLeads.filter(l => l.vehicle_type_value === selectedVehicleType);
    if (searchText.trim()) {
      const s = searchText.trim().toLowerCase();
      result = result.filter(l =>
        l.lead_uid?.toLowerCase().includes(s) ||
        l.customer_name?.toLowerCase().includes(s) ||
        l.chassis_no?.toLowerCase().includes(s) ||
        l.reg_no?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allLeads, selectedVehicleType, searchText]);

  const handleAppointment = (item: LeadFromDB) => {
    DateTimePickerAndroid.open({
      value: new Date(),
      minimumDate: new Date(),
      mode: 'date',
      onChange: async (event, date) => {
        if (event.type === 'dismissed' || !date || !user?.token) return;
        try {
          await confirmAppointmentApi(user.token, item.id, date.toISOString());
          await run('UPDATE leads SET appointment_date = ? WHERE id = ?', [date.toISOString(), item.id]);
          ToastAndroid.show('Appointment set successfully', ToastAndroid.SHORT);
          await loadLeadsFromDB();
        } catch {
          ToastAndroid.show('Failed to set appointment', ToastAndroid.SHORT);
        }
      },
    });
  };

  if (isLoading && allLeads.length === 0) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={ICON_STRIP_STYLE}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.iconContainer}>
            {DisplayIcons.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.iconButton, { backgroundColor: selectedVehicleType === item.vehicleType ? COLORS.AppTheme.success : '#fff' } as any]}
                onPress={() => setSelectedVehicleType(item.vehicleType)}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{countsByVehicle[item.vehicleType] || 0}</Text>
                </View>
                <item.icon />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableWithoutFeedback onPress={() => searchRef.current?.blur()}>
          <View style={styles.rowContainer}>
            <TextInput
              ref={searchRef}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search"
              style={styles.input}
              placeholderTextColor="grey"
            />
            <TouchableOpacity onPress={() => searchRef.current?.focus()}>
              <Feather name="search" size={22} color="#666" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>

        {filteredTasks.length > 0 ? (
          filteredTasks.map((item, index) => {
            const isRepoCase = item.vehicle_type_name?.toLowerCase() === 'repo';
            return (
              <SingleCard
                key={item.id || index}
                data={{
                  id: item.lead_uid?.toUpperCase(),
                  regNo: item.reg_no?.toUpperCase(),
                  vehicleName: item.vehicle_type_value,
                  chassisNo: item.chassis_no || 'NA',
                  client: isRepoCase ? item.company_name : item.customer_name,
                  companyName: item.company_name ?? '',
                  isCash: isBillingAllowed(item),
                  location: isRepoCase ? (item.yard_name || 'NA') : item.city_name,
                  requestId: item.lead_uid?.toUpperCase(),
                  cashToBeCollected: getCashToCollect(item),
                  engineNo: item.engine_no,
                  vehicleType: item.vehicle_type_id ?? '',
                  mobileNumber: item.customer_mobile,
                  leadType: item.vehicle_type_name,
                  leadId: item.id,
                  vehicleStatus: 'Active',
                }}
                vehicleType={selectedVehicleType}
                pendingImagesCount={pendingCounts[item.id] || 0}
                onValuateClick={() => {
                  // @ts-ignore
                  navigation.navigate('Valuate', {
                    leadId: item.id,
                    displayId: item.lead_uid?.toUpperCase(),
                    vehicleType: item.vehicle_type_value, // ✅ FIX: lead ka actual vehicleType
                    leadData: item,
                  });
                }}
                onAppointmentClick={() => handleAppointment(item)}
              />
            );
          })
        ) : (
          <View style={styles.empty}>
            <Text style={styles.noDataText}>No Data Found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyTasksPage;

const styles = StyleSheet.create({
  safe: { paddingTop: 10, flex: 1, backgroundColor: '#f3f4f6' },
  center: { justifyContent: 'center', alignItems: 'center' },
  iconContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#fca5a5', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  content: { flexGrow: 1, padding: 10 },
  rowContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 9, paddingHorizontal: 10, marginBottom: 20 },
  input: { flex: 1, paddingVertical: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noDataText: { fontSize: 18, fontWeight: '500' },
});