"""
Chat service — Claude agent loop with tool use via Bedrock converse() API
"""

import json
import logging
from typing import Any, Dict, List
from datetime import datetime, timedelta, UTC

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.worker import Worker
from app.models.beneficiary import Beneficiary
from app.models.visit import Visit
from app.models.sync_log import SyncLog
from app.schemas.chat import ConversationMessage
from app.services.bedrock_service import bedrock_service

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an AI assistant for Voice of Care, a healthcare field data management system used in India.
You help medical officers and healthcare supervisors query and understand field data collected by ASHA (Accredited Social Health Activist) workers.

Data model:
- Workers: ASHA workers, medical officers, ANMs, AAWs — each has a worker_type, worker_id, name, collection_center
- Beneficiaries: Individuals receiving care — types include individual, child, mother_child; each may be assigned an ASHA worker
- Visits: Healthcare visits of type hbnc (Home-Based Newborn Care), anc (Antenatal Care), pnc (Postnatal Care) — each has visit_data JSON with answers, is_synced flag, visit_date_time
- SyncLog: Records of data synchronization events with status: completed, incomplete, failed

Always use the available tools to look up real data before answering questions. Be concise and factual.
If asked about counts, totals, or summaries, use get_dashboard_stats first. For specific queries, use the appropriate tool.
When a user refers to a worker or beneficiary by name, use search_workers or get_beneficiaries with the name parameter first to find their ID.
Format numbers clearly and explain what the data means in the healthcare context."""

TOOLS = [
    {
        "name": "get_dashboard_stats",
        "description": "Get overall counts: total workers, beneficiaries, visits, and synced/unsynced visits.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_visits_summary",
        "description": "List visits with optional filters. Returns visit counts and summaries. Results are ordered by visit date (most recent first).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "visit_type": {
                    "type": "string",
                    "description": "Filter by visit type: hbnc, anc, or pnc",
                    "enum": ["hbnc", "anc", "pnc"]
                },
                "worker_id": {
                    "type": "string",
                    "description": "Filter by worker ID (e.g., AW000001, MO000001). If you only have a worker name, use search_workers first to find their ID."
                },
                "days_back": {
                    "type": "integer",
                    "description": "Only include visits from the last N days (e.g. 7 for this week)"
                },
                "is_synced": {
                    "type": "boolean",
                    "description": "Filter by sync status"
                },
                "limit": {
                    "type": "integer",
                    "description": "Max number of recent visits to return in the list (default 10, max 50)"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_beneficiaries",
        "description": "List beneficiaries with optional filters by name or type.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Partial name search (first or last name)"
                },
                "beneficiary_type": {
                    "type": "string",
                    "description": "Filter by type: individual, child, mother_child"
                },
                "assigned_asha_id": {
                    "type": "string",
                    "description": "Filter by assigned ASHA worker ID (e.g., AW000001). If you only have a worker name, use search_workers first to find their ID."
                },
                "limit": {
                    "type": "integer",
                    "description": "Max results to return (default 20)"
                }
            },
            "required": []
        }
    },
    {
        "name": "search_workers",
        "description": "Search for workers by name or list workers with their visit counts. Use this when a user refers to a worker by name to find their worker_id.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "Partial name search (first or last name)"
                },
                "worker_type": {
                    "type": "string",
                    "description": "Filter by worker type: asha_worker, medical_officer, anm, aaw"
                },
                "limit": {
                    "type": "integer",
                    "description": "Max results to return (default 20)"
                }
            },
            "required": []
        }
    },
    {
        "name": "get_visit_details",
        "description": "Get full details of a specific visit including the visit_data JSON answers.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "visit_id": {
                    "type": "integer",
                    "description": "The visit database ID"
                }
            },
            "required": ["visit_id"]
        }
    },
    {
        "name": "get_sync_status",
        "description": "Get recent sync log entries, optionally filtered by status or date.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "description": "Filter by status: completed, incomplete, failed"
                },
                "days_back": {
                    "type": "integer",
                    "description": "Only include logs from the last N days"
                },
                "limit": {
                    "type": "integer",
                    "description": "Max results to return (default 20)"
                }
            },
            "required": []
        }
    }
]


def _execute_tool(tool_name: str, tool_input: Dict[str, Any], db: Session) -> str:
    try:
        if tool_name == "get_dashboard_stats":
            return _get_dashboard_stats(db)
        elif tool_name == "get_visits_summary":
            return _get_visits_summary(db, **tool_input)
        elif tool_name == "get_beneficiaries":
            return _get_beneficiaries(db, **tool_input)
        elif tool_name == "search_workers":
            return _search_workers(db, **tool_input)
        elif tool_name == "get_visit_details":
            return _get_visit_details(db, **tool_input)
        elif tool_name == "get_sync_status":
            return _get_sync_status(db, **tool_input)
        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})
    except Exception as e:
        logger.error(f"Tool {tool_name} failed: {e}")
        # Rollback the session to recover from failed transaction
        db.rollback()
        return json.dumps({"error": str(e)})


def _get_dashboard_stats(db: Session) -> str:
    total_workers = db.query(func.count(Worker.id)).scalar()
    total_beneficiaries = db.query(func.count(Beneficiary.id)).scalar()
    total_visits = db.query(func.count(Visit.id)).scalar()
    synced_visits = db.query(func.count(Visit.id)).filter(Visit.is_synced == True).scalar()
    unsynced_visits = db.query(func.count(Visit.id)).filter(Visit.is_synced == False).scalar()

    return json.dumps({
        "total_workers": total_workers,
        "total_beneficiaries": total_beneficiaries,
        "total_visits": total_visits,
        "synced_visits": synced_visits,
        "unsynced_visits": unsynced_visits
    })


def _get_visits_summary(
    db: Session,
    visit_type: str = None,
    worker_id: str = None,
    days_back: int = None,
    is_synced: bool = None,
    limit: int = 10
) -> str:
    q = db.query(Visit)

    if visit_type:
        q = q.filter(Visit.visit_type == visit_type)
    if worker_id:
        # Look up worker by worker_id string (e.g., "AW000001")
        worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
        if worker:
            q = q.filter(Visit.assigned_asha_id == worker.id)
        else:
            # If worker not found, return empty result
            return json.dumps({
                "total_matching": 0,
                "type_breakdown": {},
                "recent_visits": [],
                "error": f"Worker with ID {worker_id} not found"
            })
    if days_back:
        cutoff = datetime.now(UTC) - timedelta(days=days_back)
        q = q.filter(Visit.visit_date_time >= cutoff)
    if is_synced is not None:
        q = q.filter(Visit.is_synced == is_synced)

    total = q.count()

    # Get breakdown by visit type using the same filtered query
    type_counts = (
        q.with_entities(Visit.visit_type, func.count(Visit.id))
        .group_by(Visit.visit_type)
        .all()
    )

    recent = q.order_by(Visit.visit_date_time.desc()).limit(min(limit, 50)).all()
    recent_list = []
    for v in recent:
        worker = db.query(Worker).filter(Worker.id == v.assigned_asha_id).first()
        beneficiary = db.query(Beneficiary).filter(Beneficiary.id == v.beneficiary_id).first()
        recent_list.append({
            "id": v.id,
            "visit_type": v.visit_type,
            "visit_date": v.visit_date_time.isoformat() if v.visit_date_time else None,
            "day_number": v.day_number,
            "is_synced": v.is_synced,
            "worker": f"{worker.first_name} {worker.last_name}" if worker else None,
            "beneficiary": f"{beneficiary.first_name} {beneficiary.last_name}" if beneficiary else None,
        })

    return json.dumps({
        "total_matching": total,
        "type_breakdown": {t: c for t, c in type_counts},
        "recent_visits": recent_list
    })


def _get_beneficiaries(
    db: Session,
    name: str = None,
    beneficiary_type: str = None,
    assigned_asha_id: str = None,
    limit: int = 20
) -> str:
    q = db.query(Beneficiary)

    if name:
        name_parts = name.strip().split()
        if len(name_parts) >= 2:
            # Full name provided - try multiple strategies for better recall
            first_part = name_parts[0]
            last_part = name_parts[-1]
            q = q.filter(
                # Strategy 1: Both parts match (most precise)
                (Beneficiary.first_name.ilike(f"%{first_part}%") & Beneficiary.last_name.ilike(f"%{last_part}%")) |
                # Strategy 2: Reversed order
                (Beneficiary.first_name.ilike(f"%{last_part}%") & Beneficiary.last_name.ilike(f"%{first_part}%")) |
                # Strategy 3: Either part matches either field (more forgiving)
                Beneficiary.first_name.ilike(f"%{first_part}%") |
                Beneficiary.last_name.ilike(f"%{last_part}%") |
                Beneficiary.first_name.ilike(f"%{first_part}%") |
                Beneficiary.last_name.ilike(f"%{first_part}%")
            )
        else:
            # Single name - search in either field
            q = q.filter(
                (Beneficiary.first_name.ilike(f"%{name}%")) |
                (Beneficiary.last_name.ilike(f"%{name}%"))
            )
    if beneficiary_type:
        q = q.filter(Beneficiary.beneficiary_type == beneficiary_type)
    if assigned_asha_id:
        # Look up worker by worker_id string (e.g., "AW000001")
        worker = db.query(Worker).filter(Worker.worker_id == assigned_asha_id).first()
        if worker:
            q = q.filter(Beneficiary.assigned_asha_id == worker.id)
        else:
            # If worker not found, return empty result
            return json.dumps({
                "total_matching": 0,
                "beneficiaries": [],
                "error": f"Worker with ID {assigned_asha_id} not found"
            })

    total = q.count()
    results = q.limit(min(limit, 50)).all()

    return json.dumps({
        "total_matching": total,
        "beneficiaries": [
            {
                "id": b.id,
                "name": f"{b.first_name} {b.last_name}",
                "type": b.beneficiary_type,
                "mcts_id": b.mcts_id,
                "age": b.age,
                "assigned_asha_id": b.assigned_asha_id,
            }
            for b in results
        ]
    })


def _search_workers(db: Session, name: str = None, worker_type: str = None, limit: int = 20) -> str:
    q = db.query(Worker)
    
    if name:
        name_parts = name.strip().split()
        if len(name_parts) >= 2:
            # Full name provided - try multiple strategies for better recall
            first_part = name_parts[0]
            last_part = name_parts[-1]
            q = q.filter(
                # Strategy 1: Both parts match (most precise)
                (Worker.first_name.ilike(f"%{first_part}%") & Worker.last_name.ilike(f"%{last_part}%")) |
                # Strategy 2: Reversed order
                (Worker.first_name.ilike(f"%{last_part}%") & Worker.last_name.ilike(f"%{first_part}%")) |
                # Strategy 3: Either part matches either field (more forgiving)
                Worker.first_name.ilike(f"%{first_part}%") |
                Worker.last_name.ilike(f"%{last_part}%") |
                Worker.first_name.ilike(f"%{last_part}%") |
                Worker.last_name.ilike(f"%{first_part}%")
            )
        else:
            # Single name - search in either field
            q = q.filter(
                (Worker.first_name.ilike(f"%{name}%")) |
                (Worker.last_name.ilike(f"%{name}%"))
            )
    if worker_type:
        q = q.filter(Worker.worker_type == worker_type)

    total = q.count()
    workers = q.limit(min(limit, 50)).all()

    result = []
    for w in workers:
        visit_count = db.query(func.count(Visit.id)).filter(
            Visit.assigned_asha_id == w.id
        ).scalar()
        result.append({
            "id": w.id,
            "name": f"{w.first_name} {w.last_name}",
            "worker_id": w.worker_id,
            "worker_type": w.worker_type,
            "visit_count": visit_count,
        })

    result.sort(key=lambda x: x["visit_count"], reverse=True)

    return json.dumps({
        "total_matching": total,
        "workers": result
    })


def _get_visit_details(db: Session, visit_id: int) -> str:
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    if not visit:
        return json.dumps({"error": f"Visit {visit_id} not found"})

    worker = db.query(Worker).filter(Worker.id == visit.assigned_asha_id).first()
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == visit.beneficiary_id).first()

    return json.dumps({
        "id": visit.id,
        "visit_type": visit.visit_type,
        "visit_date": visit.visit_date_time.isoformat() if visit.visit_date_time else None,
        "day_number": visit.day_number,
        "is_synced": visit.is_synced,
        "synced_at": visit.synced_at.isoformat() if visit.synced_at else None,
        "worker": f"{worker.first_name} {worker.last_name}" if worker else None,
        "beneficiary": f"{beneficiary.first_name} {beneficiary.last_name}" if beneficiary else None,
        "visit_data": visit.visit_data,
    })


def _get_sync_status(
    db: Session,
    status: str = None,
    days_back: int = None,
    limit: int = 20
) -> str:
    q = db.query(SyncLog)

    if status:
        q = q.filter(SyncLog.status == status)
    if days_back:
        cutoff = datetime.now(UTC) - timedelta(days=days_back)
        q = q.filter(SyncLog.date_time >= cutoff)

    total = q.count()
    logs = q.order_by(SyncLog.date_time.desc()).limit(min(limit, 50)).all()

    status_counts = db.query(SyncLog.status, func.count(SyncLog.id)).group_by(
        SyncLog.status
    ).all()

    return json.dumps({
        "total_matching": total,
        "status_breakdown": {s: c for s, c in status_counts},
        "recent_logs": [
            {
                "id": log.id,
                "status": log.status,
                "worker_id": log.worker_id,
                "visit_id": log.visit_id,
                "date_time": log.date_time.isoformat() if log.date_time else None,
                "error_message": log.error_message,
            }
            for log in logs
        ]
    })


def process_message(
    message: str,
    conversation_history: List[ConversationMessage],
    db: Session
) -> tuple[str, List[ConversationMessage]]:
    """
    Run the Claude agent loop with tool use.
    Returns (assistant_response, updated_conversation_history).
    """
    # Build messages list for Bedrock converse API
    messages = []
    for msg in conversation_history:
        messages.append({"role": msg.role, "content": [{"text": msg.content}]})

    # Append current user message
    messages.append({"role": "user", "content": [{"text": message}]})

    max_iterations = 5
    for iteration in range(max_iterations):
        response = bedrock_service.invoke_claude_converse(
            messages=messages,
            system_prompt=SYSTEM_PROMPT,
            tools=TOOLS,
        )

        stop_reason = response["stopReason"]
        response_message = response["output"]["message"]
        messages.append(response_message)

        if stop_reason == "end_turn":
            # Extract text from content blocks
            text = ""
            for block in response_message.get("content", []):
                if "text" in block:
                    text += block["text"]
            break

        elif stop_reason == "tool_use":
            # Execute all requested tools and collect results.
            # Bedrock converse() uses {"toolUse": {...}} blocks (not {"type": "tool_use"}).
            tool_results = []
            for block in response_message.get("content", []):
                if "toolUse" in block:
                    tool_use = block["toolUse"]
                    tool_name = tool_use["name"]
                    tool_input = tool_use.get("input", {})
                    tool_use_id = tool_use["toolUseId"]

                    logger.info(f"Executing tool: {tool_name} with input: {tool_input}")
                    result_content = _execute_tool(tool_name, tool_input, db)

                    # Converse API tool result format
                    tool_results.append({
                        "toolResult": {
                            "toolUseId": tool_use_id,
                            "content": [{"text": result_content}],
                        }
                    })

            # Append tool results as user message
            messages.append({"role": "user", "content": tool_results})

        else:
            # Unexpected stop reason
            text = "I encountered an unexpected issue. Please try again."
            break
    else:
        text = "I reached the maximum number of reasoning steps. Please ask a more specific question."

    # Build updated conversation history
    updated_history = list(conversation_history) + [
        ConversationMessage(role="user", content=message),
        ConversationMessage(role="assistant", content=text),
    ]

    return text, updated_history
