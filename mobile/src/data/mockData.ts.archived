/**
 * Mock data for offline / demo mode.
 * Mirrors the seed data in backend/scripts/seed_data.py.
 */

import { Worker, Beneficiary, VisitTemplate, Question, InitData } from '../types';

export const MOCK_PASSWORD = 'Admin@123';

const now = new Date().toISOString();

// ─── Workers ────────────────────────────────────────────────────────────────

export const MOCK_WORKERS: Worker[] = [
  {
    id: 1, worker_id: 'AW000001', worker_type: 'asha_worker',
    first_name: 'Meera', last_name: 'Patil',
    phone_number: '9820022001', email: 'meera.patil@asha.gov.in',
    address: '12, Anand Nagar, Pune 411001',
    created_at: now, updated_at: now,
  },
  {
    id: 2, worker_id: 'AW000002', worker_type: 'asha_worker',
    first_name: 'Kavita', last_name: 'Jadhav',
    phone_number: '9820022002', email: 'kavita.jadhav@asha.gov.in',
    address: '45, Karve Road, Kothrud, Pune 411038',
    created_at: now, updated_at: now,
  },
  {
    id: 3, worker_id: 'AW000003', worker_type: 'asha_worker',
    first_name: 'Lata', last_name: 'Shinde',
    phone_number: '9820022003', email: 'lata.shinde@asha.gov.in',
    address: '78, Hadapsar Industrial Estate, Pune 411013',
    created_at: now, updated_at: now,
  },
  {
    id: 4, worker_id: 'AW000004', worker_type: 'asha_worker',
    first_name: 'Rekha', last_name: 'More',
    phone_number: '9820022004', email: 'rekha.more@asha.gov.in',
    address: '22, Pimpri Colony, Pimpri-Chinchwad 411017',
    created_at: now, updated_at: now,
  },
  {
    id: 5, worker_id: 'AW000005', worker_type: 'asha_worker',
    first_name: 'Sangeeta', last_name: 'Wagh',
    phone_number: '9820022005', email: 'sangeeta.wagh@asha.gov.in',
    address: '9, Yerawada Road, Pune 411006',
    created_at: now, updated_at: now,
  },
];

// ─── Beneficiaries ───────────────────────────────────────────────────────────
// Each assigned to asha_list[idx % 5] matching seed_data.py logic

export const MOCK_BENEFICIARIES: Beneficiary[] = [
  {
    id: 1, mcts_id: 'MCTS000001', beneficiary_type: 'mother_child',
    first_name: 'Seema', last_name: 'Pawar',
    phone_number: '9870001001', age: 26, weight: 58.5,
    address: 'Plot 5, Anand Nagar, Pune 411001',
    assigned_asha_id: 1,
    meta_data: { lmp_date: '2025-10-01', edd: '2026-07-08' },
    created_at: now, updated_at: now,
  },
  {
    id: 2, mcts_id: 'MCTS000002', beneficiary_type: 'child',
    first_name: 'Rohit', last_name: 'Shinde',
    phone_number: '9870001002', age: 1, weight: 4.2,
    address: 'House 12, Kothrud, Pune 411038',
    assigned_asha_id: 2,
    meta_data: { dob: '2025-12-15', birth_weight: 2.9 },
    created_at: now, updated_at: now,
  },
  {
    id: 3, mcts_id: 'MCTS000003', beneficiary_type: 'individual',
    first_name: 'Asha', last_name: 'Jadhav',
    phone_number: '9870001003', age: 35, weight: 62.0,
    address: 'Lane 7, Hadapsar, Pune 411013',
    assigned_asha_id: 3,
    meta_data: { condition: 'hypertension' },
    created_at: now, updated_at: now,
  },
  {
    id: 4, mcts_id: 'MCTS000004', beneficiary_type: 'individual',
    first_name: 'Mohan', last_name: 'Kulkarni',
    phone_number: '9870001004', age: 62, weight: 72.3,
    address: 'Sector 4, Pimpri, Pune 411017',
    assigned_asha_id: 4,
    meta_data: { condition: 'diabetes' },
    created_at: now, updated_at: now,
  },
  {
    id: 5, mcts_id: 'MCTS000005', beneficiary_type: 'mother_child',
    first_name: 'Lakshmi', last_name: 'Nair',
    phone_number: '9870001005', age: 23, weight: 55.0,
    address: 'Block B, Yerawada, Pune 411006',
    assigned_asha_id: 5,
    meta_data: { lmp_date: '2025-11-10', edd: '2026-08-17' },
    created_at: now, updated_at: now,
  },
];

