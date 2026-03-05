"""
Comprehensive seed script for Voice of Care (ASHA) local development.

Seeds: collection centers, workers (5 types × 5 each), beneficiaries,
       visit templates, visits, and sync logs.

Usage
-----
From any machine with Docker running (simplest):
    ./backend/scripts/seed.sh

Reset everything and re-seed from scratch:
    ./backend/scripts/seed.sh --reset

Medical Officer login (web dashboard):
  worker_id : MO000001
  password  : Admin@123
"""

import os
import sys
import argparse
from datetime import datetime, timedelta, UTC
from pathlib import Path

# ── Ensure backend root is on sys.path so `app.*` imports work ─────────────
BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

# ── Load .env from the backend directory if python-dotenv is available ──────
try:
    from dotenv import load_dotenv
    load_dotenv(BACKEND_ROOT / ".env")
except ImportError:
    pass

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.collection_center import CollectionCenter
from app.models.worker import Worker
from app.models.beneficiary import Beneficiary
from app.models.visit_template import VisitTemplate
from app.models.visit import Visit
from app.models.sync_log import SyncLog
from app.services.auth_service import AuthService

# ── DB connection ──────────────────────────────────────────────────────────
# Inside the Docker container DATABASE_URL is injected by docker-compose.
# When running from the host with port 5432 exposed the default below works.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://voice_of_care_user:changeme@localhost:5432/voice_of_care",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

DEFAULT_PASSWORD = "Admin@123"


# ═══════════════════════════════════════════════════════════════════════════
# Data definitions
# ═══════════════════════════════════════════════════════════════════════════

COLLECTION_CENTERS = [
    {
        "name": "Anand Nagar PHC",
        "address": "12, Anand Nagar, Pune 411001",
        "meta_data": {"district": "Pune", "block": "Haveli", "contact": "020-26051234"},
    },
    {
        "name": "Kothrud Urban CHC",
        "address": "45, Karve Road, Kothrud, Pune 411038",
        "meta_data": {"district": "Pune", "block": "Kothrud", "contact": "020-25384567"},
    },
    {
        "name": "Hadapsar Health Centre",
        "address": "78, Hadapsar Industrial Estate, Pune 411013",
        "meta_data": {"district": "Pune", "block": "Haveli", "contact": "020-26872345"},
    },
    {
        "name": "Pimpri CHC",
        "address": "22, Pimpri Colony, Pimpri-Chinchwad 411017",
        "meta_data": {"district": "Pimpri-Chinchwad", "block": "Pimpri", "contact": "020-27424890"},
    },
    {
        "name": "Yerawada Sub-Centre",
        "address": "9, Yerawada Road, Pune 411006",
        "meta_data": {"district": "Pune", "block": "Haveli", "contact": "020-26681122"},
    },
]

# (worker_type, id_prefix, [(first, last, phone, aadhar, email), ...])
WORKERS_BY_TYPE = [
    (
        "medical_officer", "MO",
        [
            ("Arjun",    "Mehta",     "9820011001", "100000000001", "arjun.mehta@health.gov.in"),
            ("Sunita",   "Rao",       "9820011002", "100000000002", "sunita.rao@health.gov.in"),
            ("Vikram",   "Desai",     "9820011003", "100000000003", "vikram.desai@health.gov.in"),
            ("Priya",    "Sharma",    "9820011004", "100000000004", "priya.sharma@health.gov.in"),
            ("Rahul",    "Nair",      "9820011005", "100000000005", "rahul.nair@health.gov.in"),
        ],
    ),
    (
        "asha_worker", "AW",
        [
            ("Meera",    "Patil",     "9820022001", "200000000001", "meera.patil@asha.gov.in"),
            ("Kavita",   "Jadhav",    "9820022002", "200000000002", "kavita.jadhav@asha.gov.in"),
            ("Lata",     "Shinde",    "9820022003", "200000000003", "lata.shinde@asha.gov.in"),
            ("Rekha",    "More",      "9820022004", "200000000004", "rekha.more@asha.gov.in"),
            ("Sangeeta", "Wagh",      "9820022005", "200000000005", "sangeeta.wagh@asha.gov.in"),
        ],
    ),
    (
        "anm", "AN",
        [
            ("Deepa",    "Kulkarni",  "9820033001", "300000000001", "deepa.kulkarni@health.gov.in"),
            ("Smita",    "Gaikwad",   "9820033002", "300000000002", "smita.gaikwad@health.gov.in"),
            ("Anjali",   "Pawar",     "9820033003", "300000000003", "anjali.pawar@health.gov.in"),
            ("Nandita",  "Bhosale",   "9820033004", "300000000004", "nandita.bhosale@health.gov.in"),
            ("Vaishali", "Kadam",     "9820033005", "300000000005", "vaishali.kadam@health.gov.in"),
        ],
    ),
    (
        "aaw", "AA",
        [
            ("Sushma",   "Deshpande", "9820044001", "400000000001", "sushma.deshpande@wcd.gov.in"),
            ("Renuka",   "Talekar",   "9820044002", "400000000002", "renuka.talekar@wcd.gov.in"),
            ("Usha",     "Salunke",   "9820044003", "400000000003", "usha.salunke@wcd.gov.in"),
            ("Geeta",    "Mane",      "9820044004", "400000000004", "geeta.mane@wcd.gov.in"),
            ("Pratibha", "Landge",    "9820044005", "400000000005", "pratibha.landge@wcd.gov.in"),
        ],
    ),
    (
        "supervisor", "SV",
        [
            ("Rajesh",   "Sawant",    "9820055001", "500000000001", "rajesh.sawant@health.gov.in"),
            ("Anil",     "Kale",      "9820055002", "500000000002", "anil.kale@health.gov.in"),
            ("Suresh",   "Nimkar",    "9820055003", "500000000003", "suresh.nimkar@health.gov.in"),
            ("Milind",   "Jagtap",    "9820055004", "500000000004", "milind.jagtap@health.gov.in"),
            ("Santosh",  "Ghatge",    "9820055005", "500000000005", "santosh.ghatge@health.gov.in"),
        ],
    ),
]

