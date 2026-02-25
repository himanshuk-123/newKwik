import { DashboardRecord } from '../types/api';
import { select, run } from '../database/db';

/** Login ke baad syncService yahan save karta hai */
export const saveDashboard = async (userId: string, record: DashboardRecord): Promise<void> => {
  await run('DELETE FROM dashboard WHERE user_id = ?', [userId]);
  await run(
    `INSERT INTO dashboard
      (user_id, name, open_lead, ro_lead, assigned_lead, re_assigned,
       ro_confirmation, qc, qc_hold, pricing, completed_leads,
       out_of_tat_leads, duplicate_leads, payment_request, rejected_leads,
       sc_leads, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      userId,
      record.Name,
      record.Openlead,
      record.ROlead,
      record.Assignedlead,
      record.ReAssigned,
      record.RoConfirmation,
      record.QC,
      record.QCHold,
      record.Pricing,
      record.CompletedLeads,
      record.OutofTATLeads,
      record.DuplicateLeads,
      record.PaymentRequest,
      record.RejectedLeads,
      record.SCLeads,
    ]
  );
};

/** Dashboard screen sirf yahi call karegi — seedha DB se */
export const getDashboard = async (userId: string): Promise<DashboardRecord | null> => {
  console.log('[DB] getDashboard called with userId:', userId);

  try {
    const rows = await select<any>(
      'SELECT * FROM dashboard WHERE user_id = ? LIMIT 1',
      [userId]
    );
    console.log('[DB] Raw rows from dashboard table:', JSON.stringify(rows));

    if (!rows[0]) {
      console.log('[DB] No dashboard row found for userId:', userId);
      return null;
    }

    const r = rows[0];
    console.log('[DB] Mapping row:', JSON.stringify(r));

    return {
      Name: r.name,
      Openlead: r.open_lead,
      ROlead: r.ro_lead,
      Assignedlead: r.assigned_lead,
      ReAssigned: r.re_assigned,
      RoConfirmation: r.ro_confirmation,
      QC: r.qc,
      QCHold: r.qc_hold,
      Pricing: r.pricing,
      CompletedLeads: r.completed_leads,
      OutofTATLeads: r.out_of_tat_leads,
      DuplicateLeads: r.duplicate_leads,
      PaymentRequest: r.payment_request,
      RejectedLeads: r.rejected_leads,
      SCLeads: r.sc_leads,
    };
  } catch (e) {
    console.error('[DB] getDashboard ERROR:', e);
    return null;
  }
};