import React, { useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, RefreshControl, ToastAndroid } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { COLORS } from "../constants/Colors";
import { getLeadsByStatus, fetchAndSaveLeadsByStatus } from "../services/LeadService";
import { useAppStore } from "../store/AppStore";
import { convertDateString } from "../utils/convertDateString";
interface StatusLead {
  lead_uid: string;
  reg_no: string;
  customer_name: string;
  added_by_date: string;
  qc_update_date: string;
}

const LeadsInProgress = () => {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<StatusLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLeadsByStatus('QCHoldLeads');
      setLeads(data as StatusLead[]);
    } catch (err) {
      console.error('[LeadsInProgress] Error loading QCHoldLeads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeads();
    }, [loadLeads])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected && user?.token) {
        await fetchAndSaveLeadsByStatus(user.token, 'QCHoldLeads');
        console.log('[LeadsInProgress] ✅ Refreshed from server');
      } else {
        ToastAndroid.show('Offline — showing cached data', ToastAndroid.SHORT);
      }
      await loadLeads();
    } catch (e) {
      console.error('[LeadsInProgress] Refresh error:', e);
      ToastAndroid.show('Refresh failed', ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  }, [user?.token, loadLeads]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.AppTheme.primary]} />
      }
    >
      <View style={styles.pagePadding}>
        <View style={styles.container}>
          {leads.length > 0 ? (
            leads.map((lead) => (
              <View key={lead.lead_uid} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.leftColumn}>
                    <Text style={styles.textMdPrimary} numberOfLines={1}>
                      Lead Id: <Text style={styles.textBold}>{lead.lead_uid}</Text>
                    </Text>
                    <Text style={styles.textMdPrimary} numberOfLines={1}>
                      Reg. Number: <Text style={styles.textBold}>{lead.reg_no}</Text>
                    </Text>
                    <Text style={styles.textMdSecondary} numberOfLines={1}>
                      Name: <Text style={styles.textUpper}>{lead.customer_name}</Text>
                    </Text>
                  </View>
                  <View style={styles.rightColumn}>
                    <Text style={styles.textLabel}>Created Date</Text>
                    <Text style={styles.textValue}>{convertDateString(lead.added_by_date)}</Text>
                  </View>
                </View>

                <View style={styles.cardRowBottom}>
                  <Text style={styles.statusText}>pending with qc</Text>
                  <View style={styles.rightColumn}>
                    <Text style={styles.textLabel}>Valuated Date</Text>
                    <Text style={styles.textValue}>{convertDateString(lead.qc_update_date) || 'NA'}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noLeadsContainer}>
              <Text style={styles.noLeadsText}>No leads in progress</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
export default LeadsInProgress;
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  pagePadding: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  container: {
    gap: 14,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardRowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  leftColumn: {
    flex: 1,
    gap: 6,
    paddingRight: 8,
  },
  rightColumn: {
    gap: 4,
    alignItems: "flex-end",
  },
  textMdPrimary: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  textMdSecondary: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  textBold: {
    fontSize: 14,
    color: COLORS.AppTheme.primary,
    fontWeight: "700",
  },
  textUpper: {
    fontSize: 14,
    color: COLORS.AppTheme.primary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  textLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  textValue: {
    fontSize: 16,
    color: COLORS.AppTheme.primary,
    fontWeight: "700",
    textAlign: "right",
  },
  statusText: {
    fontSize: 14,
    color: COLORS.Dashboard.text.Orange,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  noLeadsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  noLeadsText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});