// ─── Visit Templates ─────────────────────────────────────────────────────────

const hbncQuestions: Question[] = [
  { id: 'q1',  order: 1,  input_type: 'yes_no', is_required: true,
    question_en: 'Is the baby breathing normally (30–60 breaths/min)?',
    question_hi: 'क्या बच्चा सामान्य रूप से सांस ले रहा है (30–60 सांस/मिनट)?',
    action_en: 'If not, refer immediately to health facility.',
    action_hi: 'यदि नहीं, तो तुरंत स्वास्थ्य केंद्र रेफर करें।' },
  { id: 'q2',  order: 2,  input_type: 'yes_no', is_required: true,
    question_en: 'Is the cord stump dry and clean (no redness/discharge)?',
    question_hi: 'क्या नाभि सूखी और साफ है (कोई लालिमा/स्राव नहीं)?',
    action_en: 'If signs of infection, apply chlorhexidine and refer.',
    action_hi: 'संक्रमण के लक्षण हों तो क्लोरहेक्सिडाइन लगाएं और रेफर करें।' },
  { id: 'q3',  order: 3,  input_type: 'yes_no', is_required: true,
    question_en: 'Is the baby exclusively breastfeeding (every 2–3 hours)?',
    question_hi: 'क्या बच्चा केवल स्तनपान कर रहा है (हर 2–3 घंटे)?',
    action_en: 'Counsel mother on correct breastfeeding position.',
    action_hi: 'माँ को सही स्तनपान स्थिति पर परामर्श दें।' },
  { id: 'q4',  order: 4,  input_type: 'number', is_required: true,
    question_en: "Baby's weight today (kg)?",
    question_hi: 'आज बच्चे का वजन (किग्रा)?' },
  { id: 'q5',  order: 5,  input_type: 'yes_no', is_required: true,
    question_en: 'Normal skin colour — no jaundice?',
    question_hi: 'सामान्य त्वचा का रंग — पीलिया नहीं?',
    action_en: 'If yellowing beyond palms/soles, refer to hospital.',
    action_hi: 'हथेलियों/तलवों से अधिक पीलापन हो तो अस्पताल रेफर करें।' },
  { id: 'q6',  order: 6,  input_type: 'yes_no', is_required: true,
    question_en: 'Baby active and responsive to touch/sound?',
    question_hi: 'बच्चा स्पर्श/ध्वनि के प्रति सक्रिय और उत्तरदायी है?' },
  { id: 'q7',  order: 7,  input_type: 'number', is_required: true,
    question_en: "Baby's temperature today (°C)?",
    question_hi: 'आज बच्चे का तापमान (°C)?',
    action_en: 'Normal range 36.5–37.5°C. Refer if outside range.',
    action_hi: 'सामान्य सीमा 36.5–37.5°C। सीमा से बाहर हो तो रेफर करें।' },
  { id: 'q8',  order: 8,  input_type: 'yes_no', is_required: true,
    question_en: 'Any danger signs (convulsions, not feeding, very cold)?',
    question_hi: 'कोई खतरे के लक्षण (दौरे, दूध न पीना, बहुत ठंडा)?',
    action_en: 'If YES, refer to hospital immediately.',
    action_hi: 'हाँ है तो तुरंत अस्पताल रेफर करें।' },
  { id: 'q9',  order: 9,  input_type: 'yes_no', is_required: false,
    question_en: 'BCG and OPV-0 immunisation received?',
    question_hi: 'BCG और OPV-0 टीकाकरण हुआ?' },
  { id: 'q10', order: 10, input_type: 'voice', is_required: false,
    question_en: 'Additional observations (voice note)',
    question_hi: 'अतिरिक्त टिप्पणियाँ (वॉइस नोट)' },
];

