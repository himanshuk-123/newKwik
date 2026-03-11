import React, { useCallback, useMemo, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import { PieChart } from "react-native-gifted-charts";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "../constants/Colors";
import { useAppStore } from "../store/AppStore";
import { select } from "../database";

type DisplayProps = {
  value: number;
  text: string;
  icon: string;
  color: "Grey" | "Orange" | "Blue" | "Green";
   redirectTo?: string;
};

const DisplayComponent = ({
  value,
  text,
  icon,
  color,
  redirectTo
}: DisplayProps) => {
  const navigation = useNavigation<any>();  
  return (
    <View style={styles.displayContainer}>
      <View
        style={[
          styles.displayValueContainer,
          { backgroundColor: COLORS.Dashboard.bg[color] },
        ]}
      >
        <Text
          style={[
            styles.valueText,
            { color: COLORS.Dashboard.text[color] },
          ]}
        >
          {value}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!redirectTo}
        onPress={() => redirectTo && navigation.navigate(redirectTo)}
        style={styles.displayTextContainer}
      >
        <MaterialIcons
          name={icon as any}
          size={24}
          color={COLORS.Dashboard.text[color]}
        />

        <Text style={styles.displayText}>{text}</Text>

        <FontAwesome6
          name="arrow-right"
          size={18}
          solid
          color={COLORS.Dashboard.text[color]}
          style={styles.arrowIcon}
        />
        </TouchableOpacity>
            </View>
  );
};

const Dashboard = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { dashboard, dashboardLoading, fetchDashboard, user, logoutUser } =
    useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [hasRefreshedOnce, setHasRefreshedOnce] = useState(false);
  const [valuatingCount, setValuatingCount] = useState(0);

  // Count of leads with image captures (active valuations)
  const loadValuatingCount = useCallback(async () => {
    try {
      const rows = await select<{ cnt: number }>(
        'SELECT COUNT(DISTINCT lead_id) as cnt FROM image_captures'
      );
      setValuatingCount(rows[0]?.cnt ?? 0);
    } catch { setValuatingCount(0); }
  }, []);

  // 1. Initial Fetch on Mount
  useEffect(() => {
    if (!hasRefreshedOnce && user) {
      fetchDashboard();
      setHasRefreshedOnce(true);
    }
  }, [fetchDashboard, hasRefreshedOnce, user]);
const fetchImageDatabase = async () =>{
  const res = await select('SELECT * FROM pending_leads');
  console.log('ImageLeads from DB:', res);
}
  // 2. Pull Request Handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), loadValuatingCount()]);
    setRefreshing(false);
  }, [fetchDashboard, loadValuatingCount]);

  // 3. Refresh dashboard when coming back
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
      loadValuatingCount();
    }, [fetchDashboard, loadValuatingCount])
  );

  // Safe data extraction
  const assigned = dashboard?.Assignedlead ?? 0;
  const qcHold = dashboard?.QCHold ?? 0;
  const completed = dashboard?.CompletedLeads ?? 0;
  const totalLeads = assigned + qcHold + completed;

  const pieData = useMemo(() => {
    if (totalLeads === 0) return [];

    return [
      { value: assigned, color: COLORS.Dashboard.bg.Grey },
      { value: qcHold, color: COLORS.Dashboard.text.Blue },
      { value: completed, color: COLORS.Dashboard.text.Green },
    ];
  }, [assigned, qcHold, completed, totalLeads]);

  // Loading state
  if (dashboardLoading && !refreshing && !dashboard) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.AppTheme.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.helloText}>Hello,</Text>
        <Text style={styles.nameText}>{dashboard?.Name ?? "User"}</Text>

        {pieData.length > 0 && (
          <View style={styles.chartWrapper}>
            <PieChart
              data={pieData}
              radius={60}
              isAnimated
              animationDuration={1200}
            />
          </View>
        )}

        <DisplayComponent
          value={assigned}
          text="Assigned"
          icon="content-copy"
          color="Grey"
          redirectTo="MyTasks"
        />
        <DisplayComponent
          value={valuatingCount}
          text="Valuate"
          icon="content-copy"
          color="Orange"
          redirectTo="ValuationList"
        />
        <DisplayComponent
          value={qcHold}
          text="Progress"
          icon="pending-actions"
          color="Blue"
          redirectTo="LeadsInProgress"
        />

        <DisplayComponent
          value={completed}
          text="Completed"
          icon="assignment-turned-in"
          color="Green"
          redirectTo="ValuationCompletedLeads"
        />



      </ScrollView>


      <View style={[styles.createBtnWrapper, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("CreateLeads")}
        >
          <Text style={styles.createBtnText}>CREATE LEAD</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Dashboard;

/* styles unchanged */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  helloText: {
    fontSize: 18,
    marginTop: 10,
  },
  nameText: {
    fontSize: 30,
    fontWeight: "700",
    color: COLORS.AppTheme.primary,
    marginBottom: 20,
    maxWidth: "80%",
  },
  chartWrapper: {
    alignItems: "center",
    marginVertical: 20,
    paddingRight: 10,
  },
  displayContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  displayValueContainer: {
    padding: 12,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "700",
  },
  displayTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.Dashboard.bg.Grey,
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  displayText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  arrowIcon: {
    position: "absolute",
    right: 12,
  },
  createBtnWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  createBtn: {
    backgroundColor: COLORS.AppTheme.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ffebee",
    gap: 8,
  },
  logoutText: {
    color: "#f44336",
    fontSize: 16,
    fontWeight: "600",
  },
});
