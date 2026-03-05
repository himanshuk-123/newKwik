import React, { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ViewStyle, RefreshControl, ToastAndroid } from 'react-native';
import { COLORS } from '../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { getLeadsByStatus, fetchAndSaveLeadsByStatus } from '../services/LeadService';
import { getDaybook, fetchAndSaveDaybook } from '../services/AppLeadDaybook';
import { useAppStore } from '../store/AppStore';
import { openUrlInBrowser } from '../utils/openUrlInBrowser';
import { share } from '../utils/share';
import { convertDateString } from '../utils/convertDateString';

interface StatusLead {
  lead_uid: string;
  reg_no: string;
  prospect_no: string;
  view_url: string;
  download_url: string;
  added_by_date: string;
  price_update_date: string;
}

interface DayBookData {
  lastmonth: number;
  thismonth: number;
  Today: number;
}

interface CounterProps {
  primaryText: string;
  count: string | number;
  backgroundStyle: ViewStyle;
}

const Counter = (props: CounterProps) => {
  return (
    <View style={[styles.counterContainer, props.backgroundStyle]}>
      <Text style={styles.counterPrimaryText}>{props.primaryText}</Text>
      <Text style={styles.counterCount}>{props.count}</Text>
    </View>
  );
};

const ValuationCompletedLeadsPage = () => {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<StatusLead[]>([]);
  const [dayBook, setDayBook] = useState<DayBookData>({ lastmonth: 0, thismonth: 0, Today: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leadsData, dayBookData] = await Promise.all([
        getLeadsByStatus('CompletedLeads'),
        getDaybook(),
      ]);
      setLeads(leadsData as StatusLead[]);
      setDayBook(dayBookData);
    } catch (error) {
      console.error('[ValuationCompleted] DB read error:', error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const netState = await NetInfo.fetch();
      if (netState.isConnected && user?.token) {
        await Promise.all([
          fetchAndSaveLeadsByStatus(user.token, 'CompletedLeads'),
          fetchAndSaveDaybook(user.token),
        ]);
        console.log('[ValuationCompleted] ✅ Refreshed from server');
      } else {
        ToastAndroid.show('Offline — showing cached data', ToastAndroid.SHORT);
      }
      await loadData();
    } catch (e) {
      console.error('[ValuationCompleted] Refresh error:', e);
      ToastAndroid.show('Refresh failed', ToastAndroid.SHORT);
    } finally {
      setRefreshing(false);
    }
  }, [user?.token, loadData]);

  const renderHeader = () => (
    <View style={styles.counterStack}>
      <Counter
        backgroundStyle={{ backgroundColor: COLORS.Dashboard.bg.Blue }}
        primaryText="TODAY'S COUNT"
        count={dayBook.Today}
      />
      <Counter
        backgroundStyle={{ backgroundColor: COLORS.Dashboard.bg.Green }}
        primaryText="TDM"
        count={dayBook.thismonth}
      />
      <Counter
        backgroundStyle={{ backgroundColor: COLORS.Dashboard.bg.Orange }}
        primaryText="PREV'S MONTH"
        count={dayBook.lastmonth}
      />
    </View>
  );

  if (isLoading && leads.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.AppTheme.primary} />
      </View>
    );
  }

  const renderItem = ({ item }: { item: StatusLead }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.columnDisplay}>
          <Text style={styles.textMd} numberOfLines={1}>
            Lead Id: <Text style={{ fontWeight: 'bold', color: 'black' }}>{item.lead_uid || 'NA'}</Text>
          </Text>
          <Text style={styles.textMd} numberOfLines={1}>
            Reg. Number : <Text style={{ fontWeight: 'bold', color: 'black' }}>{item.reg_no || 'NA'}</Text>
          </Text>
          <Text style={styles.textMd} numberOfLines={1}>
            Loan Number: <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', color: 'black' }}>{item.prospect_no || 'NA'}</Text>
          </Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => openUrlInBrowser(item.view_url)}>
            <Feather name="eye" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openUrlInBrowser(item.download_url)}>
            <Feather name="download-cloud" size={20} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => share(item.view_url)}>
            <Feather name="share" size={20} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardRowBottom}>
        <View style={styles.columnDisplay}>
          <Text style={styles.textSecondary}>Created Date</Text>
          <Text style={[styles.textMd, { fontWeight: '600', color: COLORS.AppTheme.primary }]}>
            {convertDateString(item.added_by_date)}
          </Text>
        </View>
        <View style={[styles.columnDisplay, { alignItems: 'flex-end' }]}>
          <Text style={styles.textSecondary}>Completed Date</Text>
          <Text style={[styles.textMd, { fontWeight: '600', color: COLORS.Dashboard.text.Green }]}>
            {convertDateString(item.price_update_date)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={renderHeader}
        data={leads}
        renderItem={renderItem}
        keyExtractor={(item) => item.lead_uid?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.AppTheme.primary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.center}>
              <Text style={styles.textXl}>No completed leads found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  columnDisplay: {
    flexDirection: 'column',
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 15, // $3 gap approx
  },
  textMd: {
    fontSize: 14,
    color: '#666',
  },
  textXl: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  textSecondary: {
    fontSize: 12,
    color: '#888',
  },
  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardRowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
  },
  // Counter styles
  counterStack: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },
  counterContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 85,
    width: 100, // slightly adjusted from Expo 110 to fit different screens
    borderRadius: 8,
    paddingVertical: 10,
    paddingBottom: 15,
  },
  counterPrimaryText: {
    fontSize: 12,
    color: '#333',
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  counterCount: {
    fontSize: 24,
    color: COLORS.AppTheme.primary,
    textAlign: "center",
    fontWeight: "600",
  },
});

export default ValuationCompletedLeadsPage;