const ancQuestions: Question[] = [
  { id: 'q1',  order: 1,  input_type: 'number', is_required: true,
    question_en: "Mother's weight today (kg)?",
    question_hi: 'माँ का आज वजन (किग्रा)?' },
  { id: 'q2',  order: 2,  input_type: 'number', is_required: true,
    question_en: 'Blood pressure – systolic (mmHg)?',
    question_hi: 'रक्तचाप – सिस्टोलिक (mmHg)?' },
  { id: 'q3',  order: 3,  input_type: 'number', is_required: true,
    question_en: 'Blood pressure – diastolic (mmHg)?',
    question_hi: 'रक्तचाप – डायस्टोलिक (mmHg)?' },
  { id: 'q4',  order: 4,  input_type: 'yes_no', is_required: true,
    question_en: 'Swelling in feet, hands, or face?',
    question_hi: 'पैरों, हाथों या चेहरे में सूजन?',
    action_en: 'If swelling present with high BP, refer immediately.',
    action_hi: 'उच्च BP के साथ सूजन हो तो तुरंत रेफर करें।' },
  { id: 'q5',  order: 5,  input_type: 'number', is_required: false,
    question_en: 'Haemoglobin level if tested (g/dL)?',
    question_hi: 'यदि जांच हुई हो तो हीमोग्लोबिन स्तर (g/dL)?' },
  { id: 'q6',  order: 6,  input_type: 'yes_no', is_required: true,
    question_en: 'Taking iron-folic acid tablets daily?',
    question_hi: 'प्रतिदिन आयरन-फोलिक एसिड गोलियां ले रही हैं?',
    action_en: 'Counsel on importance of IFA tablets.',
    action_hi: 'IFA गोलियों के महत्व पर परामर्श दें।' },
  { id: 'q7',  order: 7,  input_type: 'yes_no', is_required: true,
    question_en: 'Any vaginal bleeding or unusual discharge?',
    question_hi: 'कोई योनि से रक्तस्राव या असामान्य स्राव?',
    action_en: 'If YES, refer to hospital immediately.',
    action_hi: 'हाँ है तो तुरंत अस्पताल रेफर करें।' },
  { id: 'q8',  order: 8,  input_type: 'yes_no', is_required: true,
    question_en: 'Severe headache or blurred vision?',
    question_hi: 'तेज सिरदर्द या धुंधली दृष्टि?',
    action_en: 'Danger sign for pre-eclampsia — refer immediately.',
    action_hi: 'प्री-एक्लेम्पसिया का संकेत — तुरंत रेफर करें।' },
  { id: 'q9',  order: 9,  input_type: 'yes_no', is_required: false,
    question_en: 'TT vaccination up to date (TT-2 or Booster received)?',
    question_hi: 'TT टीकाकरण अप-टू-डेट है (TT-2 या बूस्टर मिला)?',
    action_en: 'Schedule TT vaccination if not done.',
    action_hi: 'न हुआ हो तो TT टीकाकरण शेड्यूल करें।' },
  { id: 'q10', order: 10, input_type: 'yes_no', is_required: true,
    question_en: 'Foetal movement felt by mother?',
    question_hi: 'माँ को भ्रूण की हलचल महसूस हो रही है?' },
  { id: 'q11', order: 11, input_type: 'number', is_required: false,
    question_en: 'Fundal height (cm)?',
    question_hi: 'फंडल ऊंचाई (cm)?' },
  { id: 'q12', order: 12, input_type: 'voice', is_required: false,
    question_en: 'Complaints / observations (voice note)',
    question_hi: 'शिकायतें / टिप्पणियाँ (वॉइस नोट)' },
];

