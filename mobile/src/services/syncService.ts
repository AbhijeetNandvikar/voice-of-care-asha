import * as FileSystem from 'expo-file-system';
import api from './api';
import databaseService from './databaseService';
import { Visit } from '../types';

/**
 * Sync Service
 * Handles synchronization of offline visit data with backend
 */

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: SyncError[];
}

export interface SyncError {
  visitId: number;
  message: string;
}

interface SyncResponse {
  success: boolean;
  synced_visit_ids: number[];
  failed_visits: Array<{
    local_id: number;
    error: string;
  }>;
  message: string;
}

/**
 * Sync Service Class
 */
class SyncService {
  /**
   * Sync all pending visits to backend
   * @returns SyncResult with success count, failed count, and errors
   */
  async syncAllPending(): Promise<SyncResult> {
    try {
      // Get all pending visits from SQLite
      const pendingVisits = await databaseService.getPendingVisits();

      if (pendingVisits.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      console.log(`Starting sync for ${pendingVisits.length} pending visits`);

      // Build multipart form data
      const formData = new FormData();

      // Prepare visits JSON
      const visitsArray = await Promise.all(
        pendingVisits.map(async (visit) => {
          // Process audio paths to prepare for upload
          const processedAnswers = await Promise.all(
            visit.visit_data.answers.map(async (answer) => {
              if (answer.audio_path) {
                // Generate S3 key format expected by backend
                const s3Key = `audio/worker_${visit.assigned_asha_id}/visit_${visit.id}/${answer.question_id}.m4a`;
                
                return {
                  question_id: answer.question_id,
                  answer: answer.answer,
                  audio_s3_key: s3Key,
                  recorded_at: answer.recorded_at,
                };
              }
              
              return {
                question_id: answer.question_id,
                answer: answer.answer,
                recorded_at: answer.recorded_at,
              };
            })
          );

          return {
            local_id: visit.id,
            visit_type: visit.visit_type,
            day_number: visit.day_number,
            visit_date_time: visit.visit_date_time,
            beneficiary_id: visit.beneficiary_id,
            template_id: visit.template_id,
            visit_data: {
              answers: processedAnswers,
            },
            meta_data: visit.meta_data || {},
          };
        })
      );

      // Add visits JSON to form data
      formData.append('visits_json', JSON.stringify(visitsArray));

      // Add audio files to form data
      for (const visit of pendingVisits) {
        for (const answer of visit.visit_data.answers) {
          if (answer.audio_path) {
            try {
              // Check if file exists
              const fileInfo = await FileSystem.getInfoAsync(answer.audio_path);
              
              if (fileInfo.exists) {
                // Create file key that matches backend expectation
                const fileKey = `${visit.id}_${answer.question_id}`;
                
                // Append file to form data
                // @ts-ignore - FormData typing issue with React Native
                formData.append('files', {
                  uri: answer.audio_path,
                  type: 'audio/m4a',
                  name: `${fileKey}.m4a`,
                } as any);
              } else {
                console.warn(`Audio file not found: ${answer.audio_path}`);
              }
            } catch (error) {
              console.error(`Error reading audio file ${answer.audio_path}:`, error);
            }
          }
        }
      }

      // Upload to backend with extended timeout (5 minutes)
      const response = await api.post<SyncResponse>('/sync/visits', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes
      });

      // Process response
      const { synced_visit_ids, failed_visits } = response.data;

      // Update local database for successfully synced visits
      for (let i = 0; i < synced_visit_ids.length; i++) {
        const serverId = synced_visit_ids[i];
        const localVisit = pendingVisits[i];
        
        if (localVisit) {
          await databaseService.updateVisitSyncStatus(localVisit.id, serverId);
        }
      }

      // Build error list for failed visits
      const errors: SyncError[] = failed_visits.map((failure) => ({
        visitId: failure.local_id,
        message: failure.error,
      }));

      console.log(
        `Sync completed: ${synced_visit_ids.length} succeeded, ${failed_visits.length} failed`
      );

      return {
        success: failed_visits.length === 0,
        syncedCount: synced_visit_ids.length,
        failedCount: failed_visits.length,
        errors,
      };
    } catch (error: any) {
      console.error('Sync failed:', error);
      
      // Handle network errors
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Handle timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error('Sync timeout. Please try again with fewer visits or better connectivity.');
      }
      
      // Handle auth errors
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
      
      // Handle server errors
      if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      throw new Error(
        error.response?.data?.detail || error.message || 'Sync failed. Please try again.'
      );
    }
  }

  /**
   * Sync a single visit to backend
   * @param visitId - Local visit ID to sync
   * @returns true if sync succeeded, false otherwise
   */
  async syncVisit(visitId: number): Promise<boolean> {
    try {
      // Get the specific visit
      const visits = await databaseService.getVisits({ is_synced: false });
      const visit = visits.find((v) => v.id === visitId);

      if (!visit) {
        throw new Error('Visit not found or already synced');
      }

      // Build multipart form data for single visit
      const formData = new FormData();

      // Process audio paths
      const processedAnswers = await Promise.all(
        visit.visit_data.answers.map(async (answer) => {
          if (answer.audio_path) {
            const s3Key = `audio/worker_${visit.assigned_asha_id}/visit_${visit.id}/${answer.question_id}.m4a`;
            
            return {
              question_id: answer.question_id,
              answer: answer.answer,
              audio_s3_key: s3Key,
              recorded_at: answer.recorded_at,
            };
          }
          
          return {
            question_id: answer.question_id,
            answer: answer.answer,
            recorded_at: answer.recorded_at,
          };
        })
      );

      const visitData = {
        local_id: visit.id,
        visit_type: visit.visit_type,
        day_number: visit.day_number,
        visit_date_time: visit.visit_date_time,
        beneficiary_id: visit.beneficiary_id,
        template_id: visit.template_id,
        visit_data: {
          answers: processedAnswers,
        },
        meta_data: visit.meta_data || {},
      };

      formData.append('visits_json', JSON.stringify([visitData]));

      // Add audio files
      for (const answer of visit.visit_data.answers) {
        if (answer.audio_path) {
          const fileInfo = await FileSystem.getInfoAsync(answer.audio_path);
          
          if (fileInfo.exists) {
            const fileKey = `${visit.id}_${answer.question_id}`;
            
            // @ts-ignore
            formData.append('files', {
              uri: answer.audio_path,
              type: 'audio/m4a',
              name: `${fileKey}.m4a`,
            } as any);
          }
        }
      }

      // Upload to backend
      const response = await api.post<SyncResponse>('/sync/visits', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000,
      });

      // Update local database if successful
      if (response.data.synced_visit_ids.length > 0) {
        const serverId = response.data.synced_visit_ids[0];
        await databaseService.updateVisitSyncStatus(visit.id, serverId);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`Failed to sync visit ${visitId}:`, error);
      throw error;
    }
  }

  /**
   * Get count of pending visits
   * @returns Number of visits waiting to be synced
   */
  async getPendingSyncCount(): Promise<number> {
    try {
      return await databaseService.getPendingVisitsCount();
    } catch (error) {
      console.error('Error getting pending sync count:', error);
      return 0;
    }
  }

  /**
   * Get last sync time from most recently synced visit
   * @returns Date of last sync or null if no syncs
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const syncedVisits = await databaseService.getVisits({ is_synced: true });
      
      if (syncedVisits.length === 0) {
        return null;
      }

      // Find most recent synced_at timestamp
      const lastSyncedVisit = syncedVisits.reduce((latest, visit) => {
        if (!visit.synced_at) return latest;
        if (!latest.synced_at) return visit;
        return new Date(visit.synced_at) > new Date(latest.synced_at) ? visit : latest;
      });

      return lastSyncedVisit.synced_at ? new Date(lastSyncedVisit.synced_at) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
