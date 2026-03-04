import db from './database';
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

// Extended types with database-specific fields
interface WorkerRow extends Worker {
  meta_data?: string;
}

interface BeneficiaryRow extends Beneficiary {
  meta_data?: string;
}

interface TemplateRow {
  id: number;
  template_type: string;
  name: string;
  questions: string;
  meta_data?: string;
  created_at: string;
}

interface VisitRow {
  id: number;
  server_id?: number;
  visit_type: string;
  visit_date_time: string;
  day_number?: number;
  is_synced: number;
  assigned_asha_id: number;
  beneficiary_id: number;
  template_id: number;
  visit_data: string;
  meta_data?: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Database Service for managing offline data
 */
class DatabaseService {
  /**
   * Seed database with initial data from server
   */
  seedFromServer(data: InitData): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          // Insert worker
          const worker = data.worker;
          tx.executeSql(
            `INSERT OR REPLACE INTO workers 
            (id, first_name, last_name, phone_number, aadhar_id, email, address, 
             worker_type, worker_id, collection_center_id, profile_photo_url, 
             meta_data, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              worker.id,
              worker.first_name,
              worker.last_name,
              worker.phone_number,
              worker.aadhar_id || null,
              worker.email || null,
              worker.address || null,
              worker.worker_type,
              worker.worker_id,
              worker.collection_center_id || null,
              worker.profile_photo_url || null,
              JSON.stringify(worker.meta_data || {}),
              worker.created_at,
              worker.updated_at,
            ]
          );

          // Insert beneficiaries
          data.beneficiaries.forEach((beneficiary) => {
            tx.executeSql(
              `INSERT OR REPLACE INTO beneficiaries 
              (id, first_name, last_name, phone_number, aadhar_id, email, address, 
               age, weight, mcts_id, beneficiary_type, assigned_asha_id, 
               meta_data, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                beneficiary.id,
                beneficiary.first_name,
                beneficiary.last_name,
                beneficiary.phone_number || null,
                beneficiary.aadhar_id || null,
                beneficiary.email || null,
                beneficiary.address || null,
                beneficiary.age || null,
                beneficiary.weight || null,
                beneficiary.mcts_id,
                beneficiary.beneficiary_type,
                beneficiary.assigned_asha_id,
                JSON.stringify(beneficiary.meta_data || {}),
                beneficiary.created_at,
                beneficiary.updated_at,
              ]
            );
          });

          // Insert templates
          data.templates.forEach((template) => {
            tx.executeSql(
              `INSERT OR REPLACE INTO templates 
              (id, template_type, name, questions, meta_data, created_at) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                template.id,
                template.template_type,
                template.name,
                JSON.stringify(template.questions),
                JSON.stringify(template.meta_data || {}),
                template.created_at,
              ]
            );
          });
        },
        (error) => {
          console.error('Error seeding database:', error);
          reject(error);
        },
        () => {
          console.log('Database seeded successfully');
          resolve();
        }
      );
    });
  }

  /**
   * Get worker by ID
   */
  getWorker(id: number): Promise<Worker | null> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM workers WHERE id = ?',
          [id],
          (_, result) => {
            if (result.rows.length > 0) {
              const row = result.rows.item(0);
              resolve(this.parseWorker(row));
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting worker:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get all beneficiaries assigned to an ASHA worker
   */
  getBeneficiaries(ashaId: number): Promise<Beneficiary[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM beneficiaries WHERE assigned_asha_id = ? ORDER BY first_name, last_name',
          [ashaId],
          (_, result) => {
            const beneficiaries: Beneficiary[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              beneficiaries.push(this.parseBeneficiary(result.rows.item(i)));
            }
            resolve(beneficiaries);
          },
          (_, error) => {
            console.error('Error getting beneficiaries:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get beneficiary by MCTS ID
   */
  getBeneficiaryByMCTS(mctsId: string): Promise<Beneficiary | null> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM beneficiaries WHERE mcts_id = ?',
          [mctsId],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(this.parseBeneficiary(result.rows.item(0)));
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting beneficiary by MCTS:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get template by type
   */
  getTemplate(type: string): Promise<VisitTemplate | null> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM templates WHERE template_type = ?',
          [type],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(this.parseTemplate(result.rows.item(0)));
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            console.error('Error getting template:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Create a new visit
   */
  createVisit(visit: VisitCreate): Promise<number> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO visits 
            (visit_type, visit_date_time, day_number, is_synced, assigned_asha_id, 
             beneficiary_id, template_id, visit_data, meta_data, created_at, updated_at) 
            VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
            [
              visit.visit_type,
              visit.visit_date_time,
              visit.day_number || null,
              visit.assigned_asha_id,
              visit.beneficiary_id,
              visit.template_id,
              JSON.stringify(visit.visit_data),
              JSON.stringify(visit.meta_data || {}),
              now,
              now,
            ],
            (_, result) => {
              resolve(result.insertId!);
            },
            (_, error) => {
              console.error('Error creating visit:', error);
              reject(error);
              return false;
            }
          );
        }
      );
    });
  }

  /**
   * Get visits with optional filters
   */
  getVisits(filters: VisitFilters = {}): Promise<Visit[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM visits WHERE 1=1';
      const params: any[] = [];

      if (filters.beneficiary_id !== undefined) {
        query += ' AND beneficiary_id = ?';
        params.push(filters.beneficiary_id);
      }

      if (filters.start_date) {
        query += ' AND visit_date_time >= ?';
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        query += ' AND visit_date_time <= ?';
        params.push(filters.end_date);
      }

      if (filters.is_synced !== undefined) {
        query += ' AND is_synced = ?';
        params.push(filters.is_synced ? 1 : 0);
      }

      query += ' ORDER BY visit_date_time DESC';

      db.transaction((tx) => {
        tx.executeSql(
          query,
          params,
          (_, result) => {
            const visits: Visit[] = [];
            for (let i = 0; i < result.rows.length; i++) {
              visits.push(this.parseVisit(result.rows.item(i)));
            }
            resolve(visits);
          },
          (_, error) => {
            console.error('Error getting visits:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Update visit sync status
   */
  updateVisitSyncStatus(visitId: number, serverId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      db.transaction(
        (tx) => {
          tx.executeSql(
            'UPDATE visits SET is_synced = 1, server_id = ?, synced_at = ?, updated_at = ? WHERE id = ?',
            [serverId, now, now, visitId],
            () => {
              resolve();
            },
            (_, error) => {
              console.error('Error updating visit sync status:', error);
              reject(error);
              return false;
            }
          );
        }
      );
    });
  }

  /**
   * Get all pending (unsynced) visits
   */
  getPendingVisits(): Promise<Visit[]> {
    return this.getVisits({ is_synced: false });
  }

  /**
   * Get count of pending visits
   */
  getPendingVisitsCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT COUNT(*) as count FROM visits WHERE is_synced = 0',
          [],
          (_, result) => {
            resolve(result.rows.item(0).count);
          },
          (_, error) => {
            console.error('Error getting pending visits count:', error);
            reject(error);
            return false;
          }
        );
      });
    });
  }

  /**
   * Get visits for today for a specific beneficiary
   */
  getTodaysVisitsForBeneficiary(beneficiaryId: number): Promise<Visit[]> {
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
  updateVisit(visitId: number, visitData: VisitData): Promise<void> {
    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      db.transaction(
        (tx) => {
          tx.executeSql(
            'UPDATE visits SET visit_data = ?, updated_at = ? WHERE id = ?',
            [JSON.stringify(visitData), now, visitId],
            () => {
              resolve();
            },
            (_, error) => {
              console.error('Error updating visit:', error);
              reject(error);
              return false;
            }
          );
        }
      );
    });
  }

  // Helper methods for parsing database rows

  private parseWorker(row: WorkerRow): Worker {
    return {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      phone_number: row.phone_number,
      aadhar_id: row.aadhar_id,
      email: row.email,
      address: row.address,
      worker_type: row.worker_type,
      worker_id: row.worker_id,
      collection_center_id: row.collection_center_id,
      profile_photo_url: row.profile_photo_url,
      meta_data: row.meta_data ? JSON.parse(row.meta_data) : {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private parseBeneficiary(row: BeneficiaryRow): Beneficiary {
    return {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      phone_number: row.phone_number,
      aadhar_id: row.aadhar_id,
      email: row.email,
      address: row.address,
      age: row.age,
      weight: row.weight,
      mcts_id: row.mcts_id,
      beneficiary_type: row.beneficiary_type,
      assigned_asha_id: row.assigned_asha_id,
      meta_data: row.meta_data ? JSON.parse(row.meta_data) : {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private parseTemplate(row: TemplateRow): VisitTemplate {
    return {
      id: row.id,
      template_type: row.template_type,
      name: row.name,
      questions: JSON.parse(row.questions),
      meta_data: row.meta_data ? JSON.parse(row.meta_data) : {},
      created_at: row.created_at,
    };
  }

  private parseVisit(row: VisitRow): Visit {
    return {
      id: row.id,
      server_id: row.server_id,
      visit_type: row.visit_type,
      visit_date_time: row.visit_date_time,
      day_number: row.day_number,
      is_synced: row.is_synced === 1,
      assigned_asha_id: row.assigned_asha_id,
      beneficiary_id: row.beneficiary_id,
      template_id: row.template_id,
      visit_data: JSON.parse(row.visit_data),
      meta_data: row.meta_data ? JSON.parse(row.meta_data) : {},
      synced_at: row.synced_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