BENEFICIARIES = [
    # ── Newborns and their mothers (primary HBNC beneficiaries) ────────────
    {
        "first_name": "Seema",   "last_name": "Pawar",
        "phone_number": "9870001001", "aadhar_id": "600000000001",
        "age": 26, "weight": 58.5,
        "mcts_id": "MCTS000001", "beneficiary_type": "mother_child",
        "address": "Plot 5, Anand Nagar, Pune 411001",
        "meta_data": {"delivery_date": "2025-12-10", "delivery_type": "normal",
                      "parity": "1", "gestational_age_weeks": 39},
    },
    {
        "first_name": "Rohit",   "last_name": "Pawar",
        "phone_number": "9870001002", "aadhar_id": "600000000002",
        "age": 0, "weight": 2.9,
        "mcts_id": "MCTS000002", "beneficiary_type": "child",
        "address": "Plot 5, Anand Nagar, Pune 411001",
        "meta_data": {"dob": "2025-12-10", "birth_weight": 2.9,
                      "gender": "male", "mother_mcts": "MCTS000001"},
    },
    {
        "first_name": "Priya",   "last_name": "Kale",
        "phone_number": "9870001003", "aadhar_id": "600000000003",
        "age": 24, "weight": 54.0,
        "mcts_id": "MCTS000003", "beneficiary_type": "mother_child",
        "address": "Lane 7, Hadapsar, Pune 411013",
        "meta_data": {"delivery_date": "2025-12-20", "delivery_type": "normal",
                      "parity": "2", "gestational_age_weeks": 38},
    },
    {
        "first_name": "Baby",    "last_name": "Kale",
        "phone_number": "9870001004", "aadhar_id": "600000000004",
        "age": 0, "weight": 3.1,
        "mcts_id": "MCTS000004", "beneficiary_type": "child",
        "address": "Lane 7, Hadapsar, Pune 411013",
        "meta_data": {"dob": "2025-12-20", "birth_weight": 3.1,
                      "gender": "female", "mother_mcts": "MCTS000003"},
    },
    {
        "first_name": "Sunita",  "last_name": "More",
        "phone_number": "9870001005", "aadhar_id": "600000000005",
        "age": 22, "weight": 52.5,
        "mcts_id": "MCTS000005", "beneficiary_type": "mother_child",
        "address": "Sector 2, Hadapsar, Pune 411013",
        "meta_data": {"delivery_date": "2026-01-05", "delivery_type": "caesarean",
                      "parity": "1", "gestational_age_weeks": 37},
    },
    {
        "first_name": "Baby",    "last_name": "More",
        "phone_number": "9870001006", "aadhar_id": "600000000006",
        "age": 0, "weight": 2.7,
        "mcts_id": "MCTS000006", "beneficiary_type": "child",
        "address": "Sector 2, Hadapsar, Pune 411013",
        "meta_data": {"dob": "2026-01-05", "birth_weight": 2.7,
                      "gender": "male", "mother_mcts": "MCTS000005",
                      "note": "preterm by 3 weeks, low birth weight"},
    },
    # ── ANC beneficiaries (pregnant mothers) ───────────────────────────────
    {
        "first_name": "Lakshmi", "last_name": "Nair",
        "phone_number": "9870001007", "aadhar_id": "600000000007",
        "age": 23, "weight": 55.0,
        "mcts_id": "MCTS000007", "beneficiary_type": "mother_child",
        "address": "Block B, Yerawada, Pune 411006",
        "meta_data": {"lmp_date": "2025-11-10", "edd": "2026-08-17",
                      "gravida": 1, "para": 0},
    },
    {
        "first_name": "Champa",  "last_name": "Devi",
        "phone_number": "9870001008", "aadhar_id": "600000000008",
        "age": 30, "weight": 61.0,
        "mcts_id": "MCTS000008", "beneficiary_type": "mother_child",
        "address": "Plot 18, Pimpri, Pune 411017",
        "meta_data": {"lmp_date": "2025-06-15", "edd": "2026-03-22",
                      "gravida": 3, "para": 2, "risk": "high"},
    },
    # ── Individual / chronic care ───────────────────────────────────────────
    {
        "first_name": "Asha",    "last_name": "Jadhav",
        "phone_number": "9870001009", "aadhar_id": "600000000009",
        "age": 35, "weight": 62.0,
        "mcts_id": "MCTS000009", "beneficiary_type": "individual",
        "address": "Lane 7, Hadapsar, Pune 411013",
        "meta_data": {"condition": "hypertension", "medication": "amlodipine 5mg"},
    },
    {
        "first_name": "Mohan",   "last_name": "Kulkarni",
        "phone_number": "9870001010", "aadhar_id": "600000000010",
        "age": 62, "weight": 72.3,
        "mcts_id": "MCTS000010", "beneficiary_type": "individual",
        "address": "Sector 4, Pimpri, Pune 411017",
        "meta_data": {"condition": "diabetes", "medication": "metformin 500mg",
                      "hba1c": "7.8"},
    },
]

