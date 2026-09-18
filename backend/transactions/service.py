from typing import List, Optional, Dict, Any
from datetime import datetime
from backend.database import get_db, init_db
from backend.transactions.models import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionSummary,
)


def list_transactions(
    category: Optional[str] = None,
    trans_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    init_db()
    query = "SELECT * FROM transactions WHERE 1=1"
    params: List[Any] = []

    if category:
        query += " AND LOWER(category) = LOWER(?)"
        params.append(category)

    if trans_type:
        query += " AND LOWER(type) = LOWER(?)"
        params.append(trans_type)

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    if search:
        query += " AND (LOWER(description) LIKE LOWER(?) OR LOWER(notes) LIKE LOWER(?))"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_transaction(trans_id: int) -> Optional[Dict[str, Any]]:
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (trans_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def create_transaction(data: TransactionCreate) -> Dict[str, Any]:
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO transactions (date, description, category, amount, type, payment_method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.date,
                data.description,
                data.category,
                data.amount,
                data.type,
                data.payment_method or "UPI",
                data.notes,
            ),
        )
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (new_id,))
        return dict(cursor.fetchone())


def update_transaction(trans_id: int, data: TransactionUpdate) -> Optional[Dict[str, Any]]:
    init_db()
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        return get_transaction(trans_id)

    set_clause = ", ".join(f"{k} = ?" for k in update_data.keys())
    params = list(update_data.values()) + [trans_id]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE transactions SET {set_clause} WHERE id = ?", params)
        if cursor.rowcount == 0:
            return None
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (trans_id,))
        return dict(cursor.fetchone())


def delete_transaction(trans_id: int) -> bool:
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (trans_id,))
        return cursor.rowcount > 0


def get_transaction_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> TransactionSummary:
    init_db()
    query = """
        SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
            COALESCE(SUM(CASE WHEN type = 'savings' THEN amount ELSE 0 END), 0) as total_savings,
            COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0) as total_debt,
            COUNT(*) as total_count
        FROM transactions
        WHERE 1=1
    """
    params = []
    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        if not row:
            return TransactionSummary()

        income = float(row["total_income"])
        expense = float(row["total_expense"])
        savings = float(row["total_savings"])
        debt = float(row["total_debt"])
        net = income - expense - debt

        return TransactionSummary(
            total_income=income,
            total_expense=expense,
            total_savings=savings,
            total_debt=debt,
            net_cash_flow=net,
            total_count=int(row["total_count"]),
        )


def clear_all_transactions() -> int:
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM transactions;")
        return cursor.rowcount


def seed_sample_transactions() -> int:
    """Seed realistic monthly transactions for demonstration (past 6 months)."""
    init_db()
    # If already has transactions, don't duplicate
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM transactions;")
        if cursor.fetchone()["count"] > 0:
            return 0

    # 6 months of demo transactions (April 2026 - September 2026)
    months = [
        ("2026-04", 60000, 11500, 5800, 2800, 3800, 1000, 1200, 1000, 1800, 5000, 10000),
        ("2026-05", 60000, 12000, 6200, 3100, 4000, 800,  1400, 1000, 2100, 5000, 10000),
        ("2026-06", 60000, 12000, 5900, 2900, 4000, 1100, 1100, 1000, 1900, 5000, 10000),
        ("2026-07", 65000, 12000, 6100, 3200, 4200, 900,  1300, 1000, 2200, 5000, 12000),
        ("2026-08", 65000, 12000, 6400, 3000, 4000, 1500, 1500, 1000, 2000, 5000, 12000),
        ("2026-09", 65000, 12000, 6000, 3000, 4000, 1000, 1000, 1000, 2000, 5000, 12000),
    ]

    sample_items = []
    for ym, inc, rent, food, trans, edu, health, ent, sub, oth, debt, sav in months:
        # Salary Income
        sample_items.append((f"{ym}-01", "Monthly Salary Credit - Tech Corp", "Salary", inc, "income", "Net Banking", "Direct company payroll credit"))
        # Rent
        sample_items.append((f"{ym}-02", "Apartment Rent Transfer", "Housing", rent, "expense", "UPI", "Monthly rent paid via UPI"))
        # Groceries & Food
        sample_items.append((f"{ym}-04", "Blinkit & Zepto Groceries", "Food", round(food * 0.45, 2), "expense", "UPI", "Weekly grocery replenishment"))
        sample_items.append((f"{ym}-15", "Supermarket Essentials", "Food", round(food * 0.35, 2), "expense", "Debit Card", "Mid-month household shopping"))
        sample_items.append((f"{ym}-22", "Swiggy & Dining Out", "Food", round(food * 0.20, 2), "expense", "UPI", "Weekend dinners and food delivery"))
        # Transportation
        sample_items.append((f"{ym}-06", "Metro Smart Card Recharge", "Transportation", round(trans * 0.40, 2), "expense", "UPI", "Monthly metro commute pass"))
        sample_items.append((f"{ym}-18", "Uber / Ola Cabs", "Transportation", round(trans * 0.60, 2), "expense", "UPI", "City travel & auto rides"))
        # Education
        sample_items.append((f"{ym}-09", "Online Courses & Certification", "Education", round(edu * 0.65, 2), "expense", "Credit Card", "Skill development courses"))
        sample_items.append((f"{ym}-20", "Books & Study Material", "Education", round(edu * 0.35, 2), "expense", "UPI", "Technical reading books"))
        # Healthcare
        sample_items.append((f"{ym}-11", "Apollo Pharmacy & Medicines", "Healthcare", health, "expense", "UPI", "Monthly vitamins and healthcare"))
        # Entertainment
        sample_items.append((f"{ym}-13", "PVR Cinemas & Events", "Entertainment", ent, "expense", "Credit Card", "Weekend movie & outing"))
        # Subscriptions
        sample_items.append((f"{ym}-10", "Netflix, Spotify & Prime", "Subscriptions", sub, "expense", "Credit Card", "Digital streaming subscriptions"))
        # Other Utilities
        sample_items.append((f"{ym}-08", "Electricity & Broadband Bill", "Other", oth, "expense", "Net Banking", "Apartment utility expenses"))
        # Debt EMI
        sample_items.append((f"{ym}-05", "Education Loan EMI - HDFC", "Debt", debt, "debt", "Net Banking", "Scheduled monthly loan EMI repayment"))
        # Savings / Investments SIP
        sample_items.append((f"{ym}-05", "SIP Mutual Fund - Nifty 50 Index", "Savings", sav, "savings", "Net Banking", "Automated monthly wealth creation SIP"))

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.executemany(
            """
            INSERT INTO transactions (date, description, category, amount, type, payment_method, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            sample_items,
        )
        return len(sample_items)
