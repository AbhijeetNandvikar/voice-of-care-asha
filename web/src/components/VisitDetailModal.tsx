import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import './VisitDetailModal.css';

interface VisitDetailModalProps {
  visitId: number;
  isOpen: boolean;
  onClose: () => void;
}

interface VisitDetail {
  id: number;
  visit_type: string;
  visit_date_time: string;
  day_number?: number;
  is_synced: boolean;
  visit_data: {
    answers: Array<{
      question_id: string;
      answer: any;
      audio_s3_key?: string;
      transcript_en?: string;
      transcript_hi?: string;
      recorded_at: string;
    }>;
  };
  beneficiary?: {
    id: number;
    first_name: string;
    last_name: string;
    mcts_id: string;
  };
  worker?: {
    id: number;
    first_name: string;
    last_name: string;
    worker_id: string;
  };
  synced_at?: string;
}

export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  visitId,
  isOpen,
  onClose,
}) => {
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && visitId) {
      fetchVisitDetails();
    }
  }, [isOpen, visitId]);

  const fetchVisitDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<VisitDetail>(`/visits/${visitId}`);
      setVisit(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch visit details');
      console.error('Failed to fetch visit details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string): string => formatDateTime(dateString);

  const formatVisitType = (type: string): string => {
    const typeLabels: Record<string, string> = {
      hbnc: 'HBNC',
      anc: 'ANC',
      pnc: 'PNC',
    };
    return typeLabels[type] || type;
  };

  const renderAnswerValue = (answer: any): React.ReactNode => {
    if (answer === null || answer === undefined) {
      return <span className="empty-value">—</span>;
    }

    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No';
    }

    if (typeof answer === 'object') {
      return <pre className="json-answer">{JSON.stringify(answer, null, 2)}</pre>;
    }

    return String(answer);
  };

  return (
    <div className="visit-modal-backdrop" onClick={handleBackdropClick}>
      <div className="visit-modal-container">
        {/* Modal Header */}
        <div className="visit-modal-header">
          <h2 className="visit-modal-title">Visit Details</h2>
          <button className="visit-modal-close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="visit-modal-body">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading visit details...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button className="retry-button" onClick={fetchVisitDetails}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && visit && (
            <>
              {/* Visit Header */}
              <div className="visit-header">
                <div className="visit-header-row">
                  <div className="visit-header-item">
                    <span className="visit-header-label">Beneficiary:</span>
                    <span className="visit-header-value">
                      {visit.beneficiary
                        ? `${visit.beneficiary.first_name} ${visit.beneficiary.last_name} (${visit.beneficiary.mcts_id})`
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="visit-header-item">
                    <span className="visit-header-label">ASHA Worker:</span>
                    <span className="visit-header-value">
                      {visit.worker
                        ? `${visit.worker.first_name} ${visit.worker.last_name} (${visit.worker.worker_id})`
                        : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="visit-header-row">
                  <div className="visit-header-item">
                    <span className="visit-header-label">Visit Type:</span>
                    <span className="visit-header-value">{formatVisitType(visit.visit_type)}</span>
                  </div>
                  {visit.day_number && (
                    <div className="visit-header-item">
                      <span className="visit-header-label">Day Number:</span>
                      <span className="visit-header-value">Day {visit.day_number}</span>
                    </div>
                  )}
                </div>

                <div className="visit-header-row">
                  <div className="visit-header-item">
                    <span className="visit-header-label">Visit Date:</span>
                    <span className="visit-header-value">{formatDate(visit.visit_date_time)}</span>
                  </div>
                  <div className="visit-header-item">
                    <span className="visit-header-label">Sync Status:</span>
                    <span className={`badge ${visit.is_synced ? 'badge-success' : 'badge-warning'}`}>
                      {visit.is_synced ? 'Synced' : 'Pending'}
                    </span>
                  </div>
                </div>

                {visit.synced_at && (
                  <div className="visit-header-row">
                    <div className="visit-header-item">
                      <span className="visit-header-label">Synced At:</span>
                      <span className="visit-header-value">{formatDate(visit.synced_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Data - Questions and Answers */}
              <div className="visit-data-section">
                <h3 className="section-title">Questions and Answers</h3>
                
                {visit.visit_data?.answers && visit.visit_data.answers.length > 0 ? (
                  <div className="answers-list">
                    {visit.visit_data.answers.map((answer, index) => (
                      <div key={index} className="answer-item">
                        <div className="answer-header">
                          <span className="question-id">{answer.question_id}</span>
                          <span className="recorded-at">
                            {formatDate(answer.recorded_at)}
                          </span>
                        </div>

                        <div className="answer-content">
                          <div className="answer-label">Answer:</div>
                          <div className="answer-value">{renderAnswerValue(answer.answer)}</div>
                        </div>

                        {/* Display transcript if available */}
                        {(answer.transcript_en || answer.transcript_hi) ? (
                          <div className="transcript-section">
                            <div className="transcript-label">
                              <span className="transcript-icon">🎤</span>
                              Transcript:
                            </div>
                            <div className="transcript-content">
                              {answer.transcript_en && (
                                <div className="transcript-item">
                                  <span className="transcript-lang">English:</span>
                                  <span className="transcript-text">{answer.transcript_en}</span>
                                </div>
                              )}
                              {answer.transcript_hi && (
                                <div className="transcript-item">
                                  <span className="transcript-lang">Hindi:</span>
                                  <span className="transcript-text">{answer.transcript_hi}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : answer.audio_s3_key ? (
                          <div className="transcript-processing">
                            <span className="transcript-processing__icon">⏳</span>
                            <span className="transcript-processing__text">
                              Transcript is being processed…
                            </span>
                          </div>
                        ) : null}

                        {/* Display audio indicator if available */}
                        {answer.audio_s3_key && (
                          <div className="audio-indicator">
                            <span className="audio-icon">🔊</span>
                            Audio recording available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No answers recorded</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="visit-modal-footer">
          <button className="visit-modal-button visit-modal-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