# ── HBNC per-day voice transcripts ────────────────────────────────────────
_HBNC_TRANSCRIPTS = {
    1: {
        "q5_hi": "बच्चे ने जन्म के बाद पहली बार स्तनपान अच्छी तरह से किया। माँ को सही स्थिति और लगाव दिखाया गया। दूध पर्याप्त मात्रा में आ रहा है, बच्चा संतुष्ट दिखता है।",
        "q5_en": "Baby breastfed well for the first time after birth. Mother was shown correct positioning and attachment. Milk supply adequate, baby appears satisfied.",
        "q8_hi": "बच्चे की त्वचा सामान्य गुलाबी रंग की है। आंखें साफ और सामान्य हैं। बच्चा सक्रिय है और रो रहा है। अंग सामान्य रूप से हिल रहे हैं। कोई खतरे के संकेत नहीं दिखे।",
        "q8_en": "Baby's skin is normal pink colour. Eyes clear and normal. Baby is active and crying well. Limbs moving normally. No danger signs observed.",
        "q10_hi": "पहले दिन की जांच सफलतापूर्वक पूरी हुई। माँ को स्तनपान, नाभि देखभाल और बच्चे को गर्म रखने के बारे में परामर्श दिया। अगली यात्रा तीसरे दिन होगी।",
        "q10_en": "Day 1 visit completed successfully. Mother counselled on breastfeeding, cord care, and keeping baby warm. Next visit scheduled for day 3.",
    },
    3: {
        "q5_hi": "माँ ने बताया कि बच्चा रात में भी हर दो-तीन घंटे में दूध पी रहा है। स्तनपान में कोई समस्या नहीं है। बच्चा 8 से 10 बार दूध पी रहा है।",
        "q5_en": "Mother reports baby feeding every 2-3 hours including at night. No breastfeeding difficulties. Baby feeding 8-10 times in 24 hours.",
        "q8_hi": "बच्चा बहुत सक्रिय है, जोर से रो रहा है। त्वचा और आंखें सामान्य हैं। नाभि का ठूंठ सूख रहा है। कोई त्वचा संक्रमण नहीं।",
        "q8_en": "Baby very active, crying strongly. Skin and eyes normal. Cord stump drying well. No skin infections observed.",
        "q10_hi": "तीसरे दिन की जांच ठीक है। वजन बढ़ रहा है जो अच्छा संकेत है। माँ को IFA गोलियाँ और पौष्टिक आहार के बारे में याद दिलाया। अगली यात्रा सातवें दिन।",
        "q10_en": "Day 3 visit satisfactory. Weight gaining which is a good sign. Mother reminded about IFA tablets and nutritious diet. Next visit on day 7.",
    },
    7: {
        "q5_hi": "दूध पिलाना बहुत अच्छा है। माँ को अब कोई कठिनाई नहीं है। बच्चा 8 से 10 बार दूध पी रहा है और संतुष्ट दिखता है। माँ के दोनों स्तन से दूध आ रहा है।",
        "q5_en": "Breastfeeding going very well. Mother has no difficulties now. Baby feeding 8-10 times and appears satisfied. Both breasts producing milk well.",
        "q8_hi": "बच्चा स्वस्थ और सक्रिय दिख रहा है। त्वचा गुलाबी है, आंखें साफ हैं। नाभि का ठूंठ गिर गया है और जगह साफ है। कोई खतरे के संकेत नहीं।",
        "q8_en": "Baby looks healthy and active. Skin pink, eyes clear. Cord stump has fallen off and area is clean. No danger signs.",
        "q10_hi": "सातवें दिन की जांच सफल। नाभि ठीक से ठीक हो गई है। अगला टीकाकरण छठे सप्ताह में याद दिलाया। माँ को परिवार नियोजन के बारे में बताया। 14वें दिन यात्रा।",
        "q10_en": "Day 7 visit successful. Umbilicus healed properly. Reminded about 6-week vaccination. Mother informed about family planning. Next visit on day 14.",
    },
    14: {
        "q5_hi": "बच्चा अब पूरी तरह से स्तनपान पर है। माँ ने बताया कि बच्चा रात में 2-3 बार और दिन में 6-7 बार दूध पीता है। स्तनपान बहुत अच्छा चल रहा है।",
        "q5_en": "Baby now fully on exclusive breastfeeding. Mother reports baby feeds 2-3 times at night and 6-7 times during day. Breastfeeding going very well.",
        "q8_hi": "बच्चा बहुत अच्छा दिख रहा है। हाथ-पैर मजबूत हो रहे हैं। आंखें चमकदार हैं। त्वचा स्वस्थ है। बच्चा आवाज पर प्रतिक्रिया दे रहा है।",
        "q8_en": "Baby looking very good. Arms and legs getting stronger. Eyes bright and shiny. Skin healthy. Baby responding to sounds.",
        "q10_hi": "14वें दिन की जांच बहुत अच्छी है। बच्चे का वजन अच्छी तरह बढ़ रहा है। माँ को छठे सप्ताह में पेंटा टीका याद दिलाया। अगली और अंतिम HBNC यात्रा 28वें दिन।",
        "q10_en": "Day 14 visit excellent. Baby's weight gaining well. Mother reminded about Penta vaccine at 6 weeks. Next and final HBNC visit on day 28.",
    },
    28: {
        "q5_hi": "बच्चा पूरी तरह से स्तनपान पर है और माँ को कोई समस्या नहीं है। बच्चा दिन में 8 से 10 बार दूध पी रहा है। माँ खुद भी पौष्टिक खाना खा रही है।",
        "q5_en": "Baby fully on breastfeeding with no issues for mother. Baby feeding 8-10 times per day. Mother eating nutritious food herself.",
        "q8_hi": "बच्चा बहुत स्वस्थ और खुश दिखता है। मुस्कुरा रहा है। आंखें ट्रैक कर रही हैं। त्वचा साफ और स्वस्थ है। विकास बहुत अच्छा है।",
        "q8_en": "Baby looks very healthy and happy. Smiling. Eyes tracking. Skin clear and healthy. Development very good.",
        "q10_hi": "28वें दिन की जांच सफलतापूर्वक पूरी हुई। HBNC यात्राएं समाप्त। माँ को छठे सप्ताह टीकाकरण के लिए PHC जाने की सलाह दी। परिवार नियोजन पर परामर्श दिया। बच्चा और माँ दोनों स्वस्थ हैं।",
        "q10_en": "Day 28 visit completed successfully. HBNC visits concluded. Mother advised to visit PHC for 6-week vaccination. Family planning counselled. Both baby and mother healthy.",
    },
}

