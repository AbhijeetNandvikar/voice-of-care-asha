import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

// expo-av requires a custom dev build in Expo SDK 52+; gracefully degrade in Expo Go
let Audio: typeof import('expo-av').Audio | null = null;
try {
  Audio = require('expo-av').Audio;
} catch {
  // Running in Expo Go without expo-av native module — voice recording disabled
}
import { File, Directory, Paths } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { VisitScreenProps } from '../navigation/types';
import databaseService from '../services/databaseService';
import { useAuthStore } from '../store/authStore';
import { Question, VisitTemplate, Answer, VisitData } from '../types';

type Props = VisitScreenProps<'DataCollection'>;

export default function DataCollectionScreen({ navigation, route }: Props) {
  const { visitType, beneficiaryId, dayNumber, templateId } = route.params;
  const { worker } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<VisitTemplate | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showQuestionList, setShowQuestionList] = useState(false);
  const [numericInput, setNumericInput] = useState('');
  const [numericError, setNumericError] = useState('');
  const [visitId, setVisitId] = useState<number | null>(null);
  const [previousAnswers, setPreviousAnswers] = useState<Map<string, Answer>>(new Map());
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<any>(null);
  
  // Draft key for persistence
  const draftKey = `visit_draft_${beneficiaryId}_${dayNumber}_${visitType}`;

  useEffect(() => {
    loadTemplate();
    loadPreviousAnswers();
    loadDraft(); // Load any saved draft
    setupAudio();
    
    return () => {
      // Cleanup - use ref so we access the live recording, not a stale closure
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      Speech.stop();
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const setupAudio = async () => {
    if (!Audio) return;
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
    }
  };

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const loadedTemplate = await databaseService.getTemplate(visitType);
      if (!loadedTemplate) {
        Alert.alert('Error', 'Template not found');
        navigation.goBack();
        return;
      }
      setTemplate(loadedTemplate);
      
      // Don't create visit yet - only create when user completes all questions
      console.log('[DataCollection] Template loaded with', loadedTemplate.questions.length, 'questions');
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem(draftKey);
      if (draftData) {
        const draft = JSON.parse(draftData);
        console.log('[DataCollection] Loading draft with', draft.answers.length, 'answers');
        
        // Restore answers
        const restoredAnswers = new Map<string, Answer>();
        draft.answers.forEach((answer: Answer) => {
          restoredAnswers.set(answer.question_id, answer);
        });
        setAnswers(restoredAnswers);
        
        // Restore current question index
        if (draft.currentQuestionIndex !== undefined) {
          setCurrentQuestionIndex(draft.currentQuestionIndex);
        }
        
        // Restore language
        if (draft.language) {
          setSelectedLanguage(draft.language);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async (currentAnswers: Map<string, Answer>, questionIndex: number) => {
    try {
      const draft = {
        answers: Array.from(currentAnswers.values()),
        currentQuestionIndex: questionIndex,
        language: selectedLanguage,
        timestamp: new Date().toISOString(),
      };
      await AsyncStorage.setItem(draftKey, JSON.stringify(draft));
      console.log('[DataCollection] Draft saved');
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(draftKey);
      console.log('[DataCollection] Draft cleared');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const loadPreviousAnswers = async () => {
    try {
      const visits = await databaseService.getVisits({
        beneficiary_id: beneficiaryId,
      });
      
      // Get the most recent visit for each question
      const prevAnswersMap = new Map<string, Answer>();
      visits.forEach(visit => {
        if (visit.id !== visitId) {
          visit.visit_data.answers.forEach(answer => {
            if (!prevAnswersMap.has(answer.question_id)) {
              prevAnswersMap.set(answer.question_id, answer);
            }
          });
        }
      });
      
      setPreviousAnswers(prevAnswersMap);
    } catch (error) {
      console.error('Error loading previous answers:', error);
    }
  };

  const saveAnswer = async (questionId: string, answer: Answer) => {
    try {
      console.log('[SaveAnswer] Saving answer for question:', questionId, answer);
      const updatedAnswers = new Map(answers);
      updatedAnswers.set(questionId, answer);
      setAnswers(updatedAnswers);

      // Save draft immediately (no visit ID needed yet)
      await saveDraft(updatedAnswers, currentQuestionIndex);
      console.log('[SaveAnswer] Answer saved successfully');
    } catch (error) {
      console.error('[SaveAnswer] Error saving answer:', error);
      Alert.alert('Error', 'Failed to save answer');
      throw error;
    }
  };

  // Text-to-Speech functionality
  const handlePlayQuestion = () => {
    if (!template) return;
    
    const question = template.questions[currentQuestionIndex];
    const rawQ = question as any;
    const text = selectedLanguage === 'en'
      ? (question.question_en || rawQ.text)
      : (question.question_hi || rawQ.text);
    
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: selectedLanguage === 'en' ? 'en-IN' : 'hi-IN',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('TTS Error:', error);
          setIsSpeaking(false);
          Alert.alert('Error', 'Text-to-speech failed. Please try again.');
        },
      });
    }
  };

  // Yes/No answer handling
  const handleYesNoAnswer = (value: 'yes' | 'no') => {
    if (!template) return;
    
    const question = template.questions[currentQuestionIndex];
    const answer: Answer = {
      question_id: question.id,
      answer: value,
      recorded_at: new Date().toISOString(),
    };
    
    saveAnswer(question.id, answer);
  };

  // Numeric answer handling
  const handleNumericAnswer = () => {
    if (!template) return;
    
    const question = template.questions[currentQuestionIndex];
    const value = parseFloat(numericInput);
    
    if (isNaN(value)) {
      setNumericError('Please enter a valid number');
      return;
    }
    
    setNumericError('');
    const answer: Answer = {
      question_id: question.id,
      answer: value,
      recorded_at: new Date().toISOString(),
    };
    
    saveAnswer(question.id, answer);
    setNumericInput('');
  };

  // Voice recording functionality
  const startRecording = async () => {
    if (!Audio) {
      Alert.alert(
        'Not Available',
        'Voice recording requires a development build. It is not available in Expo Go.'
      );
      return;
    }
    try {
      console.log('[Recording] Requesting permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('[Recording] Permission denied');
        Alert.alert(
          'Permission Required',
          'Microphone permission is required to record audio. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      console.log('[Recording] Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('[Recording] Creating recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      console.log('[Recording] Recording started successfully');
      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer for auto-stop after 60 seconds
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= 60) {
            // Clear interval first
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            // Stop recording on next tick with error handling
            setTimeout(() => {
              stopRecording().catch((error) => {
                console.error('[Recording] Error in auto-stop:', error);
                Alert.alert('Error', 'Failed to stop recording automatically');
              });
            }, 0);
            return 60;
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('[Recording] Error starting recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error.message || 'Unknown error'}`);
    }
  };

  const stopRecording = async () => {
    if (!recording || !template) return;

    try {
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log('[Recording] Stopping recording...');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      console.log('[Recording] Recording URI:', uri);
      
      if (!uri) {
        console.error('[Recording] No URI returned from recording');
        Alert.alert('Error', 'Failed to save recording - no audio file');
        setRecording(null);
        return;
      }

      // Save audio file to permanent location
      const question = template.questions[currentQuestionIndex];
      const audioDir = new Directory(Paths.document, `audio/draft_${beneficiaryId}_${dayNumber}`);

      console.log('[Recording] Creating directory:', audioDir.uri);

      // Create directory if it doesn't exist
      try {
        if (!audioDir.exists) {
          audioDir.create();
          console.log('[Recording] Directory created');
        } else {
          console.log('[Recording] Directory already exists');
        }
      } catch (dirError) {
        console.error('[Recording] Error creating directory:', dirError);
        throw dirError;
      }

      const audioFile = new File(audioDir, `q_${question.id}.m4a`);
      const audioPath = audioFile.uri;
      console.log('[Recording] Moving file from', uri, 'to', audioPath);

      try {
        // Check if target file already exists and delete it
        if (audioFile.exists) {
          console.log('[Recording] Target file exists, deleting...');
          audioFile.delete();
        }

        new File(uri).move(audioFile);
        console.log('[Recording] File moved successfully');
      } catch (moveError) {
        console.error('[Recording] Error moving file:', moveError);
        throw moveError;
      }

      // Save answer with audio path
      const answer: Answer = {
        question_id: question.id,
        answer: null,
        audio_path: audioPath,
        recorded_at: new Date().toISOString(),
      };
      
      console.log('[Recording] Saving answer:', answer);
      await saveAnswer(question.id, answer);
      console.log('[Recording] Recording saved successfully');
      setRecording(null);
      recordingRef.current = null;
    } catch (error) {
      console.error('[Recording] Error stopping recording:', error);
      Alert.alert('Error', `Failed to save recording: ${error.message || 'Unknown error'}`);
      setRecording(null);
      recordingRef.current = null;
    }
  };

  const handleReRecord = async () => {
    if (!template) return;
    
    const question = template.questions[currentQuestionIndex];
    const currentAnswer = answers.get(question.id);
    
    if (currentAnswer?.audio_path) {
      try {
        // Delete old audio file
        const oldFile = new File(currentAnswer.audio_path);
        if (oldFile.exists) {
          oldFile.delete();
        }
      } catch (error) {
        console.error('Error deleting old recording:', error);
      }
    }
    
    // Remove answer from map
    const updatedAnswers = new Map(answers);
    updatedAnswers.delete(question.id);
    setAnswers(updatedAnswers);
  };

  // Navigation
  const canNavigateNext = () => {
    if (!template) return false;
    
    const question = template.questions[currentQuestionIndex];
    if (question.is_required) {
      return answers.has(question.id);
    }
    return true;
  };

  const handleSkip = async () => {
    if (!template) return;
    
    const question = template.questions[currentQuestionIndex];
    
    if (question.is_required) {
      Alert.alert('Cannot Skip', 'This question is required and cannot be skipped.');
      return;
    }

    // Remove answer if it exists
    const updatedAnswers = new Map(answers);
    updatedAnswers.delete(question.id);
    setAnswers(updatedAnswers);

    // Move to next question
    if (currentQuestionIndex < template.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setNumericInput('');
      setNumericError('');
      await saveDraft(updatedAnswers, nextIndex);
    } else {
      // Last question - create visit
      await handleFinish(updatedAnswers);
    }
  };

  const handleFinish = async (finalAnswers: Map<string, Answer>) => {
    try {
      // Convert answers Map to array
      const answersArray = Array.from(finalAnswers.values());
      
      const visitData: VisitData = { answers: answersArray };
      const newVisitId = await databaseService.createVisit({
        visit_type: visitType,
        visit_date_time: new Date().toISOString(),
        day_number: dayNumber,
        assigned_asha_id: worker!.id,
        beneficiary_id: beneficiaryId,
        template_id: templateId,
        visit_data: visitData,
      });
      
      console.log('[DataCollection] Visit created with ID:', newVisitId);
      
      // Clear draft after successful save
      await clearDraft();
      
      navigation.navigate('Summary', { visitId: newVisitId });
    } catch (error) {
      console.error('Error creating visit:', error);
      Alert.alert('Error', 'Failed to save visit. Please try again.');
    }
  };

  const handleNext = async () => {
    if (!template) return;
    
    if (!canNavigateNext()) {
      Alert.alert('Required', 'Please answer this question before continuing');
      return;
    }

    if (currentQuestionIndex < template.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setNumericInput('');
      setNumericError('');
      
      // Save draft with new index
      await saveDraft(answers, nextIndex);
    } else {
      // Last question - create visit and navigate to summary
      await handleFinish(answers);
    }
  };

  const handlePrevious = async () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setNumericInput('');
      setNumericError('');
      
      // Save draft with new index
      await saveDraft(answers, prevIndex);
    }
  };

  const handleQuestionSelect = async (index: number) => {
    setCurrentQuestionIndex(index);
    setShowQuestionList(false);
    setNumericInput('');
    setNumericError('');
    await saveDraft(answers, index);
  };

  if (loading || !template) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if template has questions
  if (!template.questions || template.questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.validationErrorText}>No questions found in template</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log('[DataCollection] Template questions:', template.questions.length);
  console.log('[DataCollection] Current question index:', currentQuestionIndex);
  console.log('[DataCollection] Current question:', JSON.stringify(template.questions[currentQuestionIndex], null, 2));

  const currentQuestion = template.questions[currentQuestionIndex];
  const currentAnswer = answers.get(currentQuestion.id);
  const previousAnswer = previousAnswers.get(currentQuestion.id);
  
  // Log the raw question object to debug
  console.log('[DataCollection] Raw question object keys:', Object.keys(currentQuestion));
  console.log('[DataCollection] question_en:', currentQuestion.question_en);
  console.log('[DataCollection] question_hi:', currentQuestion.question_hi);
  console.log('[DataCollection] action_en:', currentQuestion.action_en);
  console.log('[DataCollection] action_hi:', currentQuestion.action_hi);
  
  // Support both new format (question_en/question_hi/input_type) and legacy format (text/type)
  const rawQuestion = currentQuestion as any;
  // Map legacy type values to expected input_type values
  const resolvedInputType = currentQuestion.input_type
    || (rawQuestion.type === 'boolean' ? 'yes_no' : rawQuestion.type === 'number' ? 'number' : rawQuestion.type === 'voice' ? 'voice' : rawQuestion.type);
  const questionText = selectedLanguage === 'en'
    ? (currentQuestion.question_en || rawQuestion.text)
    : (currentQuestion.question_hi || rawQuestion.text);
  const actionText = selectedLanguage === 'en'
    ? (currentQuestion.action_en || rawQuestion.action || null)
    : (currentQuestion.action_hi || rawQuestion.action || null);
  
  console.log('[DataCollection] Question text:', questionText);
  console.log('[DataCollection] Action text:', actionText);
  console.log('[DataCollection] Selected language:', selectedLanguage);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowQuestionList(true)}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.progress}>
          Question {currentQuestionIndex + 1} of {template.questions.length}
        </Text>
        <TouchableOpacity 
          onPress={async () => {
            const newLang = selectedLanguage === 'en' ? 'hi' : 'en';
            setSelectedLanguage(newLang);
            // Stop any ongoing speech
            Speech.stop();
            setIsSpeaking(false);
            // Save draft with new language
            await saveDraft(answers, currentQuestionIndex);
          }}
          style={styles.languageToggleButton}
        >
          <Text style={styles.languageToggle}>
            {selectedLanguage === 'en' ? 'हिं' : 'EN'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>{questionText}</Text>
            <TouchableOpacity onPress={handlePlayQuestion} style={styles.playButton}>
              <Ionicons 
                name={isSpeaking ? "pause-circle" : "play-circle"} 
                size={32} 
                color="#007AFF" 
              />
            </TouchableOpacity>
          </View>
          {currentQuestion.is_required && (
            <Text style={styles.requiredText}>* Required</Text>
          )}
        </View>

        {/* Previous Answer History */}
        {previousAnswer && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>Previous Answer</Text>
            <Text style={styles.historyText}>
              {previousAnswer.answer !== null 
                ? String(previousAnswer.answer) 
                : 'Voice recording'}
            </Text>
            <Text style={styles.historyDate}>
              {new Date(previousAnswer.recorded_at).toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Answer Input based on type */}
        {resolvedInputType === 'yes_no' && (
          <View style={styles.answerSection}>
            <View style={styles.yesNoButtons}>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  currentAnswer?.answer === 'yes' && styles.yesNoButtonSelected,
                ]}
                onPress={() => handleYesNoAnswer('yes')}
              >
                <Text
                  style={[
                    styles.yesNoButtonText,
                    currentAnswer?.answer === 'yes' && styles.yesNoButtonTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.yesNoButton,
                  currentAnswer?.answer === 'no' && styles.yesNoButtonSelected,
                ]}
                onPress={() => handleYesNoAnswer('no')}
              >
                <Text
                  style={[
                    styles.yesNoButtonText,
                    currentAnswer?.answer === 'no' && styles.yesNoButtonTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {resolvedInputType === 'number' && (
          <View style={styles.answerSection}>
            <TextInput
              style={[styles.numericInput, numericError && styles.numericInputError]}
              value={numericInput || (currentAnswer?.answer ? String(currentAnswer.answer) : '')}
              onChangeText={(text) => {
                setNumericInput(text);
                // Clear error when user types
                setNumericError('');
              }}
              keyboardType="numeric"
              placeholder="Enter number"
              placeholderTextColor="#999"
            />
            {numericError && <Text style={styles.errorText}>{numericError}</Text>}
            {(!currentAnswer || numericInput) && (
              <TouchableOpacity style={styles.saveButton} onPress={handleNumericAnswer}>
                <Text style={styles.saveButtonText}>
                  {currentAnswer ? 'Update Answer' : 'Save Answer'}
                </Text>
              </TouchableOpacity>
            )}
            {currentAnswer && !numericInput && (
              <View style={styles.savedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.savedText}>Answer saved</Text>
              </View>
            )}
          </View>
        )}

        {resolvedInputType === 'voice' && (
          <View style={styles.answerSection}>
            {!Audio ? (
              <View style={styles.unavailableContainer}>
                <Ionicons name="mic-off-outline" size={32} color="#999" />
                <Text style={styles.unavailableText}>
                  Voice recording is not available in Expo Go.{'\n'}
                  A development build is required.
                </Text>
              </View>
            ) : !currentAnswer?.audio_path ? (
              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={isRecording && recordingDuration >= 60}
              >
                <Ionicons 
                  name={isRecording ? "mic" : "mic-outline"} 
                  size={32} 
                  color="#fff" 
                />
                <Text style={styles.recordButtonText}>
                  {isRecording ? `Recording... ${recordingDuration}s` : 'Hold to Record'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.recordedSection}>
                <View style={styles.recordedInfo}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                  <Text style={styles.recordedText}>Audio recorded</Text>
                </View>
                <TouchableOpacity style={styles.reRecordButton} onPress={handleReRecord}>
                  <Text style={styles.reRecordButtonText}>Re-record</Text>
                </TouchableOpacity>
              </View>
            )}
            {isRecording && recordingDuration >= 60 && (
              <Text style={styles.maxDurationText}>Maximum duration reached</Text>
            )}
          </View>
        )}

        {/* Action/Suggestion Card */}
        {actionText && (
          <View style={styles.actionCard}>
            <View style={styles.actionHeader}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.actionTitle}>Action Required</Text>
            </View>
            <Text style={styles.actionText}>{actionText}</Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentQuestionIndex === 0 ? "#ccc" : "#007AFF"} />
          <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        {!currentQuestion.is_required && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Ionicons name="arrow-forward-circle-outline" size={20} color="#FF9800" />
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navButton, !canNavigateNext() && styles.navButtonDisabled]}
          onPress={handleNext}
          disabled={!canNavigateNext()}
        >
          <Text style={[styles.navButtonText, !canNavigateNext() && styles.navButtonTextDisabled]}>
            {currentQuestionIndex === template.questions.length - 1 ? 'Finish' : 'Next'}
          </Text>
          <Ionicons 
            name={currentQuestionIndex === template.questions.length - 1 ? "checkmark" : "chevron-forward"} 
            size={24} 
            color={!canNavigateNext() ? "#ccc" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Question List Modal */}
      <Modal
        visible={showQuestionList}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuestionList(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Questions</Text>
              <TouchableOpacity onPress={() => setShowQuestionList(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.questionList}>
              {template.questions.map((question, index) => {
                const isAnswered = answers.has(question.id);
                const isCurrent = index === currentQuestionIndex;
                return (
                  <TouchableOpacity
                    key={question.id}
                    style={[
                      styles.questionListItem,
                      isCurrent && styles.questionListItemCurrent,
                    ]}
                    onPress={() => handleQuestionSelect(index)}
                  >
                    <View style={styles.questionListItemContent}>
                      <Text style={styles.questionListNumber}>{index + 1}</Text>
                      <Text 
                        style={styles.questionListText} 
                        numberOfLines={2}
                      >
                        {selectedLanguage === 'en' ? (question.question_en || (question as any).text) : (question.question_hi || (question as any).text)}
                      </Text>
                    </View>
                    {isAnswered && (
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  validationErrorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  progress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  languageToggleButton: {
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  languageToggle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  questionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
    marginRight: 12,
  },
  playButton: {
    padding: 4,
  },
  requiredText: {
    fontSize: 14,
    color: '#FF5252',
    marginTop: 8,
  },
  historyCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 8,
  },
  historyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  answerSection: {
    marginBottom: 16,
  },
  yesNoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: '#007AFF',
  },
  yesNoButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  yesNoButtonTextSelected: {
    color: '#fff',
  },
  numericInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    marginBottom: 12,
  },
  numericInputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
  },
  savedText: {
    fontSize: 16,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '600',
  },
  recordButton: {
    backgroundColor: '#FF5252',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#D32F2F',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  recordedSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
  },
  recordedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordedText: {
    fontSize: 16,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '600',
  },
  reRecordButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  reRecordButtonText: {
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '600',
  },
  maxDurationText: {
    fontSize: 14,
    color: '#FF5252',
    marginTop: 8,
    textAlign: 'center',
  },
  unavailableContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unavailableText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  questionList: {
    padding: 16,
  },
  questionListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  questionListItemCurrent: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  questionListItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionListNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    minWidth: 30,
  },
  questionListText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});
