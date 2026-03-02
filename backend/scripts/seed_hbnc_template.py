"""
Seed script for HBNC (Home-Based Newborn Care) template
Creates a comprehensive HBNC visit template with questions in English and Hindi

Requirements: 5, 34
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.visit_template import VisitTemplate


def create_hbnc_template(db: Session) -> VisitTemplate:
    """
    Create HBNC template with comprehensive questions
    
    Questions cover:
    - Breathing assessment
    - Feeding assessment
    - Temperature monitoring
    - Umbilical cord care
    - Jaundice detection
    - Weight measurement
    """
    
    hbnc_questions = [
        {
            "id": "hbnc_q1",
            "order": 1,
            "input_type": "yes_no",
            "question_en": "Is the baby breathing normally?",
            "question_hi": "क्या बच्चा सामान्य रूप से सांस ले रहा है?",
            "action_en": "If NO: Refer to nearest health facility immediately. This is a critical emergency.",
            "action_hi": "यदि नहीं: तुरंत निकटतम स्वास्थ्य सुविधा में रेफर करें। यह एक गंभीर आपातकाल है।",
            "is_required": True
        },
        {
            "id": "hbnc_q2",
            "order": 2,
            "input_type": "number",
            "question_en": "What is the baby's breathing rate per minute? (Count for 60 seconds)",
            "question_hi": "बच्चे की सांस लेने की दर प्रति मिनट क्या है? (60 सेकंड के लिए गिनें)",
            "action_en": "Normal range: 30-60 breaths per minute. If outside range, refer to health facility.",
            "action_hi": "सामान्य सीमा: 30-60 सांस प्रति मिनट। यदि सीमा से बाहर है, तो स्वास्थ्य सुविधा में रेफर करें।",
            "is_required": True
        },
        {
            "id": "hbnc_q3",
            "order": 3,
            "input_type": "yes_no",
            "question_en": "Is the baby feeding well (breastfeeding at least 8 times in 24 hours)?",
            "question_hi": "क्या बच्चा अच्छी तरह से दूध पी रहा है (24 घंटे में कम से कम 8 बार स्तनपान)?",
            "action_en": "If NO: Counsel mother on proper breastfeeding technique. Demonstrate correct positioning and attachment.",
            "action_hi": "यदि नहीं: माँ को उचित स्तनपान तकनीक पर परामर्श दें। सही स्थिति और लगाव का प्रदर्शन करें।",
            "is_required": True
        },
        {
            "id": "hbnc_q4",
            "order": 4,
            "input_type": "voice",
            "question_en": "Describe any feeding difficulties or concerns the mother has mentioned.",
            "question_hi": "माँ द्वारा बताई गई किसी भी खिलाने की कठिनाई या चिंता का वर्णन करें।",
            "action_en": None,
            "action_hi": None,
            "is_required": False
        },
        {
            "id": "hbnc_q5",
            "order": 5,
            "input_type": "number",
            "question_en": "What is the baby's temperature in degrees Celsius? (Use thermometer)",
            "question_hi": "बच्चे का तापमान डिग्री सेल्सियस में क्या है? (थर्मामीटर का उपयोग करें)",
            "action_en": "Normal range: 36.5-37.5°C. If <36.5°C (hypothermia) or >37.5°C (fever), refer immediately.",
            "action_hi": "सामान्य सीमा: 36.5-37.5°C। यदि <36.5°C (हाइपोथर्मिया) या >37.5°C (बुखार), तुरंत रेफर करें।",
            "is_required": True
        },
        {
            "id": "hbnc_q6",
            "order": 6,
            "input_type": "yes_no",
            "question_en": "Is the baby's body warm to touch?",
            "question_hi": "क्या बच्चे का शरीर छूने पर गर्म है?",
            "action_en": "If NO: Ensure baby is kept warm with skin-to-skin contact or wrapped properly. Check temperature.",
            "action_hi": "यदि नहीं: सुनिश्चित करें कि बच्चे को त्वचा से त्वचा के संपर्क से या ठीक से लपेटकर गर्म रखा जाए। तापमान जांचें।",
            "is_required": True
        },
        {
            "id": "hbnc_q7",
            "order": 7,
            "input_type": "yes_no",
            "question_en": "Is the umbilical cord stump clean and dry?",
            "question_hi": "क्या नाभि का ठूंठ साफ और सूखा है?",
            "action_en": "If NO: Counsel mother on proper cord care. Clean with clean water and keep dry. No application of substances.",
            "action_hi": "यदि नहीं: माँ को उचित नाभि देखभाल पर परामर्श दें। साफ पानी से साफ करें और सूखा रखें। कोई पदार्थ न लगाएं।",
            "is_required": True
        },
        {
            "id": "hbnc_q8",
            "order": 8,
            "input_type": "yes_no",
            "question_en": "Is there any redness, swelling, or discharge around the umbilical cord?",
            "question_hi": "क्या नाभि के आसपास कोई लालिमा, सूजन या स्राव है?",
            "action_en": "If YES: This indicates infection. Refer to health facility immediately for treatment.",
            "action_hi": "यदि हाँ: यह संक्रमण का संकेत है। उपचार के लिए तुरंत स्वास्थ्य सुविधा में रेफर करें।",
            "is_required": True
        },
        {
            "id": "hbnc_q9",
            "order": 9,
            "input_type": "yes_no",
            "question_en": "Does the baby have yellow discoloration of skin or eyes (jaundice)?",
            "question_hi": "क्या बच्चे की त्वचा या आंखों में पीला रंग (पीलिया) है?",
            "action_en": "If YES: Check severity. If jaundice extends to palms/soles or baby is lethargic, refer immediately.",
            "action_hi": "यदि हाँ: गंभीरता जांचें। यदि पीलिया हथेलियों/तलवों तक फैलता है या बच्चा सुस्त है, तुरंत रेफर करें।",
            "is_required": True
        },
        {
            "id": "hbnc_q10",
            "order": 10,
            "input_type": "yes_no",
            "question_en": "If jaundice is present, does it extend to the palms and soles?",
            "question_hi": "यदि पीलिया मौजूद है, तो क्या यह हथेलियों और तलवों तक फैलता है?",
            "action_en": "If YES: Severe jaundice. Refer immediately for phototherapy or exchange transfusion.",
            "action_hi": "यदि हाँ: गंभीर पीलिया। फोटोथेरेपी या एक्सचेंज ट्रांसफ्यूजन के लिए तुरंत रेफर करें।",
            "is_required": False
        },
        {
            "id": "hbnc_q11",
            "order": 11,
            "input_type": "number",
            "question_en": "What is the baby's weight in kilograms? (Use weighing scale)",
            "question_hi": "बच्चे का वजन किलोग्राम में क्या है? (वजन मशीन का उपयोग करें)",
            "action_en": "Monitor weight gain. Baby should regain birth weight by 2 weeks. Weight loss >10% needs attention.",
            "action_hi": "वजन बढ़ने की निगरानी करें। बच्चे को 2 सप्ताह तक जन्म के वजन को फिर से प्राप्त करना चाहिए। 10% से अधिक वजन घटने पर ध्यान देने की आवश्यकता है।",
            "is_required": True
        },
        {
            "id": "hbnc_q12",
            "order": 12,
            "input_type": "yes_no",
            "question_en": "Is the baby active and crying normally?",
            "question_hi": "क्या बच्चा सक्रिय है और सामान्य रूप से रो रहा है?",
            "action_en": "If NO: Check for signs of illness. Lethargic or not crying baby needs immediate medical attention.",
            "action_hi": "यदि नहीं: बीमारी के संकेतों की जांच करें। सुस्त या न रोने वाले बच्चे को तत्काल चिकित्सा ध्यान की आवश्यकता है।",
            "is_required": True
        },
        {
            "id": "hbnc_q13",
            "order": 13,
            "input_type": "yes_no",
            "question_en": "Are there any skin infections, pustules, or rashes on the baby's body?",
            "question_hi": "क्या बच्चे के शरीर पर कोई त्वचा संक्रमण, फोड़े या चकत्ते हैं?",
            "action_en": "If YES: Refer to health facility for treatment. Counsel on hygiene and keeping baby clean and dry.",
            "action_hi": "यदि हाँ: उपचार के लिए स्वास्थ्य सुविधा में रेफर करें। स्वच्छता और बच्चे को साफ और सूखा रखने पर परामर्श दें।",
            "is_required": True
        },
        {
            "id": "hbnc_q14",
            "order": 14,
            "input_type": "yes_no",
            "question_en": "Has the baby passed urine in the last 24 hours?",
            "question_hi": "क्या बच्चे ने पिछले 24 घंटों में पेशाब किया है?",
            "action_en": "If NO: Check for dehydration. Ensure adequate breastfeeding. Refer if no urine for >24 hours.",
            "action_hi": "यदि नहीं: निर्जलीकरण की जांच करें। पर्याप्त स्तनपान सुनिश्चित करें। यदि 24 घंटे से अधिक समय तक पेशाब नहीं है तो रेफर करें।",
            "is_required": True
        },
        {
            "id": "hbnc_q15",
            "order": 15,
            "input_type": "voice",
            "question_en": "Record any additional observations or concerns about the baby's health.",
            "question_hi": "बच्चे के स्वास्थ्य के बारे में कोई अतिरिक्त अवलोकन या चिंता रिकॉर्ड करें।",
            "action_en": None,
            "action_hi": None,
            "is_required": False
        }
    ]
    
    # Check if HBNC template already exists
    existing_template = db.query(VisitTemplate).filter(
        VisitTemplate.template_type == "hbnc",
        VisitTemplate.name == "HBNC Standard Template"
    ).first()
    
    if existing_template:
        print(f"HBNC template already exists with ID: {existing_template.id}")
        return existing_template
    
    # Create new template
    template = VisitTemplate(
        template_type="hbnc",
        name="HBNC Standard Template",
        questions=hbnc_questions,
        meta_data={
            "version": "1.0",
            "description": "Standard HBNC visit template covering breathing, feeding, temperature, umbilical cord, jaundice, and weight assessment",
            "applicable_days": [1, 3, 7, 14, 28],
            "created_by": "system"
        }
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    print(f"✓ HBNC template created successfully with ID: {template.id}")
    print(f"  Template Type: {template.template_type}")
    print(f"  Template Name: {template.name}")
    print(f"  Total Questions: {len(template.questions)}")
    print(f"  Question Types:")
    
    # Count question types
    yes_no_count = sum(1 for q in template.questions if q['input_type'] == 'yes_no')
    number_count = sum(1 for q in template.questions if q['input_type'] == 'number')
    voice_count = sum(1 for q in template.questions if q['input_type'] == 'voice')
    
    print(f"    - Yes/No: {yes_no_count}")
    print(f"    - Number: {number_count}")
    print(f"    - Voice: {voice_count}")
    
    return template


def main():
    """Main function to seed HBNC template"""
    print("=" * 60)
    print("HBNC Template Seed Script")
    print("=" * 60)
    print()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create HBNC template
        template = create_hbnc_template(db)
        
        print()
        print("=" * 60)
        print("Seed script completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"✗ Error occurred: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
