import React, { useState, useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { COLORS } from "../constants/Colors";
import { getLeadsByStatus } from "../services/LeadService";
import { convertDateString } from "../utils/convertDateString";
interface StatusLead {
  lead_uid: string;
  reg_no: string;
  customer_name: string;
  added_by_date: string;
  qc_update_date: string;
}

const LeadsInProgress = () => {
  const [leads, setLeads] = useState<StatusLead[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
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
