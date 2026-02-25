/**
 * CreateLead Store
 * Sab dropdowns local DB se aate hain
 * Submit: online → API, offline → pending_leads table
 */

import { create } from 'zustand';
import { select, run } from '../database/db';
import { submitCreateLeadApi, CreateLeadPayload } from '../services/ApiClient';
import { useAppStore } from '../store/AppStore';
import {STATE_CITY_LIST} from '../constants/StateCityList';
import NetInfo from '@react-native-community/netinfo';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateLeadFormData {
  clientName: string;
  clientId: string;
  vehicleType: string;
  vehicleTypeId: string;
  vehicleCategory: string;
  clientCity: string;
  registrationNumber: string;
  prospectNumber: string;
  customerName: string;
  customerMobile: string;
  customerState: string;
  customerStateId: string;
  customerCity: string;
  customerCityId: string;
  customerArea: string;
  customerAreaId: string;
  customerPin: string;
  customerAddress: string;
  yardName: string;
  yardId: string;
  chassisNo: string;
}

interface DropdownItem {
  id: string;
  name: string;
}

interface AreaItem extends DropdownItem {
  pincode: string;
}

interface DropdownData {
  companies: DropdownItem[];
  vehicleTypes: DropdownItem[];
  yards: DropdownItem[];
  customerCities: DropdownItem[];
  areas: AreaItem[];
  clientCities: string[];
  states: string[];
}

interface CreateLeadState {
  formData: CreateLeadFormData;
  dropdowns: DropdownData;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;

  initialize: () => Promise<void>;
  setField: (key: keyof CreateLeadFormData, value: string) => void;
  loadVehicleTypesForCompany: (companyId: string) => Promise<void>;
  loadCitiesForState: (stateId: string) => void;
  loadYardsForState: (stateId: string) => Promise<void>;
  loadAreasForCity: (cityId: string) => Promise<void>;
  submit: () => Promise<boolean>;
  reset: () => void;
}

