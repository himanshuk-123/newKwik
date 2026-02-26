/**
 * ValuationListScreen.tsx — Image Upload Status Per Lead
 * 
 * Dashboard -> "Valuate" card click -> Ye screen
 * 
 * Dikhata hai:
 *   - Har lead ka upload status
 *   - Kitni images uploaded
 *   - Kitni pending
 *   - Manual sync button per lead
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ToastAndroid,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../constants/Colors';
import { select } from '../database/db';
import { getPendingCountByLead, getImageStats } from '../database/imageCaptureDb';
import { uploadSingleImage } from '../services/Imageuploadservice';
import { useAppStore } from '../store/AppStore';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface LeadUploadStatus {
  leadId: string;
  leadUid: string;
  customerName: string;
  vehicleType: string;
  regNo: string;
  totalImages: number;
  uploadedImages: number;
  pendingImages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ValuationListScreen = () => {
  const { user } = useAppStore();
  const [leads, setLeads] = useState<LeadUploadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingLeadId, setSyncingLeadId] = useState<string | null>(null);
  const [overallStats, setOverallStats] = useState({
    total: 0,
    pending: 0,
    uploaded: 0,
    failed: 0,
  });

  // ── Load Data ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      // 1. Get overall stats
      const stats = await getImageStats();
      setOverallStats(stats);

      // 2. Get pending counts per lead
      const pendingByLead = await getPendingCountByLead();

      // 3. Get all leads that have captured images
      const leadsWithImages = await select<{
        lead_id: string;
        total: number;
        uploaded: number;
      }>(
        `SELECT 
          lead_id,
          COUNT(*) as total,
          SUM(CASE WHEN upload_status = 'uploaded' THEN 1 ELSE 0 END) as uploaded
         FROM image_captures
         GROUP BY lead_id`
      );

      // 4. Join with leads table to get details
      const enrichedLeads: LeadUploadStatus[] = [];
      
      for (const img of leadsWithImages) {
        const leadDetails = await select<{
          id: string;
          lead_uid: string;
          customer_name: string;
          vehicle_type_value: string;
          reg_no: string;
        }>(
          `SELECT id, lead_uid, customer_name, vehicle_type_value, reg_no
           FROM leads WHERE id = ?`,
          [img.lead_id]
        );

        if (leadDetails[0]) {
          const pending = pendingByLead.find(p => p.lead_id === img.lead_id)?.count || 0;
          
          enrichedLeads.push({
            leadId: img.lead_id,
            leadUid: leadDetails[0].lead_uid?.toUpperCase() || 'N/A',
            customerName: leadDetails[0].customer_name || 'Unknown',
            vehicleType: leadDetails[0].vehicle_type_value || 'N/A',
            regNo: leadDetails[0].reg_no?.toUpperCase() || 'N/A',
            totalImages: img.total,
            uploadedImages: img.uploaded,
            pendingImages: pending,
          });
        }
      }

      setLeads(enrichedLeads);
      console.log('[ValuationList] Loaded leads:', enrichedLeads.length);
    } catch (error) {
      console.error('[ValuationList] Load error:', error);
      ToastAndroid.show('Failed to load data', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ── Sync Single Lead ───────────────────────────────────────────────────────

  const syncLead = async (leadId: string) => {
    if (!user?.token) {
      ToastAndroid.show('No auth token', ToastAndroid.SHORT);
      return;
    }

    setSyncingLeadId(leadId);
    try {
      // Get pending images for this lead
      const pendingImages = await select<{
        id: number;
        lead_id: string;
        side: string;
        app_column: string;
        local_path: string;
        upload_status: string;
        retry_count: number;
      }>(
        `SELECT * FROM image_captures
         WHERE lead_id = ? AND upload_status IN ('pending', 'failed') AND retry_count < 3`,
        [leadId]
      );

      if (pendingImages.length === 0) {
        ToastAndroid.show('No pending images', ToastAndroid.SHORT);
        return;
      }

      // Upload all pending for this lead
      let uploaded = 0;
      let failed = 0;

      for (const img of pendingImages) {
        try {
          const success = await uploadSingleImage(user.token, img as any);
          if (success) {
            uploaded++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('[ValuationList] Upload error for image:', error);
          failed++;
        }
      }

      ToastAndroid.show(
        `Synced: ${uploaded} uploaded, ${failed} failed`,
        ToastAndroid.LONG
      );

      // Reload data
      await loadData();
    } catch (error) {
      console.error('[ValuationList] Sync error:', error);
      ToastAndroid.show('Sync failed. Try again.', ToastAndroid.SHORT);
    } finally {
      setSyncingLeadId(null);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* HEADER STATS */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{overallStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#4caf50' }]}>
          <Text style={styles.statValue}>{overallStats.uploaded}</Text>
          <Text style={styles.statLabel}>Uploaded</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#ff9800' }]}>
          <Text style={styles.statValue}>{overallStats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        {overallStats.failed > 0 && (
          <View style={[styles.statBox, { backgroundColor: '#f44336' }]}>
            <Text style={styles.statValue}>{overallStats.failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        )}
      </View>

      {/* LEADS LIST */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {leads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="image-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No valuations with images yet</Text>
          </View>
        ) : (
          leads.map((lead) => (
            <View key={lead.leadId} style={styles.card}>
              {/* LEAD INFO */}
              <View style={styles.cardHeader}>
                <View style={styles.leadInfo}>
                  <Text style={styles.leadId}>{lead.leadUid}</Text>
                  <Text style={styles.leadDetail}>{lead.customerName}</Text>
                  <Text style={styles.leadDetail}>
                    {lead.vehicleType} • {lead.regNo}
                  </Text>
                </View>
                
                {/* VEHICLE TYPE BADGE */}
                <View style={styles.vehicleBadge}>
                  <Text style={styles.vehicleBadgeText}>{lead.vehicleType}</Text>
                </View>
              </View>

              {/* PROGRESS BAR */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(lead.uploadedImages / lead.totalImages) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {lead.uploadedImages} / {lead.totalImages}
                </Text>
              </View>

              {/* IMAGE COUNTS */}
              <View style={styles.countsContainer}>
                <View style={styles.countBox}>
                  <MaterialCommunityIcons
                    name="image-multiple"
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.countText}>
                    {lead.totalImages} Total
                  </Text>
                </View>

                <View style={styles.countBox}>
                  <MaterialCommunityIcons
                    name="cloud-check"
                    size={20}
                    color="#4caf50"
                  />
                  <Text style={styles.countText}>
                    {lead.uploadedImages} Done
                  </Text>
                </View>

                {lead.pendingImages > 0 && (
                  <View style={styles.countBox}>
                    <MaterialCommunityIcons
                      name="cloud-upload"
                      size={20}
                      color="#ff9800"
                    />
                    <Text style={[styles.countText, { color: '#ff9800' }]}>
                      {lead.pendingImages} Pending
                    </Text>
                  </View>
                )}
              </View>

              {/* SYNC BUTTON */}
              {lead.pendingImages > 0 && (
                <TouchableOpacity
                  style={[
                    styles.syncButton,
                    syncingLeadId === lead.leadId && styles.syncButtonDisabled,
                  ]}
                  onPress={() => syncLead(lead.leadId)}
                  disabled={syncingLeadId === lead.leadId}
                >
                  {syncingLeadId === lead.leadId ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="cloud-sync"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.syncButtonText}>Sync Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ValuationListScreen;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadId: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  leadDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  vehicleBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vehicleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    minWidth: 50,
  },
  countsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  countBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countText: {
    fontSize: 13,
    color: '#666',
  },
  syncButton: {
    flexDirection: 'row',
    backgroundColor: '#ff9800',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
