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
    {
        "first_name": "Seema",   "last_name": "Pawar",
        "phone_number": "9870001001", "aadhar_id": "600000000001",
        "age": 26, "weight": 58.5,
        "mcts_id": "MCTS000001", "beneficiary_type": "mother_child",
        "address": "Plot 5, Anand Nagar, Pune 411001",
        "meta_data": {"lmp_date": "2025-10-01", "edd": "2026-07-08"},
    },
    {
        "first_name": "Rohit",   "last_name": "Shinde",
        "phone_number": "9870001002", "aadhar_id": "600000000002",
        "age": 1, "weight": 4.2,
        "mcts_id": "MCTS000002", "beneficiary_type": "child",
        "address": "House 12, Kothrud, Pune 411038",
        "meta_data": {"dob": "2025-12-15", "birth_weight": 2.9},
    },
    {
        "first_name": "Asha",    "last_name": "Jadhav",
        "phone_number": "9870001003", "aadhar_id": "600000000003",
        "age": 35, "weight": 62.0,
        "mcts_id": "MCTS000003", "beneficiary_type": "individual",
        "address": "Lane 7, Hadapsar, Pune 411013",
        "meta_data": {"condition": "hypertension"},
    },
    {
        "first_name": "Mohan",   "last_name": "Kulkarni",
        "phone_number": "9870001004", "aadhar_id": "600000000004",
        "age": 62, "weight": 72.3,
        "mcts_id": "MCTS000004", "beneficiary_type": "individual",
        "address": "Sector 4, Pimpri, Pune 411017",
        "meta_data": {"condition": "diabetes"},
    },
    {
        "first_name": "Lakshmi", "last_name": "Nair",
        "phone_number": "9870001005", "aadhar_id": "600000000005",
        "age": 23, "weight": 55.0,
        "mcts_id": "MCTS000005", "beneficiary_type": "mother_child",
        "address": "Block B, Yerawada, Pune 411006",
        "meta_data": {"lmp_date": "2025-11-10", "edd": "2026-08-17"},
    },
]

VISIT_TEMPLATES = [
    {
        "template_type": "hbnc",
        "name": "HBNC – Home Based Newborn Care",
        "questions": [
            {"id": "q1",  "text": "Is the baby breathing normally (30–60 breaths/min)?", "type": "boolean"},
            {"id": "q2",  "text": "Is the cord stump dry and clean (no redness/discharge)?", "type": "boolean"},
            {"id": "q3",  "text": "Is the baby exclusively breastfeeding (every 2–3 hrs)?", "type": "boolean"},
            {"id": "q4",  "text": "Baby's weight today (kg)?", "type": "number"},
            {"id": "q5",  "text": "Normal skin colour — no jaundice?", "type": "boolean"},
            {"id": "q6",  "text": "Baby active and responsive to touch/sound?", "type": "boolean"},
            {"id": "q7",  "text": "Baby's temperature today (°C)?", "type": "number"},
            {"id": "q8",  "text": "Any danger signs (convulsions, not feeding, very cold)?", "type": "boolean"},
            {"id": "q9",  "text": "BCG and OPV-0 immunisation received?", "type": "boolean"},
            {"id": "q10", "text": "Additional observations:", "type": "text"},
        ],
        "meta_data": {"version": "1.0", "applicable_days": [1, 3, 7, 14, 28]},
    },
    {
        "template_type": "anc",
        "name": "ANC – Antenatal Care Checkup",
        "questions": [
            {"id": "q1",  "text": "Mother's weight today (kg)?", "type": "number"},
            {"id": "q2",  "text": "Blood pressure – systolic (mmHg)?", "type": "number"},
            {"id": "q3",  "text": "Blood pressure – diastolic (mmHg)?", "type": "number"},
            {"id": "q4",  "text": "Swelling in feet, hands, or face?", "type": "boolean"},
            {"id": "q5",  "text": "Haemoglobin level if tested (g/dL)?", "type": "number"},
            {"id": "q6",  "text": "Taking iron-folic acid tablets daily?", "type": "boolean"},
            {"id": "q7",  "text": "Any vaginal bleeding or unusual discharge?", "type": "boolean"},
            {"id": "q8",  "text": "Severe headache or blurred vision?", "type": "boolean"},
            {"id": "q9",  "text": "TT vaccination status?", "type": "select",
             "options": ["Not given", "TT-1", "TT-2", "Booster"]},
            {"id": "q10", "text": "Foetal movement felt by mother?", "type": "boolean"},
            {"id": "q11", "text": "Fundal height (cm)?", "type": "number"},
            {"id": "q12", "text": "Complaints / observations:", "type": "text"},
        ],
        "meta_data": {"version": "1.0", "trimester_applicable": ["first", "second", "third"]},
    },
    {
        "template_type": "pnc",
        "name": "PNC – Postnatal Care Checkup",
        "questions": [
            {"id": "q1",  "text": "Is the mother exclusively breastfeeding?", "type": "boolean"},
            {"id": "q2",  "text": "Breast pain, redness, or hardness (mastitis)?", "type": "boolean"},
            {"id": "q3",  "text": "Mother's temperature today (°C)?", "type": "number"},
            {"id": "q4",  "text": "Excessive vaginal bleeding (lochia) post-delivery?", "type": "boolean"},
            {"id": "q5",  "text": "Mother's blood pressure – systolic (mmHg)?", "type": "number"},
            {"id": "q6",  "text": "Mother's blood pressure – diastolic (mmHg)?", "type": "number"},
            {"id": "q7",  "text": "Baby's weight today (kg)?", "type": "number"},
            {"id": "q8",  "text": "Baby passing urine at least 6 times/day?", "type": "boolean"},
            {"id": "q9",  "text": "Signs of neonatal infection (skin pustules, swollen cord, fever)?", "type": "boolean"},
            {"id": "q10", "text": "Signs of post-partum depression in mother?", "type": "boolean"},
            {"id": "q11", "text": "Mother counselled on family planning options?", "type": "boolean"},
            {"id": "q12", "text": "Immunisation given today:", "type": "text"},
            {"id": "q13", "text": "Additional notes:", "type": "text"},
        ],
        "meta_data": {"version": "1.0", "applicable_days_post_delivery": [1, 3, 7, 14, 28, 42]},
    },
]