const pncQuestions: Question[] = [
  { id: 'q1',  order: 1,  input_type: 'yes_no', is_required: true,
    question_en: 'Is the mother exclusively breastfeeding?',
    question_hi: 'क्या माँ केवल स्तनपान करा रही है?',
    action_en: 'Counsel on exclusive breastfeeding for 6 months.',
    action_hi: '6 महीने तक केवल स्तनपान पर परामर्श दें।' },
  { id: 'q2',  order: 2,  input_type: 'yes_no', is_required: true,
    question_en: 'Breast pain, redness, or hardness (mastitis)?',
    question_hi: 'स्तन दर्द, लालिमा, या कठोरता (मास्टिटिस)?',
    action_en: 'If mastitis suspected, refer to health facility.',
    action_hi: 'मास्टिटिस संदिग्ध हो तो स्वास्थ्य केंद्र रेफर करें।' },
  { id: 'q3',  order: 3,  input_type: 'number', is_required: true,
    question_en: "Mother's temperature today (°C)?",
    question_hi: 'माँ का आज तापमान (°C)?' },
  { id: 'q4',  order: 4,  input_type: 'yes_no', is_required: true,
    question_en: 'Excessive vaginal bleeding (lochia) post-delivery?',
    question_hi: 'प्रसव के बाद अत्यधिक योनि रक्तस्राव (लोचिया)?',
    action_en: 'If heavy bleeding, refer to hospital immediately.',
    action_hi: 'अत्यधिक रक्तस्राव हो तो तुरंत अस्पताल रेफर करें।' },
  { id: 'q5',  order: 5,  input_type: 'number', is_required: true,
    question_en: "Mother's blood pressure – systolic (mmHg)?",
    question_hi: 'माँ का रक्तचाप – सिस्टोलिक (mmHg)?' },
  { id: 'q6',  order: 6,  input_type: 'number', is_required: true,
    question_en: "Mother's blood pressure – diastolic (mmHg)?",
    question_hi: 'माँ का रक्तचाप – डायस्टोलिक (mmHg)?' },
  { id: 'q7',  order: 7,  input_type: 'number', is_required: true,
    question_en: "Baby's weight today (kg)?",
    question_hi: 'आज बच्चे का वजन (किग्रा)?' },
  { id: 'q8',  order: 8,  input_type: 'yes_no', is_required: true,
    question_en: 'Baby passing urine at least 6 times/day?',
    question_hi: 'बच्चा दिन में कम से कम 6 बार पेशाब कर रहा है?' },
  { id: 'q9',  order: 9,  input_type: 'yes_no', is_required: true,
    question_en: 'Signs of neonatal infection (skin pustules, swollen cord, fever)?',
    question_hi: 'नवजात संक्रमण के लक्षण (त्वचा पर फुंसी, सूजी नाभि, बुखार)?',
    action_en: 'If YES, refer to hospital immediately.',
    action_hi: 'हाँ है तो तुरंत अस्पताल रेफर करें।' },
  { id: 'q10', order: 10, input_type: 'yes_no', is_required: true,
    question_en: 'Signs of post-partum depression in mother?',
    question_hi: 'माँ में प्रसवोत्तर अवसाद के लक्षण?',
    action_en: 'Counsel and refer for mental health support if needed.',
    action_hi: 'जरूरत हो तो परामर्श दें और मानसिक स्वास्थ्य सहायता के लिए रेफर करें।' },
  { id: 'q11', order: 11, input_type: 'yes_no', is_required: false,
    question_en: 'Mother counselled on family planning options?',
    question_hi: 'माँ को परिवार नियोजन विकल्पों पर परामर्श दिया गया?' },
  { id: 'q12', order: 12, input_type: 'voice', is_required: false,
    question_en: 'Immunisation given today (voice note)',
    question_hi: 'आज दिया गया टीकाकरण (वॉइस नोट)' },
  { id: 'q13', order: 13, input_type: 'voice', is_required: false,
    question_en: 'Additional notes (voice note)',
    question_hi: 'अतिरिक्त नोट्स (वॉइस नोट)' },
];

export const MOCK_TEMPLATES: VisitTemplate[] = [
  {
    id: 1, template_type: 'hbnc',
    name: 'HBNC – Home Based Newborn Care',
    questions: hbncQuestions,
    meta_data: { version: '1.0', applicable_days: [1, 3, 7, 14, 28] },
    created_at: now,
  },
  {
    id: 2, template_type: 'anc',
    name: 'ANC – Antenatal Care Checkup',
    questions: ancQuestions,
    meta_data: { version: '1.0' },
    created_at: now,
  },
  {
    id: 3, template_type: 'pnc',
    name: 'PNC – Postnatal Care Checkup',
    questions: pncQuestions,
    meta_data: { version: '1.0' },
    created_at: now,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Find a mock worker by worker_id + password. Returns null if no match. */
export const findMockWorker = (workerId: string, password: string): Worker | null => {
  if (password !== MOCK_PASSWORD) return null;
  return MOCK_WORKERS.find((w) => w.worker_id === workerId) ?? null;
};

/** Return init data for a given worker (by numeric id). */
export const getMockInitData = (workerId: number): InitData => {
  const worker = MOCK_WORKERS.find((w) => w.id === workerId)!;
  const beneficiaries = MOCK_BENEFICIARIES.filter((b) => b.assigned_asha_id === workerId);
  return { worker, beneficiaries, templates: MOCK_TEMPLATES };
};
