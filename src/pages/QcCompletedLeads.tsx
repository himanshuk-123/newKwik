import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { COLORS } from "../constants/Colors";
import { useFocusEffect } from "@react-navigation/native";
import { getLeadsByStatus } from "../services/LeadService";
import { convertDateString } from "../utils/convertDateString";

interface StatusLead {
  lead_uid: string;
  reg_no: string;
  prospect_no: string;
  view_url: string;
  added_by_date: string;
  updated_by_date: string;
}

const openUrlInBrowser = async (url?: string) => {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error("[QCCompletedLeads] Failed to open URL:", error);
  }
};

const LeadCard = ({ lead }: { lead: StatusLead }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.topLeftComponent}>
          <Text style={styles.textMdSecondary} numberOfLines={1}>
            Lead Id: <Text style={styles.textBold}>{lead.lead_uid || "NA"}</Text>
          </Text>
          <Text style={styles.textMdSecondary} numberOfLines={1}>
            Reg. Number: <Text style={styles.textBold}>{lead.reg_no || "NA"}</Text>
          </Text>
          <Text style={styles.textMdSecondary} numberOfLines={1}>
            Loan Number: <Text style={styles.textBold}>{lead.prospect_no || "NA"}</Text>
          </Text>
        </View>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={() => openUrlInBrowser(lead.view_url)}>
            <Feather name="eye" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardRowBottom}>
        <View style={styles.bottomLeftColumn}>
          <Text style={styles.textMdSecondary}>Created Date</Text>
          <Text style={styles.textMdPrimary}>
            {convertDateString(lead.added_by_date)}
          </Text>
        </View>
        <View style={styles.bottomRightColumn}>
          <Text style={[styles.textMdSecondary, styles.textRight]}>
            Completed Date
          </Text>
          <Text style={[styles.textMdPrimary, styles.textCompleted]}>
            {convertDateString(lead.updated_by_date)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function QCCompletedLeads() {
  const [qcCompletedLeads, setQcCompletedLeads] = useState<StatusLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getLeadsByStatus('PricingLeads');
      setQcCompletedLeads(data as StatusLead[]);
    } catch (error) {
      console.error("[QCCompletedLeads] DB read error:", error);
      setQcCompletedLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.pagePadding}>
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
            <Text style={styles.loaderText}>Loading...</Text>
          </View>
        )}
        <View style={styles.container}>
          {qcCompletedLeads.length > 0 ? (
            qcCompletedLeads.map((lead) => (
              <LeadCard key={lead.lead_uid} lead={lead} />
            ))
          ) : (
            !isLoading && (
              <View style={styles.noLeadsContainer}>
                <Text style={styles.noLeadsText}>No leads found.</Text>
              </View>
            )
          )}
        </View>
      </View>
    </ScrollView>
  );
}

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
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  topLeftComponent: {
    flex: 1,
    flexDirection: "column",
    gap: 6,
    paddingRight: 8,
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
  },
  cardRowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bottomLeftColumn: {
    flexDirection: "column",
  },
  bottomRightColumn: {
    flexDirection: "column",
  },
  textMdSecondary: {
    fontSize: 14,
    color:"#0c0c0c",
    fontWeight: "600",
  },
  textMdPrimary: {
    fontSize: 14,
    color: COLORS.AppTheme.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  textBold: {
    fontWeight: "500",
    color: "#4c4d4e",
  },
  textRight: {
    textAlign: "right",
  },
  textCompleted: {
    color: COLORS.Dashboard?.text?.Green || COLORS.AppTheme.primary,
  },
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  loaderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#4b5563",
  },
  noLeadsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noLeadsText: {
    fontSize: 16,
    color: "#6b7280",
  },
});
