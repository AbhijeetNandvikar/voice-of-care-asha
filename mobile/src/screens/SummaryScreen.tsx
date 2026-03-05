import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VisitScreenProps } from '../navigation/types';
import databaseService from '../services/databaseService';
import { Visit, VisitTemplate, Question, Answer } from '../types';

type Props = VisitScreenProps<'Summary'>;

export default function SummaryScreen({ navigation, route }: Props) {
  const { visitId } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [template, setTemplate] = useState<VisitTemplate | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  useEffect(() => {
    loadVisitData();
  }, []);

  const loadVisitData = async () => {
    try {
      setLoading(true);
      
      // Get visit from database
      const visits = await databaseService.getVisits({});
      const foundVisit = visits.find(v => v.id === visitId);
      
      if (!foundVisit) {
        Alert.alert('Error', 'Visit not found');
        navigation.goBack();
        return;
      }
      
      setVisit(foundVisit);
      
      // Get template
      const loadedTemplate = await databaseService.getTemplate(foundVisit.visit_type);
      if (!loadedTemplate) {
        Alert.alert('Error', 'Template not found');
        navigation.goBack();
        return;
      }
      
      setTemplate(loadedTemplate);
    } catch (error) {
      console.error('Error loading visit data:', error);
      Alert.alert('Error', 'Failed to load visit data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDevice = async () => {
    if (!visit) return;

    try {
      setSaving(true);
      
      // Visit is already saved in database with is_synced = false
      // Just show success message
      Alert.alert(
        'Success',
        'Visit saved to device successfully. Please sync when internet is available.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving visit:', error);
      Alert.alert('Error', 'Failed to save visit');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAnswer = (questionId: string) => {
    if (!template) return;
    
    // Find question index
    const questionIndex = template.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return;
    
    // Navigate back to DataCollection screen at this question
    navigation.navigate('DataCollection', {
      visitType: visit!.visit_type,
      beneficiaryId: visit!.beneficiary_id,
      dayNumber: visit!.day_number || 1,
      templateId: visit!.template_id,
    });
  };

  const getAnswerDisplay = (question: Question, answer: Answer | undefined): string => {
    if (!answer) {
      return 'Not answered';
    }

    if (answer.audio_path) {
      return '🎤 Voice recording';
    }

    if (answer.answer !== null) {
      return String(answer.answer);
    }

    return 'Not answered';
  };

  const getQuestionText = (question: Question): string => {
    return selectedLanguage === 'en' ? question.question_en : question.question_hi;
  };

  if (loading || !visit || !template) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Create a map of answers for quick lookup
  const answersMap = new Map<string, Answer>();
  visit.visit_data.answers.forEach(answer => {
    answersMap.set(answer.question_id, answer);
  });

  // Count answered questions
  const totalQuestions = template.questions.length;
  const answeredQuestions = visit.visit_data.answers.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Summary</Text>
        <TouchableOpacity onPress={() => setSelectedLanguage(selectedLanguage === 'en' ? 'hi' : 'en')}>
          <Text style={styles.languageToggle}>{selectedLanguage === 'en' ? 'हिं' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      {/* Sync Reminder Banner */}
      {!visit.is_synced && (
        <View style={styles.syncBanner}>
          <Ionicons name="cloud-upload-outline" size={20} color="#FF9800" />
          <Text style={styles.syncBannerText}>
            Remember to sync this visit when internet is available
          </Text>
        </View>
      )}

      {/* Progress Summary */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.progressTitle}>Visit Completed</Text>
        </View>
        <Text style={styles.progressText}>
          {answeredQuestions} of {totalQuestions} questions answered
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${(answeredQuestions / totalQuestions) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Questions and Answers List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>All Questions & Answers</Text>
        <Text style={styles.sectionSubtitle}>Tap any answer to edit</Text>

        {template.questions.map((question, index) => {
          const answer = answersMap.get(question.id);
          const isAnswered = answer !== undefined;

          return (
            <TouchableOpacity
              key={question.id}
              style={styles.questionCard}
              onPress={() => handleEditAnswer(question.id)}
              activeOpacity={0.7}
            >
              <View style={styles.questionHeader}>
                <View style={styles.questionNumberBadge}>
                  <Text style={styles.questionNumber}>{index + 1}</Text>
                </View>
                <View style={styles.questionContent}>
                  <Text style={styles.questionText}>{getQuestionText(question)}</Text>
                  {question.is_required && (
                    <Text style={styles.requiredBadge}>Required</Text>
                  )}
                </View>
              </View>

              <View style={styles.answerSection}>
                <Text style={styles.answerLabel}>Answer:</Text>
                <View style={styles.answerContent}>
                  <Text 
                    style={[
                      styles.answerText,
                      !isAnswered && styles.answerTextEmpty
                    ]}
                  >
                    {getAnswerDisplay(question, answer)}
                  </Text>
                  {isAnswered && (
                    <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  )}
                </View>
              </View>

              <View style={styles.editHint}>
                <Ionicons name="create-outline" size={16} color="#007AFF" />
                <Text style={styles.editHintText}>Tap to edit</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveToDevice}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Save to Device</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  languageToggle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    gap: 8,
  },
  syncBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  questionNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#FF5252',
    fontWeight: '600',
  },
  answerSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  answerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  answerTextEmpty: {
    color: '#999',
    fontStyle: 'italic',
  },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  editHintText: {
    fontSize: 12,
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
