/**
 * ValuationListScreen — Image Upload Status per Lead
 * Shows upload progress for each lead with sync button
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, ToastAndroid,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/Colors';
import { select } from '../database/db';
import { getPendingCountByLead } from '../database/imageCaptureDb';
import { uploadSingleImage } from '../services/Imageuploadservice';
import { getAppSteps } from '../services/AppStepService';
import { useAppStore } from '../store/AppStore';
import { SyncManager } from '../services/Syncmanager';

interface LeadUploadStatus {
  leadId: string;
  leadUid: string;
  customerName: string;
  vehicleType: string;
  regNo: string;
  totalCards: number;     // total cards for that vehicle type (from app_steps)
  totalCaptured: number;  // images/video actually captured
  uploadedImages: number; // successfully uploaded to server
  pendingImages: number;  // pending + failed
}

const ValuationListScreen = () => {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<LeadUploadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingLeadId, setSyncingLeadId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const pendingByLead = await getPendingCountByLead();
      const pendingMap: Record<string, number> = {};
      for (const p of pendingByLead) pendingMap[p.lead_id] = p.count;

      // JOIN with status_leads (not deleted 'leads' table)
      const rows = await select<{
        lead_id: string;
        total: number;
        uploaded: number;
        lead_uid: string;
        customer_name: string;
        vehicle_type_value: string;
        reg_no: string;
      }>(
        `SELECT 
          ic.lead_id,
          COUNT(*) as total,
          SUM(CASE WHEN ic.upload_status = 'uploaded' THEN 1 ELSE 0 END) as uploaded,
          sl.lead_uid,
          sl.customer_name,
          sl.vehicle_type_value,
          sl.reg_no
         FROM image_captures ic
         LEFT JOIN status_leads sl ON ic.lead_id = sl.id
         GROUP BY ic.lead_id
         ORDER BY MAX(ic.created_at) DESC`
      );

      // Build total-cards-per-vehicle-type cache from app_steps DB
      const vehicleTypes = [...new Set(rows.map(r => r.vehicle_type_value).filter(Boolean))];
      const totalCardsMap: Record<string, number> = {};
      for (const vt of vehicleTypes) {
        try {
          const steps = await getAppSteps(vt);
          if (steps) {
            // Count only image/video cards (Images !== false)
            totalCardsMap[vt] = steps.filter(s => s.Images !== false).length;
          }
        } catch { /* ignore */ }
      }

      const enriched: LeadUploadStatus[] = rows.map(row => {
        const vt = row.vehicle_type_value || '';
        const totalCards = totalCardsMap[vt] || row.total; // fallback to captured count
        return {
          leadId: row.lead_id,
          leadUid: row.lead_uid?.toUpperCase() || row.lead_id,
          customerName: row.customer_name || 'Unknown',
          vehicleType: vt,
          regNo: row.reg_no?.toUpperCase() || '',
          totalCards,
          totalCaptured: row.total || 0,
          uploadedImages: row.uploaded || 0,
          pendingImages: pendingMap[row.lead_id] || 0,
        };
      });

      setLeads(enriched);
    } catch (e) {
      console.error('[ValuationList] Load error:', e);
      ToastAndroid.show('Failed to load data', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const syncLead = async (leadId: string) => {
    if (!user?.token) { ToastAndroid.show('No auth token', ToastAndroid.SHORT); return; }
    setSyncingLeadId(leadId);
    try {
      const pendingImages = await select<any>(
        `SELECT * FROM image_captures WHERE lead_id = ? AND upload_status IN ('pending', 'failed')`,
        [leadId]
      );
      if (!pendingImages.length) { ToastAndroid.show('No pending images', ToastAndroid.SHORT); return; }

      let uploaded = 0, failed = 0;
      for (const img of pendingImages) {
        const success = await uploadSingleImage(user.token, img);
        if (success) uploaded++; else failed++;
      }
      ToastAndroid.show(`Synced: ${uploaded} uploaded, ${failed} failed`, ToastAndroid.LONG);
      // Images ke baad vehicle details bhi sync karo
      SyncManager.kick();
      await loadData();
    } catch (e) {
      console.error('[ValuationList] Sync error:', e);
      ToastAndroid.show('Sync failed. Try again.', ToastAndroid.SHORT);
    } finally {
      setSyncingLeadId(null);
    }
  };

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}>
        {leads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="image-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No valuations with images yet</Text>
          </View>
        ) : (
          leads.map(lead => {
            const displayUploaded = Math.min(lead.uploadedImages, lead.totalCards);
            const pct = lead.totalCards > 0 ? Math.round((displayUploaded / lead.totalCards) * 100) : 0;
            const allDone = lead.uploadedImages >= lead.totalCards && lead.totalCards > 0;

            return (
              <View key={lead.leadId} style={styles.card}>
                {/* Header — Lead info + vehicle badge */}
                <View style={styles.cardHeader}>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadId}>{lead.leadUid}</Text>
                    <Text style={styles.leadDetail}>{lead.customerName}</Text>
                    {lead.regNo ? <Text style={styles.leadDetail}>{lead.regNo}</Text> : null}
                  </View>
                  {lead.vehicleType ? (
                    <View style={styles.vehicleBadge}>
                      <Text style={styles.vehicleBadgeText}>{lead.vehicleType}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, allDone && styles.progressFillDone, { width: `${Math.min(pct, 100)}%` as any }]} />
                  </View>
                  <Text style={styles.progressText}>{displayUploaded}/{lead.totalCards}</Text>
                </View>

                {/* Sync button or All Done */}
                {lead.pendingImages > 0 ? (
                  <TouchableOpacity
                    style={[styles.syncButton, syncingLeadId === lead.leadId && styles.syncButtonDisabled]}
                    onPress={() => syncLead(lead.leadId)}
                    disabled={syncingLeadId === lead.leadId}
                  >
                    {syncingLeadId === lead.leadId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="cloud-sync" size={18} color="#fff" />
                        <Text style={styles.syncButtonText}>Sync {lead.pendingImages} Pending</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : allDone ? (
                  <View style={styles.allDoneRow}>
                    <MaterialCommunityIcons name="check-circle" size={18} color="#4caf50" />
                    <Text style={styles.allDoneText}>All Uploaded</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default ValuationListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scrollView: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8,
    borderRadius: 12, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  leadInfo: { flex: 1 },
  leadId: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 2 },
  leadDetail: { fontSize: 13, color: '#666', marginBottom: 1 },
  vehicleBadge: { backgroundColor: '#e3f2fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  vehicleBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#ff9800', borderRadius: 4 },
  progressFillDone: { backgroundColor: '#4caf50' },
  progressText: { fontSize: 13, fontWeight: '600', color: '#666', minWidth: 50 },
  syncButton: {
    flexDirection: 'row', backgroundColor: '#ff9800', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  allDoneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  allDoneText: { fontSize: 14, fontWeight: '600', color: '#4caf50' },
});