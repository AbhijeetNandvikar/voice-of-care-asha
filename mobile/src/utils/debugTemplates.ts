/**
 * Debug utility to check template data structure
 * Use this in your app to verify templates have Hindi text
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '../services/database';
import { VisitTemplate } from '../types';

export async function debugTemplateData() {
  try {
    const templatesJson = await AsyncStorage.getItem(KEYS.TEMPLATES);
    
    if (!templatesJson) {
      console.log('[DEBUG] No templates found in storage');
      return;
    }
    
    const templates: VisitTemplate[] = JSON.parse(templatesJson);
    
    console.log('[DEBUG] ========== TEMPLATE DEBUG ==========');
    console.log('[DEBUG] Total templates:', templates.length);
    
    templates.forEach((template, idx) => {
      console.log(`\n[DEBUG] Template ${idx + 1}:`);
      console.log(`  - Name: ${template.name}`);
      console.log(`  - Type: ${template.template_type}`);
      console.log(`  - Questions: ${template.questions?.length || 0}`);
      
      if (template.questions && template.questions.length > 0) {
        const firstQ = template.questions[0];
        console.log(`\n[DEBUG] First question structure:`);
        console.log(`  - Keys: ${Object.keys(firstQ).join(', ')}`);
        console.log(`  - question_en: ${firstQ.question_en || 'MISSING'}`);
        console.log(`  - question_hi: ${firstQ.question_hi || 'MISSING'}`);
        console.log(`  - action_en: ${firstQ.action_en || 'null'}`);
        console.log(`  - action_hi: ${firstQ.action_hi || 'null'}`);
        console.log(`  - input_type: ${firstQ.input_type}`);
        
        // Check if it's using legacy format
        const rawQ = firstQ as any;
        if (rawQ.text) {
          console.log(`  - [LEGACY] text: ${rawQ.text}`);
        }
        if (rawQ.type) {
          console.log(`  - [LEGACY] type: ${rawQ.type}`);
        }
      }
    });
    
    console.log('\n[DEBUG] ========== END DEBUG ==========\n');
    
  } catch (error) {
    console.error('[DEBUG] Error reading templates:', error);
  }
}

export async function clearTemplatesCache() {
  try {
    await AsyncStorage.removeItem(KEYS.TEMPLATES);
    console.log('[DEBUG] Templates cache cleared. Please re-sync from server.');
  } catch (error) {
    console.error('[DEBUG] Error clearing templates:', error);
  }
}