const INITIAL_FORM: CreateLeadFormData = {
  clientName: '', clientId: '',
  vehicleType: '', vehicleTypeId: '',
  vehicleCategory: '',
  clientCity: '',
  registrationNumber: '',
  prospectNumber: '',
  customerName: '',
  customerMobile: '',
  customerState: '', customerStateId: '',
  customerCity: '', customerCityId: '',
  customerArea: '', customerAreaId: '',
  customerPin: '',
  customerAddress: '',
  yardName: '', yardId: '',
  chassisNo: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useCreateLeadStore = create<CreateLeadState>((set, get) => ({
  formData: { ...INITIAL_FORM },
  dropdowns: {
    companies: [],
    vehicleTypes: [],
    yards: [],
    customerCities: [],
    areas: [],
    clientCities: [],
    states: [],
  },
  isLoading: false,
  error: null,
  successMessage: null,

  // ── Initialize ──────────────────────────────────────────────────────────

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Constants se states aur cities
      const allStates = STATE_CITY_LIST.STATE_LIST.CircleList.map(s => s.name);
      const allClientCities = STATE_CITY_LIST.CITY_LIST.DataRecord.map(c => c.name);

      // 2. DB se companies
      const companies = await select<{ id: string; name: string }>(
        'SELECT id, name FROM companies ORDER BY name'
      );

      set(state => ({
        dropdowns: {
          ...state.dropdowns,
          states: allStates,
          clientCities: allClientCities,
          companies,
        },
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  // ── Set Field ───────────────────────────────────────────────────────────

  setField: (key, value) => set(state => ({
    formData: { ...state.formData, [key]: value }
  })),

  // ── Load Vehicle Types (DB se) ──────────────────────────────────────────

  loadVehicleTypesForCompany: async (companyId: string) => {
    set({ isLoading: true });
    try {
      const vehicleTypes = await select<{ id: string; name: string }>(
        'SELECT id, name FROM vehicle_types WHERE company_id = ? ORDER BY name',
        [companyId]
      );
      set(state => ({
        dropdowns: { ...state.dropdowns, vehicleTypes },
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  // ── Load Cities for State (Constants se — instant) ──────────────────────

  loadCitiesForState: (stateId: string) => {
    const cities = STATE_CITY_LIST.CITY_LIST.DataRecord
      .filter(c => String(c.stateid) === stateId)
      .map(c => ({ id: String(c.id), name: c.name }));

    set(state => ({
      dropdowns: { ...state.dropdowns, customerCities: cities }
    }));
  },

  // ── Load Yards for State (DB se) ────────────────────────────────────────

  loadYardsForState: async (stateId: string) => {
    set({ isLoading: true });
    try {
      const yards = await select<{ id: string; name: string }>(
        'SELECT id, name FROM yards WHERE state_id = ? ORDER BY name',
        [stateId]
      );
      set(state => ({
        dropdowns: { ...state.dropdowns, yards },
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  // ── Load Areas for City (DB se — background sync ne fill kiya hoga) ─────

  loadAreasForCity: async (cityId: string) => {
    set({ isLoading: true });
    try {
      const areas = await select<{ id: string; name: string; pincode: string }>(
        'SELECT id, name, pincode FROM areas WHERE city_id = ? ORDER BY name',
        [cityId]
      );
      set(state => ({
        dropdowns: { ...state.dropdowns, areas },
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  // ── Submit ──────────────────────────────────────────────────────────────

  submit: async () => {
    const { formData } = get();
    set({ isLoading: true, error: null });

    const isRepo = formData.vehicleType.toLowerCase() === 'repo';
    const clientCityObj = STATE_CITY_LIST.CITY_LIST.DataRecord.find(
      c => c.name === formData.clientCity
    );

    const payload: CreateLeadPayload = {
      Id: 0,
      CompanyId: Number(formData.clientId || 0),
      RegNo: formData.registrationNumber.toUpperCase(),
      ProspectNo: formData.prospectNumber.toUpperCase(),
      CustomerName: formData.customerName.toUpperCase(),
      CustomerMobileNo: formData.customerMobile,
      Vehicle: formData.vehicleCategory.toUpperCase(),
      StateId: Number(formData.customerStateId || 0),
      City: !isRepo && formData.customerCityId ? Number(formData.customerCityId) : '',
      Area: !isRepo && formData.customerAreaId ? Number(formData.customerAreaId) : '',
      Pincode: formData.customerPin,
      ManufactureDate: '',
      ChassisNo: isRepo ? formData.chassisNo.toUpperCase() : '',
      EngineNo: '',
      StatusId: 1,
      ClientCityId: clientCityObj ? Number(clientCityObj.id) : '',
      VehicleType: Number(formData.vehicleTypeId || 0),
      vehicleCategoryId: 0,
      VehicleTypeValue: formData.vehicleCategory.toUpperCase(),
      YardId: isRepo && formData.yardId ? Number(formData.yardId) : 0,
      AutoAssign: 1,
    };

    // Network check
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (!isOnline) {
      // Offline → pending_leads mein save karo
      await run(
        "INSERT INTO pending_leads (payload, status) VALUES (?, 'pending')",
        [JSON.stringify(payload)]
      );
      set({
        successMessage: 'Lead saved offline. Will sync when online.',
        isLoading: false,
      });
      return true;
    }

    // Online → seedha API call
    try {
      const { user } = useAppStore.getState();
      const token = user?.token;
      if (!token) throw new Error('No token found');

      const response = await submitCreateLeadApi(token, payload);
      if (response.ERROR === '0') {
        set({ successMessage: response.MESSAGE || 'Lead Created Successfully', isLoading: false });
        return true;
      } else {
        set({ error: response.MESSAGE || 'Submission Failed', isLoading: false });
        return false;
      }
    } catch (e: any) {
      // API fail → offline save
      await run(
        "INSERT INTO pending_leads (payload, status) VALUES (?, 'pending')",
        [JSON.stringify(payload)]
      );
      set({
        successMessage: 'Lead saved offline. Will sync when online.',
        isLoading: false,
      });
      return true;
    }
  },

  // ── Reset ───────────────────────────────────────────────────────────────

  reset: () => set(state => ({
    formData: { ...INITIAL_FORM },
    dropdowns: {
      ...state.dropdowns,
      vehicleTypes: [],
      yards: [],
      customerCities: [],
      areas: [],
    },
    isLoading: false,
    error: null,
    successMessage: null,
  })),
}));