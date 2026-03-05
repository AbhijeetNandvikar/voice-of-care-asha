import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from './database';
import {
  Worker,
  Beneficiary,
  VisitTemplate,
  Visit,
  VisitData,
  InitData,
} from '../types';

// Additional types for database operations
export interface VisitCreate {
  visit_type: string;
  visit_date_time: string;
  day_number?: number;
  assigned_asha_id: number;
  beneficiary_id: number;
  template_id: number;
  visit_data: VisitData;
  meta_data?: Record<string, any>;
}

export interface VisitFilters {
  beneficiary_id?: number;
  start_date?: string;
  end_date?: string;
  is_synced?: boolean;
}

/**
 * Database Service for managing offline data via AsyncStorage
 */
class DatabaseService {
  private async getItems<T>(key: string): Promise<T[]> {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private async setItems<T>(key: string, items: T[]): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  }

  private async getNextVisitId(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.NEXT_VISIT_ID);
    const id = val ? parseInt(val, 10) : 1;
    await AsyncStorage.setItem(KEYS.NEXT_VISIT_ID, String(id + 1));
    return id;
  }

  /**
   * Seed storage with initial data from server
   */
  async seedFromServer(data: InitData): Promise<void> {
    // Upsert worker
    const workers = await this.getItems<Worker>(KEYS.WORKERS);
    const workerIdx = workers.findIndex((w) => w.id === data.worker.id);
    if (workerIdx >= 0) {
      workers[workerIdx] = data.worker;
    } else {
      workers.push(data.worker);
    }
    await this.setItems(KEYS.WORKERS, workers);

    // Upsert beneficiaries
    const beneficiaries = await this.getItems<Beneficiary>(KEYS.BENEFICIARIES);
    for (const b of data.beneficiaries) {
      const idx = beneficiaries.findIndex((eb) => eb.id === b.id);
      if (idx >= 0) {
        beneficiaries[idx] = b;
      } else {
        beneficiaries.push(b);
      }
    }
    await this.setItems(KEYS.BENEFICIARIES, beneficiaries);

    // Upsert templates
    const templates = await this.getItems<VisitTemplate>(KEYS.TEMPLATES);
    for (const t of data.templates) {
      const idx = templates.findIndex((et) => et.id === t.id);
      if (idx >= 0) {
        templates[idx] = t;
      } else {
        templates.push(t);
      }
    }
    await this.setItems(KEYS.TEMPLATES, templates);

    console.log('Database seeded successfully');
  }

  /**
   * Get worker by ID
   */
  async getWorker(id: number): Promise<Worker | null> {
    const workers = await this.getItems<Worker>(KEYS.WORKERS);
    return workers.find((w) => w.id === id) || null;
  }

  /**
   * Get all beneficiaries assigned to an ASHA worker
   */
  async getBeneficiaries(ashaId: number): Promise<Beneficiary[]> {
    const beneficiaries = await this.getItems<Beneficiary>(KEYS.BENEFICIARIES);
    return beneficiaries
      .filter((b) => b.assigned_asha_id === ashaId)
      .sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`;
        const nameB = `${b.first_name} ${b.last_name}`;
        return nameA.localeCompare(nameB);
      });
  }

  /**
   * Get beneficiary by MCTS ID
   */
  async getBeneficiaryByMCTS(mctsId: string): Promise<Beneficiary | null> {
    const beneficiaries = await this.getItems<Beneficiary>(KEYS.BENEFICIARIES);
    return beneficiaries.find((b) => b.mcts_id === mctsId) || null;
  }

  /**
   * Get template by type
   */
  async getTemplate(type: string): Promise<VisitTemplate | null> {
    const templates = await this.getItems<VisitTemplate>(KEYS.TEMPLATES);
    return templates.find((t) => t.template_type === type) || null;
  }

  /**
   * Create a new visit
   */
  async createVisit(visit: VisitCreate): Promise<number> {
    const id = await this.getNextVisitId();
    const now = new Date().toISOString();
    const newVisit: Visit = {
      id,
      visit_type: visit.visit_type,
      visit_date_time: visit.visit_date_time,
      ...(visit.day_number !== undefined && { day_number: visit.day_number }),
      is_synced: false,
      assigned_asha_id: visit.assigned_asha_id,
      beneficiary_id: visit.beneficiary_id,
      template_id: visit.template_id,
      visit_data: visit.visit_data,
      meta_data: visit.meta_data || {},
      created_at: now,
      updated_at: now,
    };
    const visits = await this.getItems<Visit>(KEYS.VISITS);
    visits.push(newVisit);
    await this.setItems(KEYS.VISITS, visits);
    return id;
  }

  /**
   * Get visits with optional filters
   */
  async getVisits(filters: VisitFilters = {}): Promise<Visit[]> {
    let visits = await this.getItems<Visit>(KEYS.VISITS);

    if (filters.beneficiary_id !== undefined) {
      visits = visits.filter((v) => v.beneficiary_id === filters.beneficiary_id);
    }
    if (filters.start_date) {
      visits = visits.filter((v) => v.visit_date_time >= filters.start_date!);
    }
    if (filters.end_date) {
      visits = visits.filter((v) => v.visit_date_time <= filters.end_date!);
    }
    if (filters.is_synced !== undefined) {
      visits = visits.filter((v) => v.is_synced === filters.is_synced);
    }

    return visits.sort(
      (a, b) =>
        new Date(b.visit_date_time).getTime() - new Date(a.visit_date_time).getTime()
    );
  }

  /**
   * Update visit sync status
   */
  async updateVisitSyncStatus(visitId: number, serverId: number): Promise<void> {
    const visits = await this.getItems<Visit>(KEYS.VISITS);
    const now = new Date().toISOString();
    const idx = visits.findIndex((v) => v.id === visitId);
    if (idx >= 0) {
      visits[idx] = {
        ...visits[idx],
        is_synced: true,
        server_id: serverId,
        synced_at: now,
        updated_at: now,
      };
      await this.setItems(KEYS.VISITS, visits);
    }
  }

  /**
   * Get all pending (unsynced) visits
   */
  async getPendingVisits(): Promise<Visit[]> {
    return this.getVisits({ is_synced: false });
  }

  /**
   * Get count of pending visits
   */
  async getPendingVisitsCount(): Promise<number> {
    const pending = await this.getPendingVisits();
    return pending.length;
  }

  /**
   * Get visits for today for a specific beneficiary
   */
  async getTodaysVisitsForBeneficiary(beneficiaryId: number): Promise<Visit[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayEnd = tomorrow.toISOString();

    return this.getVisits({
      beneficiary_id: beneficiaryId,
      start_date: todayStart,
      end_date: todayEnd,
    });
  }

  /**
   * Update an existing visit
   */
  async updateVisit(visitId: number, visitData: VisitData): Promise<void> {
    const visits = await this.getItems<Visit>(KEYS.VISITS);
    const now = new Date().toISOString();
    const idx = visits.findIndex((v) => v.id === visitId);
    if (idx >= 0) {
      visits[idx] = { ...visits[idx], visit_data: visitData, updated_at: now };
      await this.setItems(KEYS.VISITS, visits);
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