VISIT_TEMPLATES = [
    {
        "template_type": "hbnc",
        "name": "HBNC – Home Based Newborn Care",
        "questions": [
            {
                "id": "hbnc_q1", "order": 1, "input_type": "yes_no",
                "question_en": "Is the baby breathing normally (30–60 breaths/min)?",
                "question_hi": "क्या बच्चा सामान्य रूप से सांस ले रहा है (30-60 सांस/मिनट)?",
                "action_en": "If NO: Refer to nearest health facility immediately — critical emergency.",
                "action_hi": "यदि नहीं: तुरंत निकटतम स्वास्थ्य सुविधा में रेफर करें — गंभीर आपातकाल।",
                "is_required": True,
            },
            {
                "id": "hbnc_q2", "order": 2, "input_type": "yes_no",
                "question_en": "Is the baby feeding well (breastfed at least 8 times in 24 hrs)?",
                "question_hi": "क्या बच्चा अच्छी तरह से दूध पी रहा है (24 घंटे में कम से कम 8 बार)?",
                "action_en": "If NO: Counsel mother on breastfeeding technique and positioning.",
                "action_hi": "यदि नहीं: माँ को उचित स्तनपान तकनीक और स्थिति पर परामर्श दें।",
                "is_required": True,
            },
            {
                "id": "hbnc_q3", "order": 3, "input_type": "number",
                "question_en": "Baby's weight in kilograms? (Use weighing scale)",
                "question_hi": "बच्चे का वजन किलोग्राम में? (वजन मशीन का उपयोग करें)",
                "action_en": "If <2.5 kg: advise extra warmth and frequent feeding. If <1.8 kg: refer to SNCU.",
                "action_hi": "यदि <2.5 किग्रा: अतिरिक्त गर्मी और बार-बार दूध। यदि <1.8 किग्रा: SNCU रेफर करें।",
                "is_required": True,
            },
            {
                "id": "hbnc_q4", "order": 4, "input_type": "number",
                "question_en": "Baby's temperature in °C? (Measure in axilla for 3 minutes)",
                "question_hi": "बच्चे का तापमान °C में? (3 मिनट के लिए बगल में मापें)",
                "action_en": "Normal 36.5–37.5°C. If <36.5°C: skin-to-skin warmth. If >37.5°C: refer to SNCU immediately.",
                "action_hi": "सामान्य 36.5-37.5°C। यदि <36.5°C: त्वचा से त्वचा संपर्क। यदि >37.5°C: तुरंत SNCU रेफर करें।",
                "is_required": True,
            },
            {
                "id": "hbnc_q5", "order": 5, "input_type": "voice",
                "question_en": "Describe the baby's feeding pattern and any breastfeeding concerns the mother has reported.",
                "question_hi": "बच्चे के दूध पीने का तरीका और माँ द्वारा बताई गई किसी भी स्तनपान चिंता का वर्णन करें।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
            {
                "id": "hbnc_q6", "order": 6, "input_type": "yes_no",
                "question_en": "Is the umbilical cord stump clean and dry (no redness, pus, or swelling)?",
                "question_hi": "क्या नाभि का ठूंठ साफ और सूखा है (कोई लालिमा, मवाद या सूजन नहीं)?",
                "action_en": "If NO: Clean with water only, keep dry. Redness or pus = refer to health facility immediately.",
                "action_hi": "यदि नहीं: केवल पानी से साफ करें, सूखा रखें। लालिमा या मवाद = तुरंत स्वास्थ्य सुविधा में रेफर करें।",
                "is_required": True,
            },
            {
                "id": "hbnc_q7", "order": 7, "input_type": "yes_no",
                "question_en": "Does the baby have yellowness in eyes or skin (jaundice)?",
                "question_hi": "क्या बच्चे की आंखों या त्वचा में पीलापन (पीलिया) है?",
                "action_en": "If YES: Check severity. Jaundice on palms/soles or persisting >14 days = refer to NBSU/SNCU.",
                "action_hi": "यदि हाँ: गंभीरता जांचें। हथेलियों/तलवों पर पीलिया या >14 दिन = NBSU/SNCU रेफर करें।",
                "is_required": True,
            },
            {
                "id": "hbnc_q8", "order": 8, "input_type": "voice",
                "question_en": "Describe the baby's overall condition — skin colour, eyes, activity level, cry strength, and any danger signs observed.",
                "question_hi": "बच्चे की समग्र स्थिति का वर्णन करें — त्वचा का रंग, आंखें, सक्रियता स्तर, रोने की शक्ति और कोई भी खतरे के संकेत।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
            {
                "id": "hbnc_q9", "order": 9, "input_type": "yes_no",
                "question_en": "Has the baby received BCG and OPV-0 (polio) vaccination?",
                "question_hi": "क्या बच्चे को BCG और OPV-0 (पोलियो) का टीका मिला है?",
                "action_en": "If NO: Ensure OPV-0 within first 8 hours of birth. Schedule BCG at nearest health facility.",
                "action_hi": "यदि नहीं: जन्म के पहले 8 घंटों में OPV-0 सुनिश्चित करें। निकटतम स्वास्थ्य सुविधा में BCG शेड्यूल करें।",
                "is_required": True,
            },
            {
                "id": "hbnc_q10", "order": 10, "input_type": "voice",
                "question_en": "Record overall observations, counselling given to mother, any referrals made, and plan for next visit.",
                "question_hi": "समग्र अवलोकन, माँ को दी गई परामर्श, किए गए रेफरल और अगली यात्रा की योजना रिकॉर्ड करें।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
        ],
        "meta_data": {"version": "2.0", "applicable_days": [1, 3, 7, 14, 28],
                      "form_reference": "Annexure 1b & 1c – HBNC Home Visit Form"},
    },
    {
        "template_type": "anc",
        "name": "ANC – Antenatal Care Checkup",
        "questions": [
            {
                "id": "anc_q1", "order": 1, "input_type": "number",
                "question_en": "Mother's weight today in kg?",
                "question_hi": "माँ का आज का वजन किलोग्राम में?",
                "action_en": "Monitor weight gain. Expected: 1–2 kg/month in 2nd and 3rd trimester.",
                "action_hi": "वजन बढ़ने की निगरानी करें। दूसरी और तीसरी तिमाही में 1-2 किग्रा/माह अपेक्षित।",
                "is_required": True,
            },
            {
                "id": "anc_q2", "order": 2, "input_type": "number",
                "question_en": "Blood pressure – systolic reading (mmHg)?",
                "question_hi": "रक्तचाप – सिस्टोलिक पठन (mmHg)?",
                "action_en": "Normal <140 mmHg. If ≥140 with symptoms: refer to PHC/hospital immediately.",
                "action_hi": "सामान्य <140 mmHg। यदि लक्षणों के साथ ≥140: तुरंत PHC/अस्पताल रेफर करें।",
                "is_required": True,
            },
            {
                "id": "anc_q3", "order": 3, "input_type": "number",
                "question_en": "Blood pressure – diastolic reading (mmHg)?",
                "question_hi": "रक्तचाप – डायस्टोलिक पठन (mmHg)?",
                "action_en": "Normal <90 mmHg. If ≥90 on two readings: refer urgently.",
                "action_hi": "सामान्य <90 mmHg। यदि दो रीडिंग पर ≥90: तुरंत रेफर करें।",
                "is_required": True,
            },
            {
                "id": "anc_q4", "order": 4, "input_type": "yes_no",
                "question_en": "Is there swelling in feet, hands, or face (oedema)?",
                "question_hi": "क्या पैरों, हाथों या चेहरे में सूजन है (शोफ)?",
                "action_en": "If YES with high BP: may indicate pre-eclampsia — refer immediately.",
                "action_hi": "यदि हाँ उच्च BP के साथ: प्री-एक्लेम्पसिया का संकेत हो सकता है — तुरंत रेफर करें।",
                "is_required": True,
            },
            {
                "id": "anc_q5", "order": 5, "input_type": "number",
                "question_en": "Haemoglobin level if tested today (g/dL)? Enter 0 if not tested.",
                "question_hi": "यदि आज परीक्षण किया गया तो हीमोग्लोबिन स्तर (g/dL)? यदि परीक्षण नहीं किया तो 0 दर्ज करें।",
                "action_en": "If <7 g/dL: severe anaemia — refer urgently. If 7–10: moderate anaemia — increase IFA dose.",
                "action_hi": "यदि <7 g/dL: गंभीर एनीमिया — तुरंत रेफर करें। यदि 7-10: मध्यम एनीमिया — IFA खुराक बढ़ाएं।",
                "is_required": False,
            },
            {
                "id": "anc_q6", "order": 6, "input_type": "yes_no",
                "question_en": "Is the mother taking iron-folic acid (IFA) tablets daily?",
                "question_hi": "क्या माँ रोज आयरन-फोलिक एसिड (IFA) की गोलियाँ ले रही है?",
                "action_en": "If NO: counsel on importance, provide supply, address side effects.",
                "action_hi": "यदि नहीं: महत्व पर परामर्श दें, आपूर्ति प्रदान करें, दुष्प्रभावों को संबोधित करें।",
                "is_required": True,
            },
            {
                "id": "anc_q7", "order": 7, "input_type": "yes_no",
                "question_en": "Any vaginal bleeding or unusual discharge?",
                "question_hi": "क्या कोई योनि से रक्तस्राव या असामान्य स्राव है?",
                "action_en": "If YES: Refer to hospital immediately — could indicate placenta previa or infection.",
                "action_hi": "यदि हाँ: तुरंत अस्पताल रेफर करें — प्लेसेंटा प्रिविया या संक्रमण का संकेत हो सकता है।",
                "is_required": True,
            },
            {
                "id": "anc_q8", "order": 8, "input_type": "voice",
                "question_en": "Describe any complaints the mother has today — headache, blurred vision, pain, nausea, or other symptoms.",
                "question_hi": "माँ की आज की किसी भी शिकायत का वर्णन करें — सिरदर्द, धुंधली दृष्टि, दर्द, मतली या अन्य लक्षण।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
            {
                "id": "anc_q9", "order": 9, "input_type": "yes_no",
                "question_en": "TT vaccination status — has the mother received TT-2 or Td booster?",
                "question_hi": "TT टीकाकरण स्थिति — क्या माँ को TT-2 या Td बूस्टर मिला है?",
                "action_en": "If NO: schedule TT-2 immediately (at least 4 weeks after TT-1, at least 4 weeks before delivery).",
                "action_hi": "यदि नहीं: TT-2 तुरंत शेड्यूल करें (TT-1 के कम से कम 4 सप्ताह बाद, प्रसव से कम से कम 4 सप्ताह पहले)।",
                "is_required": True,
            },
            {
                "id": "anc_q10", "order": 10, "input_type": "voice",
                "question_en": "Record counselling given, birth preparedness plan discussed, and any referrals made today.",
                "question_hi": "दी गई परामर्श, चर्चा की गई प्रसव तैयारी योजना और आज किए गए रेफरल दर्ज करें।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
        ],
        "meta_data": {"version": "2.0", "trimester_applicable": ["first", "second", "third"]},
    },
    {
        "template_type": "pnc",
        "name": "PNC – Postnatal Care Checkup",
        "questions": [
            {
                "id": "pnc_q1", "order": 1, "input_type": "yes_no",
                "question_en": "Is the mother exclusively breastfeeding the baby?",
                "question_hi": "क्या माँ बच्चे को विशेष रूप से स्तनपान करा रही है?",
                "action_en": "If NO: counsel on exclusive breastfeeding for 6 months. Address barriers.",
                "action_hi": "यदि नहीं: 6 महीने के लिए विशेष स्तनपान पर परामर्श दें। बाधाओं को दूर करें।",
                "is_required": True,
            },
            {
                "id": "pnc_q2", "order": 2, "input_type": "number",
                "question_en": "Mother's temperature in °C today?",
                "question_hi": "माँ का आज का तापमान °C में?",
                "action_en": "If >100°F (37.8°C) with foul-smelling discharge: refer to hospital for puerperal sepsis.",
                "action_hi": "यदि बदबूदार स्राव के साथ >100°F (37.8°C): प्रसवोत्तर सेप्सिस के लिए अस्पताल रेफर करें।",
                "is_required": True,
            },
            {
                "id": "pnc_q3", "order": 3, "input_type": "yes_no",
                "question_en": "Any excessive vaginal bleeding (more than 5 pads changed per day)?",
                "question_hi": "क्या अत्यधिक योनि से रक्तस्राव है (प्रतिदिन 5 से अधिक पैड बदलना)?",
                "action_en": "If YES: Refer to hospital immediately — postpartum haemorrhage risk.",
                "action_hi": "यदि हाँ: तुरंत अस्पताल रेफर करें — प्रसवोत्तर रक्तस्राव का जोखिम।",
                "is_required": True,
            },
            {
                "id": "pnc_q4", "order": 4, "input_type": "number",
                "question_en": "Baby's weight in kg today?",
                "question_hi": "बच्चे का आज का वजन किलोग्राम में?",
                "action_en": "Baby should regain birth weight by day 14. Weight loss >10% or not gaining = refer to SNCU.",
                "action_hi": "बच्चे को 14वें दिन तक जन्म का वजन फिर से प्राप्त करना चाहिए। 10% से अधिक वजन घटना = SNCU रेफर।",
                "is_required": True,
            },
            {
                "id": "pnc_q5", "order": 5, "input_type": "yes_no",
                "question_en": "Does the baby have yellow discoloration of skin or eyes (jaundice)?",
                "question_hi": "क्या बच्चे की त्वचा या आंखों में पीला रंग (पीलिया) है?",
                "action_en": "If YES after 14 days: refer to NBSU/SNCU for bilirubin assessment.",
                "action_hi": "यदि 14 दिनों के बाद हाँ: बिलीरुबिन मूल्यांकन के लिए NBSU/SNCU रेफर करें।",
                "is_required": True,
            },
            {
                "id": "pnc_q6", "order": 6, "input_type": "yes_no",
                "question_en": "Any signs of neonatal infection (skin pustules, swollen/red cord, fever)?",
                "question_hi": "क्या नवजात संक्रमण के कोई संकेत हैं (त्वचा पर फोड़े, सूजी/लाल नाभि, बुखार)?",
                "action_en": "If YES: refer to health facility immediately. Give first dose of Amoxicillin as per weight before referral.",
                "action_hi": "यदि हाँ: तुरंत स्वास्थ्य सुविधा रेफर करें। रेफरल से पहले वजन के अनुसार Amoxicillin की पहली खुराक दें।",
                "is_required": True,
            },
            {
                "id": "pnc_q7", "order": 7, "input_type": "voice",
                "question_en": "Describe the mother's physical and emotional wellbeing — any signs of postpartum depression, breast issues, or pain.",
                "question_hi": "माँ की शारीरिक और भावनात्मक भलाई का वर्णन करें — प्रसवोत्तर अवसाद, स्तन समस्याओं या दर्द के कोई संकेत।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
            {
                "id": "pnc_q8", "order": 8, "input_type": "yes_no",
                "question_en": "Has the mother been counselled on family planning options?",
                "question_hi": "क्या माँ को परिवार नियोजन विकल्पों के बारे में परामर्श दिया गया है?",
                "action_en": "If NO: counsel on spacing methods (LAM, condoms, pills) as appropriate.",
                "action_hi": "यदि नहीं: उचित अंतराल विधियों (LAM, कंडोम, गोलियाँ) पर परामर्श दें।",
                "is_required": True,
            },
            {
                "id": "pnc_q9", "order": 9, "input_type": "yes_no",
                "question_en": "Mother consuming nutritious diet (at least 4 meals/day) and IFA tablets?",
                "question_hi": "क्या माँ पौष्टिक आहार (कम से कम 4 भोजन/दिन) और IFA गोलियाँ ले रही है?",
                "action_en": "If NO: counsel on diet, provide IFA supply.",
                "action_hi": "यदि नहीं: आहार पर परामर्श दें, IFA आपूर्ति प्रदान करें।",
                "is_required": True,
            },
            {
                "id": "pnc_q10", "order": 10, "input_type": "voice",
                "question_en": "Record immunisation given today, next due dates, overall assessment, and plan for next visit.",
                "question_hi": "आज दिए गए टीकाकरण, अगली देय तिथियाँ, समग्र मूल्यांकन और अगली यात्रा की योजना दर्ज करें।",
                "action_en": None,
                "action_hi": None,
                "is_required": False,
            },
        ],
        "meta_data": {"version": "2.0", "applicable_days_post_delivery": [1, 3, 7, 14, 28, 42]},
    },
]


# ── Visit data helpers ─────────────────────────────────────────────────────

def _hbnc_data(day: int, base_weight: float = 2.9) -> dict:
    """Generate HBNC visit answers in list format with realistic transcripts."""
    t = _HBNC_TRANSCRIPTS[day]
    weight = round(base_weight + day * 0.045, 2)
    temp = round(36.6 + (day % 3) * 0.1, 1)
    jaundice = day <= 3  # mild jaundice common in first few days
    vaccinated = day >= 1  # BCG/OPV given at birth

    return {
        "answers": [
            {"question_id": "hbnc_q1", "answer": "yes"},
            {"question_id": "hbnc_q2", "answer": "yes"},
            {"question_id": "hbnc_q3", "answer": weight},
            {"question_id": "hbnc_q4", "answer": temp},
            {"question_id": "hbnc_q5", "answer": None,
             "transcript_hi": t["q5_hi"], "transcript_en": t["q5_en"],
             "audio_s3_key": f"audio/demo/hbnc_day{day}_q5.m4a"},
            {"question_id": "hbnc_q6", "answer": "yes"},
            {"question_id": "hbnc_q7", "answer": "yes" if jaundice else "no"},
            {"question_id": "hbnc_q8", "answer": None,
             "transcript_hi": t["q8_hi"], "transcript_en": t["q8_en"],
             "audio_s3_key": f"audio/demo/hbnc_day{day}_q8.m4a"},
            {"question_id": "hbnc_q9", "answer": "yes" if vaccinated else "no"},
            {"question_id": "hbnc_q10", "answer": None,
             "transcript_hi": t["q10_hi"], "transcript_en": t["q10_en"],
             "audio_s3_key": f"audio/demo/hbnc_day{day}_q10.m4a"},
        ],
        "duration_minutes": 20,
    }


def _anc_data(trimester: int) -> dict:
    """Generate ANC visit answers in list format."""
    sys_bp = [110, 118, 122][trimester - 1]
    dia_bp = [70,  74,  78][trimester - 1]
    weight = round(55 + trimester * 2.5, 1)
    hb     = round(10.5 + trimester * 0.3, 1)
    fundal = [12, 24, 32][trimester - 1]
    tt_done = trimester >= 2

    complaints_hi = [
        "माँ को हल्की मतली और थकान की शिकायत है। सुबह के समय मतली अधिक है। उन्हें छोटे-छोटे भोजन खाने की सलाह दी।",
        "माँ ने पीठ दर्द और पैरों में सूजन की शिकायत की। उन्हें आराम करने और पैर ऊंचे रखने की सलाह दी।",
        "माँ को सांस लेने में हल्की तकलीफ है जो तीसरी तिमाही में सामान्य है। कोई अन्य शिकायत नहीं।",
    ][trimester - 1]
    complaints_en = [
        "Mother complains of mild nausea and fatigue. Nausea worse in the morning. Advised small frequent meals.",
        "Mother reported back pain and leg swelling. Advised rest and keeping legs elevated.",
        "Mother has mild breathlessness which is normal in third trimester. No other complaints.",
    ][trimester - 1]

    plan_hi = [
        "माँ को IFA गोलियाँ दी गईं। अगला ANC चेकअप 4 सप्ताह में। TT-1 टीका दिया गया।",
        "माँ को TT-2 टीका दिया गया। अल्ट्रासाउंड के लिए PHC रेफर किया। अगला ANC 4 सप्ताह में।",
        "प्रसव तैयारी योजना पर परामर्श दिया। अस्पताल में प्रसव की सलाह दी। अगला ANC 2 सप्ताह में।",
    ][trimester - 1]
    plan_en = [
        "IFA tablets given. Next ANC in 4 weeks. TT-1 vaccine administered.",
        "TT-2 vaccine given. Referred to PHC for ultrasound. Next ANC in 4 weeks.",
        "Birth preparedness plan counselled. Institutional delivery advised. Next ANC in 2 weeks.",
    ][trimester - 1]

    return {
        "answers": [
            {"question_id": "anc_q1", "answer": weight},
            {"question_id": "anc_q2", "answer": sys_bp},
            {"question_id": "anc_q3", "answer": dia_bp},
            {"question_id": "anc_q4", "answer": "no"},
            {"question_id": "anc_q5", "answer": hb},
            {"question_id": "anc_q6", "answer": "yes"},
            {"question_id": "anc_q7", "answer": "no"},
            {"question_id": "anc_q8", "answer": None,
             "transcript_hi": complaints_hi, "transcript_en": complaints_en,
             "audio_s3_key": f"audio/demo/anc_t{trimester}_q8.m4a"},
            {"question_id": "anc_q9", "answer": "yes" if tt_done else "no"},
            {"question_id": "anc_q10", "answer": None,
             "transcript_hi": plan_hi, "transcript_en": plan_en,
             "audio_s3_key": f"audio/demo/anc_t{trimester}_q10.m4a"},
        ],
        "duration_minutes": 25,
    }


def _pnc_data(day: int, baby_base_weight: float = 3.0) -> dict:
    """Generate PNC visit answers in list format."""
    baby_weight = round(baby_base_weight + day * 0.03, 2)
    temp = 36.9

    mother_hi = [
        "माँ थोड़ी थकी हुई हैं लेकिन खुश हैं। स्तन में दूध अच्छी तरह आ रहा है। कोई स्तन दर्द नहीं। रात में नींद कम है लेकिन परिवार मदद कर रहा है।",
        "माँ ठीक हैं। स्तनपान अच्छा चल रहा है। कोई अवसाद के संकेत नहीं। माँ खुद भी खाना ठीक से खा रही हैं।",
        "माँ बहुत अच्छी तरह ठीक हो रही हैं। बच्चे की देखभाल में आत्मविश्वास है। परिवार नियोजन पर परामर्श दिया।",
    ]
    mother_en = [
        "Mother is a bit tired but happy. Milk supply good in both breasts. No breast pain. Less sleep at night but family helping.",
        "Mother doing well. Breastfeeding going well. No signs of depression. Mother eating properly herself.",
        "Mother recovering very well. Confident in baby care. Family planning counselled.",
    ]
    plan_hi = [
        "माँ और बच्चे की स्थिति अच्छी है। बच्चे को गर्म रखने और स्तनपान जारी रखने की सलाह। अगली यात्रा 3 दिन में।",
        "IFA गोलियाँ जारी रखने की सलाह। 6 सप्ताह में टीकाकरण याद दिलाया। परिवार नियोजन विकल्प बताए। अगली यात्रा 14 दिन में।",
        "HBNC पूर्ण। माँ और बच्चे दोनों स्वस्थ हैं। छठे सप्ताह में PHC जाने की सलाह। परिवार नियोजन अपनाने की प्रेरणा दी।",
    ]
    plan_en = [
        "Mother and baby in good condition. Advised to keep baby warm and continue breastfeeding. Next visit in 3 days.",
        "Advised to continue IFA tablets. Reminded about 6-week vaccination. Family planning options explained. Next visit day 14.",
        "PNC completed. Both mother and baby healthy. Advised PHC visit at 6 weeks. Motivated for family planning adoption.",
    ]
    idx = 0 if day <= 3 else (1 if day <= 14 else 2)

    return {
        "answers": [
            {"question_id": "pnc_q1", "answer": "yes"},
            {"question_id": "pnc_q2", "answer": temp},
            {"question_id": "pnc_q3", "answer": "no"},
            {"question_id": "pnc_q4", "answer": baby_weight},
            {"question_id": "pnc_q5", "answer": "yes" if day <= 3 else "no"},
            {"question_id": "pnc_q6", "answer": "no"},
            {"question_id": "pnc_q7", "answer": None,
             "transcript_hi": mother_hi[idx], "transcript_en": mother_en[idx],
             "audio_s3_key": f"audio/demo/pnc_day{day}_q7.m4a"},
            {"question_id": "pnc_q8", "answer": "yes" if day >= 7 else "no"},
            {"question_id": "pnc_q9", "answer": "yes"},
            {"question_id": "pnc_q10", "answer": None,
             "transcript_hi": plan_hi[idx], "transcript_en": plan_en[idx],
             "audio_s3_key": f"audio/demo/pnc_day{day}_q10.m4a"},
        ],
        "duration_minutes": 30,
    }


# ═══════════════════════════════════════════════════════════════════════════
# Reset
# ═══════════════════════════════════════════════════════════════════════════

def reset_data(db) -> None:
    print("Resetting all data …")
    for table in ("sync_logs", "visits", "beneficiaries", "workers",
                  "collection_centers", "visit_templates"):
        db.execute(text(f"DELETE FROM {table}"))
    db.commit()
    print("All tables cleared.\n")


# ═══════════════════════════════════════════════════════════════════════════
# Seed
# ═══════════════════════════════════════════════════════════════════════════

def seed(reset: bool = False) -> None:
    db = SessionLocal()
    try:
        if reset:
            reset_data(db)

        now = datetime.now(UTC)

        # ── Collection Centers ──────────────────────────────────────────────
        print("── Collection Centers ──────────────────────────────────────")
        centers: list[CollectionCenter] = []
        for data in COLLECTION_CENTERS:
            obj = db.query(CollectionCenter).filter_by(name=data["name"]).first()
            if obj:
                print(f"  [skip] {data['name']}")
            else:
                obj = CollectionCenter(**data)
                db.add(obj)
                db.flush()
                print(f"  [+]    {obj.name}")
            centers.append(obj)
        db.commit()
        for c in centers:
            db.refresh(c)

        # ── Visit Templates ─────────────────────────────────────────────────
        print("\n── Visit Templates ─────────────────────────────────────────")
        templates: dict[str, VisitTemplate] = {}
        for data in VISIT_TEMPLATES:
            obj = db.query(VisitTemplate).filter_by(template_type=data["template_type"]).first()
            if obj:
                print(f"  [skip] {data['name']}")
            else:
                obj = VisitTemplate(**data)
                db.add(obj)
                db.flush()
                print(f"  [+]    {obj.name}")
            templates[data["template_type"]] = obj
        db.commit()
        for t in templates.values():
            db.refresh(t)

        # ── Workers ─────────────────────────────────────────────────────────
        print("\n── Workers ─────────────────────────────────────────────────")
        pw_hash = AuthService.hash_password(DEFAULT_PASSWORD)
        workers_by_type: dict[str, list[Worker]] = {}

        for idx, (wtype, prefix, people) in enumerate(WORKERS_BY_TYPE):
            center = centers[idx % len(centers)]
            workers_by_type[wtype] = []
            for num, (first, last, phone, aadhar, email) in enumerate(people, start=1):
                wid = f"{prefix}{num:06d}"
                obj = db.query(Worker).filter_by(worker_id=wid).first()
                if obj:
                    print(f"  [skip] {wid}  {first} {last}")
                else:
                    obj = Worker(
                        first_name=first, last_name=last,
                        phone_number=phone, aadhar_id=aadhar,
                        email=email, address=center.address,
                        worker_type=wtype, worker_id=wid,
                        password_hash=pw_hash,
                        collection_center_id=center.id,
                        meta_data={"seeded": True},
                    )
                    db.add(obj)
                    db.flush()
                    print(f"  [+]    {wid}  {first} {last}  ({wtype})")
                workers_by_type[wtype].append(obj)
        db.commit()

        # ── Beneficiaries ───────────────────────────────────────────────────
        print("\n── Beneficiaries ───────────────────────────────────────────")
        asha_list = workers_by_type.get("asha_worker", [])
        beneficiaries: list[Beneficiary] = []
        for idx, data in enumerate(BENEFICIARIES):
            obj = db.query(Beneficiary).filter_by(mcts_id=data["mcts_id"]).first()
            if obj:
                print(f"  [skip] {data['mcts_id']}  {data['first_name']} {data['last_name']}")
            else:
                assigned = asha_list[idx % len(asha_list)] if asha_list else None
                obj = Beneficiary(
                    assigned_asha_id=assigned.id if assigned else None,
                    **data,
                )
                db.add(obj)
                db.flush()
                print(f"  [+]    {obj.mcts_id}  {obj.first_name} {obj.last_name}  ({obj.beneficiary_type})")
            beneficiaries.append(obj)
        db.commit()
        for b in beneficiaries:
            db.refresh(b)

        # ── Visits ──────────────────────────────────────────────────────────
        # Beneficiary index map:
        #  0 = Seema Pawar      (mother, MCTS000001)
        #  1 = Rohit Pawar      (newborn, MCTS000002) — HBNC 60 days ago
        #  2 = Priya Kale       (mother, MCTS000003)
        #  3 = Baby Kale        (newborn, MCTS000004) — HBNC 30 days ago
        #  4 = Sunita More      (mother, MCTS000005)
        #  5 = Baby More        (newborn, MCTS000006) — HBNC 7 days ago (in progress)
        #  6 = Lakshmi Nair     (mother, ANC)
        #  7 = Champa Devi      (mother, ANC high-risk)
        #  8 = Asha Jadhav      (individual)
        #  9 = Mohan Kulkarni   (individual)
        #
        # (beneficiary_idx, template_type, day_number, days_ago, is_synced, base_weight_or_trimester)
        print("\n── Visits ──────────────────────────────────────────────────")
        visit_specs = [
            # ── Rohit Pawar (MCTS000002) — all 5 HBNC days, completed 60 days ago ──
            (1, "hbnc",  1,  60, True,  2.9),
            (1, "hbnc",  3,  58, True,  2.9),
            (1, "hbnc",  7,  54, True,  2.9),
            (1, "hbnc", 14,  47, True,  2.9),
            (1, "hbnc", 28,  33, True,  2.9),
            # ── Baby Kale (MCTS000004) — all 5 HBNC days, ongoing ──
            (3, "hbnc",  1,  30, True,  3.1),
            (3, "hbnc",  3,  28, True,  3.1),
            (3, "hbnc",  7,  24, True,  3.1),
            (3, "hbnc", 14,  17, True,  3.1),
            (3, "hbnc", 28,   3, False, 3.1),   # pending sync
            # ── Baby More (MCTS000006) — low birth weight, days 1 & 3 done, day 7 pending ──
            (5, "hbnc",  1,   7, True,  2.7),
            (5, "hbnc",  3,   5, True,  2.7),
            (5, "hbnc",  7,   1, False, 2.7),   # pending sync
            # ── Seema Pawar (MCTS000001) — ANC visits across 3 trimesters ──
            (0, "anc",  None, 120, True,  1),
            (0, "anc",  None,  75, True,  2),
            (0, "anc",  None,  30, True,  3),
            # ── Lakshmi Nair (MCTS000007) — ANC, currently 2nd trimester ──
            (6, "anc",  None,  60, True,  1),
            (6, "anc",  None,  25, True,  2),
            (6, "anc",  None,   5, False, 2),   # pending sync
            # ── Champa Devi (MCTS000008) — ANC high risk, 3rd trimester ──
            (7, "anc",  None,  45, True,  2),
            (7, "anc",  None,  15, True,  3),
            # ── Priya Kale (MCTS000003) — PNC after delivery ──
            (2, "pnc",  1,   20, True,  3.1),
            (2, "pnc",  7,   14, True,  3.1),
            (2, "pnc", 14,    7, True,  3.1),
            (2, "pnc", 28,    2, False, 3.1),   # pending sync
            # ── Sunita More (MCTS000005) — PNC (c-section) ──
            (4, "pnc",  1,   30, True,  2.7),
            (4, "pnc",  7,   24, True,  2.7),
            (4, "pnc", 14,   17, True,  2.7),
            (4, "pnc", 28,    3, False, 2.7),   # pending sync
        ]

        visits: list[Visit] = []
        for spec in visit_specs:
            b_idx, ttype, day_num, days_ago, synced, extra = spec
            ben = beneficiaries[b_idx]
            tmpl = templates[ttype]
            asha = asha_list[b_idx % len(asha_list)]
            visit_dt = now - timedelta(days=days_ago)

            if ttype == "hbnc":
                vdata = _hbnc_data(day_num or 1, base_weight=extra)
            elif ttype == "anc":
                vdata = _anc_data(int(extra))
            else:
                vdata = _pnc_data(day_num or 1, baby_base_weight=extra)

            v = Visit(
                visit_type=ttype,
                visit_date_time=visit_dt,
                day_number=day_num,
                is_synced=synced,
                assigned_asha_id=asha.id,
                beneficiary_id=ben.id,
                template_id=tmpl.id,
                visit_data=vdata,
                synced_at=visit_dt + timedelta(hours=2) if synced else None,
                meta_data={"seeded": True},
            )
            db.add(v)
            db.flush()
            visits.append(v)
            tag = "synced" if synced else "pending"
            print(f"  [+]    {ttype.upper()} day={day_num or '-'}  {ben.first_name} {ben.last_name}  [{tag}]")
        db.commit()
        for v in visits:
            db.refresh(v)

        # ── Sync Logs ───────────────────────────────────────────────────────
        # (visit_idx, worker_type, status, error_msg, days_ago)
        print("\n── Sync Logs ───────────────────────────────────────────────")
        sync_specs = [
            # Rohit Pawar HBNC series (visits 0-4)
            (0,  "asha_worker", "completed",  None,                              59),
            (1,  "asha_worker", "completed",  None,                              57),
            (2,  "asha_worker", "completed",  None,                              53),
            (3,  "asha_worker", "completed",  None,                              46),
            (4,  "asha_worker", "completed",  None,                              32),
            # Baby Kale HBNC series (visits 5-9)
            (5,  "asha_worker", "completed",  None,                              29),
            (6,  "asha_worker", "completed",  None,                              27),
            (7,  "asha_worker", "completed",  None,                              23),
            (8,  "asha_worker", "completed",  None,                              16),
            # Baby More HBNC (visits 10-11 synced, 12 pending)
            (10, "asha_worker", "completed",  None,                               6),
            (11, "asha_worker", "completed",  None,                               4),
            (12, "asha_worker", "failed",     "Network timeout — audio upload",   0),
            # ANC visits (visits 13-20)
            (13, "asha_worker", "completed",  None,                             119),
            (14, "asha_worker", "completed",  None,                              74),
            (15, "asha_worker", "completed",  None,                              29),
            (16, "asha_worker", "completed",  None,                              59),
            (17, "asha_worker", "completed",  None,                              24),
            (19, "asha_worker", "completed",  None,                              44),
            (20, "asha_worker", "completed",  None,                              14),
            # PNC visits (visits 21-27)
            (21, "asha_worker", "completed",  None,                              19),
            (22, "asha_worker", "completed",  None,                              13),
            (23, "asha_worker", "completed",  None,                               6),
            (25, "asha_worker", "completed",  None,                              29),
            (26, "asha_worker", "completed",  None,                              23),
            (27, "asha_worker", "completed",  None,                              16),
            # A few incomplete / failed entries for realism
            (9,  "asha_worker", "incomplete", "Partial sync — battery died",      2),
            (18, "asha_worker", "incomplete", "Poor network connectivity",         4),
        ]

        for v_idx, wtype, status, error_msg, days_ago in sync_specs:
            if v_idx >= len(visits):
                continue
            visit = visits[v_idx]
            worker = workers_by_type[wtype][v_idx % len(workers_by_type[wtype])]
            log = SyncLog(
                visit_id=visit.id,
                worker_id=worker.id,
                collection_center_id=worker.collection_center_id,
                date_time=now - timedelta(days=days_ago),
                status=status,
                error_message=error_msg,
                meta_data={"seeded": True},
            )
            db.add(log)
            print(f"  [+]    {status:<12}  visit_id={visit.id}  worker={worker.worker_id}")
        db.commit()

        # ── Summary ─────────────────────────────────────────────────────────
        print("\n════════════════════════════════════════════════════════════")
        print("Seed complete!")
        print()
        print(f"  Collection centers : {len(COLLECTION_CENTERS)}")
        print(f"  Workers            : {sum(len(p) for _,_,p in WORKERS_BY_TYPE)}  (5 types × 5)")
        print(f"  Beneficiaries      : {len(BENEFICIARIES)}")
        print(f"  Visit templates    : {len(VISIT_TEMPLATES)}")
        print(f"  Visits             : {len(visit_specs)}")
        print(f"  Sync logs          : {len(sync_specs)}")
        print()
        print("  Web dashboard login (Medical Officer)")
        print("  ┌─────────────┬──────────────┐")
        print("  │ worker_id   │ MO000001     │")
        print(f"  │ password    │ {DEFAULT_PASSWORD:<12} │")
        print("  └─────────────┴──────────────┘")
        print()
        print("  ASHA Worker login (mobile app)")
        print("  ┌─────────────┬──────────────┐")
        print("  │ worker_id   │ AW000001     │")
        print(f"  │ password    │ {DEFAULT_PASSWORD:<12} │")
        print("  └─────────────┴──────────────┘")
        print()
        print("  All workers share the same password: Admin@123")
        print("  IDs: MO000001-5 · AW000001-5 · AN000001-5 · AA000001-5 · SV000001-5")
        print()
        print("  HBNC Template: 10 questions (5 yes/no · 2 number · 3 voice)")
        print("  ANC Template : 10 questions (3 yes/no · 4 number · 2 voice · 1 number)")
        print("  PNC Template : 10 questions (4 yes/no · 3 number · 2 voice · 1 number)")
        print()

    except Exception as e:
        print(f"\nERROR: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Voice of Care database")
    parser.add_argument("--reset", action="store_true",
                        help="Wipe all tables before seeding")
    args = parser.parse_args()
    seed(reset=args.reset)
