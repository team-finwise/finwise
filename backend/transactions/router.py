from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.transactions.models import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionSummary,
)
from backend.transactions import service

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

PRESET_CATEGORIES = [
    {"name": "Housing", "type": "expense", "icon": "home"},
    {"name": "Food", "type": "expense", "icon": "utensils"},
    {"name": "Transportation", "type": "expense", "icon": "car"},
    {"name": "Education", "type": "expense", "icon": "book"},
    {"name": "Healthcare", "type": "expense", "icon": "heart"},
    {"name": "Entertainment", "type": "expense", "icon": "film"},
    {"name": "Subscriptions", "type": "expense", "icon": "tv"},
    {"name": "Other", "type": "expense", "icon": "tag"},
    {"name": "Debt", "type": "debt", "icon": "credit-card"},
    {"name": "Savings", "type": "savings", "icon": "piggy-bank"},
    {"name": "Salary", "type": "income", "icon": "briefcase"},
    {"name": "Freelance", "type": "income", "icon": "laptop"},
    {"name": "Investments", "type": "income", "icon": "trending-up"},
]


@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    category: Optional[str] = Query(None, description="Filter by category"),
    type: Optional[str] = Query(None, description="Filter by type (expense, income, savings, debt)"),
    start_date: Optional[str] = Query(None, description="Filter start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Filter end date YYYY-MM-DD"),
    search: Optional[str] = Query(None, description="Search description and notes"),
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    return service.list_transactions(
        category=category,
        trans_type=type,
        start_date=start_date,
        end_date=end_date,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get("/summary", response_model=TransactionSummary)
def get_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    return service.get_transaction_summary(start_date=start_date, end_date=end_date)


@router.get("/categories")
def get_categories():
    return PRESET_CATEGORIES


@router.get("/{trans_id}", response_model=TransactionResponse)
def get_transaction(trans_id: int):
    tx = service.get_transaction(trans_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.post("", response_model=TransactionResponse, status_code=201)
def create_transaction(data: TransactionCreate):
    return service.create_transaction(data)


@router.put("/{trans_id}", response_model=TransactionResponse)
def update_transaction(trans_id: int, data: TransactionUpdate):
    tx = service.update_transaction(trans_id, data)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.delete("/{trans_id}")
def delete_transaction(trans_id: int):
    success = service.delete_transaction(trans_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"success": True, "message": f"Transaction {trans_id} deleted"}


@router.post("/seed")
def seed_transactions():
    count = service.seed_sample_transactions()
    return {"success": True, "seeded": count, "message": f"Seeded {count} transactions"}


@router.post("/reset")
def reset_transactions():
    deleted = service.clear_all_transactions()
    return {"success": True, "deleted": deleted, "message": "All transactions reset"}


from pydantic import BaseModel
from backend.transactions.bank_parser import (
    parse_csv_statement,
    parse_sms_statement,
    get_bank_passbook_preset,
)


class StatementImportRequest(BaseModel):
    csv_text: str


class SmsParseRequest(BaseModel):
    sms_text: str


class BankPresetRequest(BaseModel):
    bank: str = "hdfc"


@router.post("/import-statement")
def import_statement(req: StatementImportRequest):
    if not req.csv_text.strip():
        raise HTTPException(status_code=400, detail="CSV statement text cannot be empty.")

    parsed = parse_csv_statement(req.csv_text)
    if not parsed:
        raise HTTPException(status_code=400, detail="Could not parse any transactions from the provided CSV. Please verify column headers.")

    saved = []
    for item in parsed:
        created = service.create_transaction(TransactionCreate(**item))
        saved.append(created)

    return {
        "success": True,
        "imported_count": len(saved),
        "transactions": saved,
        "message": f"Successfully imported {len(saved)} bank transactions",
    }


@router.post("/parse-sms")
def parse_sms(req: SmsParseRequest):
    if not req.sms_text.strip():
        raise HTTPException(status_code=400, detail="SMS text cannot be empty.")

    parsed = parse_sms_statement(req.sms_text)
    if not parsed:
        raise HTTPException(status_code=400, detail="Could not extract any valid bank transaction alerts from the text.")

    saved = []
    for item in parsed:
        created = service.create_transaction(TransactionCreate(**item))
        saved.append(created)

    return {
        "success": True,
        "imported_count": len(saved),
        "transactions": saved,
        "message": f"Successfully parsed and imported {len(saved)} transactions from bank alerts",
    }


@router.post("/seed-bank")
def seed_bank(req: BankPresetRequest):
    bank_txs = get_bank_passbook_preset(req.bank)
    saved = []
    for item in bank_txs:
        created = service.create_transaction(TransactionCreate(**item))
        saved.append(created)

    return {
        "success": True,
        "imported_count": len(saved),
        "transactions": saved,
        "message": f"Successfully loaded {len(saved)} transactions from {req.bank.upper()} bank passbook statement",
    }