# ── Visit data helpers ─────────────────────────────────────────────────────

def _hbnc_data(day: int) -> dict:
    return {
        "answers": {
            "q1": True, "q2": True, "q3": True,
            "q4": round(2.9 + day * 0.05, 2),
            "q5": True, "q6": True,
            "q7": 36.8, "q8": False, "q9": day > 1,
            "q10": f"Baby doing well on day {day}. No concerns.",
        },
        "audio_url": None, "duration_minutes": 20,
    }

def _anc_data(trimester: int) -> dict:
    return {
        "answers": {
            "q1": round(55 + trimester * 2.5, 1),
            "q2": [110, 118, 122][trimester - 1],
            "q3": [70, 74, 78][trimester - 1],
            "q4": False,
            "q5": round(10.5 + trimester * 0.3, 1),
            "q6": True, "q7": False, "q8": False,
            "q9": ["TT-1", "TT-2", "Booster"][trimester - 1],
            "q10": True,
            "q11": [12, 24, 32][trimester - 1],
            "q12": "No significant complaints.",
        },
        "audio_url": None, "duration_minutes": 25,
    }

def _pnc_data(day: int) -> dict:
    return {
        "answers": {
            "q1": True, "q2": False, "q3": 36.9,
            "q4": False, "q5": 116, "q6": 74,
            "q7": round(3.0 + day * 0.03, 2),
            "q8": True, "q9": False, "q10": False, "q11": True,
            "q12": "OPV-1 given." if day >= 7 else "No immunisation today.",
            "q13": f"Mother and baby stable on PNC day {day}.",
        },
        "audio_url": None, "duration_minutes": 30,
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
        # (beneficiary_idx, template_type, day_number, days_ago, is_synced)
        print("\n── Visits ──────────────────────────────────────────────────")
        visit_specs = [
            (1, "hbnc",  1,  60, True),
            (1, "hbnc",  3,  58, True),
            (1, "hbnc",  7,  54, True),
            (1, "hbnc", 14,  47, True),
            (1, "hbnc", 28,  33, False),
            (0, "anc",  None, 90, True),
            (0, "anc",  None, 60, True),
            (0, "anc",  None, 30, False),
            (4, "pnc",  1,   20, True),
            (4, "pnc",  7,   14, True),
            (4, "pnc",  28,   1, False),
            (4, "anc",  None, 50, True),
            (4, "anc",  None, 25, True),
            (2, "pnc",  None, 10, False),
            (3, "anc",  None, 15, True),
        ]

        visits: list[Visit] = []
        for b_idx, ttype, day_num, days_ago, synced in visit_specs:
            ben = beneficiaries[b_idx]
            tmpl = templates[ttype]
            asha = asha_list[b_idx % len(asha_list)]
            visit_dt = now - timedelta(days=days_ago)

            if ttype == "hbnc":
                vdata = _hbnc_data(day_num or 1)
            elif ttype == "anc":
                tri = 1 if days_ago > 70 else (2 if days_ago > 35 else 3)
                vdata = _anc_data(tri)
            else:
                vdata = _pnc_data(day_num or 1)

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
            (0,  "asha_worker", "completed",  None,                             59),
            (1,  "asha_worker", "completed",  None,                             57),
            (2,  "asha_worker", "completed",  None,                             53),
            (3,  "asha_worker", "completed",  None,                             46),
            (5,  "asha_worker", "completed",  None,                             89),
            (6,  "asha_worker", "completed",  None,                             59),
            (8,  "asha_worker", "completed",  None,                             19),
            (9,  "asha_worker", "completed",  None,                             13),
            (11, "asha_worker", "completed",  None,                             49),
            (12, "asha_worker", "completed",  None,                             24),
            (14, "asha_worker", "incomplete", "Network timeout during upload",   14),
            (4,  "asha_worker", "failed",     "Server returned 500 error",       32),
            (7,  "anm",         "incomplete", "Partial data — audio missing",    29),
        ]

        for v_idx, wtype, status, error_msg, days_ago in sync_specs:
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
        print("  All workers share the same password: Admin@123")
        print("  IDs: MO000001-5 · AW000001-5 · AN000001-5 · AA000001-5 · SV000001-5")
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
