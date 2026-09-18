from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.database import get_db, init_db


def get_historical_report(months_limit: int = 12) -> Dict[str, Any]:
    """
    Generate comprehensive multi-month financial analytics and trend reports.
    """
    init_db()

    with get_db() as conn:
        cursor = conn.cursor()

        # Group by year-month
        cursor.execute("""
            SELECT
                SUBSTR(date, 1, 7) as month,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
                COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE 0 END), 0) as debt,
                COALESCE(SUM(CASE WHEN type = 'savings' THEN amount ELSE 0 END), 0) as savings,
                COUNT(*) as transaction_count
            FROM transactions
            GROUP BY SUBSTR(date, 1, 7)
            ORDER BY month ASC
            LIMIT ?
        """, (months_limit,))

        monthly_rows = cursor.fetchall()

    if not monthly_rows:
        return {
            "has_data": False,
            "message": "No historical transactions found. Please add transactions or load sample data.",
            "monthly_trends": [],
            "summary": {
                "avg_income": 0,
                "avg_expenses": 0,
                "avg_surplus": 0,
                "avg_savings_rate": 0,
                "total_savings_accumulated": 0,
                "financial_health_score": 0,
                "health_rating": "No Data",
            },
            "category_trends": {},
            "insights": [],
        }

    monthly_trends = []
    total_income_sum = 0
    total_expense_sum = 0
    total_debt_sum = 0
    total_savings_sum = 0

    for i, row in enumerate(monthly_rows):
        m = row["month"]
        inc = float(row["income"])
        exp = float(row["expenses"])
        dbt = float(row["debt"])
        sav = float(row["savings"])
        outflow = exp + dbt
        surplus = inc - outflow

        sav_rate = (sav / inc * 100) if inc > 0 else 0.0
        surplus_rate = (surplus / inc * 100) if inc > 0 else 0.0
        dti_rate = (dbt / inc * 100) if inc > 0 else 0.0

        # Month-over-month expense growth
        mom_expense_growth = 0.0
        if i > 0:
            prev_exp = float(monthly_rows[i - 1]["expenses"])
            if prev_exp > 0:
                mom_expense_growth = round(((exp - prev_exp) / prev_exp) * 100, 1)

        total_income_sum += inc
        total_expense_sum += exp
        total_debt_sum += dbt
        total_savings_sum += sav

        # Format month label (e.g. "Apr 2026")
        try:
            dt = datetime.strptime(m, "%Y-%m")
            label = dt.strftime("%b %Y")
        except Exception:
            label = m

        monthly_trends.append({
            "month": m,
            "label": label,
            "income": round(inc, 2),
            "expenses": round(exp, 2),
            "debt": round(dbt, 2),
            "savings": round(sav, 2),
            "total_outflow": round(outflow, 2),
            "surplus": round(surplus, 2),
            "savings_rate": round(sav_rate, 1),
            "surplus_rate": round(surplus_rate, 1),
            "dti_ratio": round(dti_rate, 1),
            "mom_expense_growth": mom_expense_growth,
            "status": "surplus" if surplus >= 0 else "deficit",
            "transaction_count": int(row["transaction_count"]),
        })

    month_count = len(monthly_trends)
    avg_income = round(total_income_sum / month_count, 2)
    avg_expenses = round(total_expense_sum / month_count, 2)
    avg_debt = round(total_debt_sum / month_count, 2)
    avg_savings = round(total_savings_sum / month_count, 2)
    avg_surplus = round((total_income_sum - (total_expense_sum + total_debt_sum)) / month_count, 2)
    avg_sav_rate = round((avg_savings / avg_income * 100), 1) if avg_income > 0 else 0.0

    # Category breakdown by month
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT
                SUBSTR(date, 1, 7) as month,
                category,
                SUM(amount) as total_amount
            FROM transactions
            WHERE type = 'expense'
            GROUP BY SUBSTR(date, 1, 7), category
            ORDER BY month ASC, total_amount DESC
        """)
        cat_rows = cursor.fetchall()

    category_trends: Dict[str, Dict[str, float]] = {}
    category_totals: Dict[str, float] = {}

    for cr in cat_rows:
        m = cr["month"]
        cat = cr["category"]
        amt = float(cr["total_amount"])
        if cat not in category_trends:
            category_trends[cat] = {}
        category_trends[cat][m] = round(amt, 2)
        category_totals[cat] = category_totals.get(cat, 0.0) + amt

    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)

    # Compute Financial Health Score (0-100)
    # Savings Rate score: target 20% -> up to 35 pts
    sav_score = min(35, (avg_sav_rate / 20.0) * 35) if avg_sav_rate > 0 else 0

    # DTI score: target < 35% -> up to 30 pts
    avg_dti = (avg_debt / avg_income * 100) if avg_income > 0 else 0
    if avg_dti <= 20:
        dti_score = 30
    elif avg_dti <= 35:
        dti_score = 25 - ((avg_dti - 20) / 15) * 10
    else:
        dti_score = max(5, 15 - ((avg_dti - 35) / 20) * 10)

    # Cash flow consistency: up to 25 pts (proportion of surplus months)
    surplus_months = sum(1 for mt in monthly_trends if mt["status"] == "surplus")
    cf_score = (surplus_months / month_count) * 25

    # Total score
    health_score = int(round(sav_score + dti_score + cf_score + 10))  # 10 base control pts
    health_score = max(10, min(100, health_score))

    if health_score >= 85:
        health_rating = "Excellent"
    elif health_score >= 70:
        health_rating = "Good"
    elif health_score >= 50:
        health_rating = "Fair"
    else:
        health_rating = "Needs Attention"

    # Automated Deterministic Financial Insights
    insights = []
    if avg_sav_rate >= 20:
        insights.append(f"Strong savings habit: You are saving an average of {avg_sav_rate}% of your monthly income, exceeding the recommended 20% benchmark.")
    elif avg_sav_rate >= 10:
        insights.append(f"Moderate savings rate: Averaging {avg_sav_rate}%. Aiming for 20% would accelerate your financial goals.")
    else:
        insights.append(f"Low savings buffer: Your savings rate averages {avg_sav_rate}%. Look for opportunities to curb discretionary spending.")

    if surplus_months == month_count:
        insights.append("100% positive cash flow: You operated with a net cash surplus in every recorded month.")
    elif surplus_months < month_count:
        insights.append(f"Cash flow warning: {month_count - surplus_months} out of {month_count} months finished with an expense deficit.")

    if sorted_categories:
        top_cat, top_amt = sorted_categories[0]
        insights.append(f"Largest expenditure category: {top_cat} totals ₹{top_amt:,.0f} across the analyzed period ({round(top_amt / total_expense_sum * 100, 1) if total_expense_sum > 0 else 0}% of all living expenses).")

    if len(monthly_trends) >= 2:
        latest = monthly_trends[-1]
        prev = monthly_trends[-2]
        if latest["mom_expense_growth"] > 5:
            insights.append(f"Recent spending uptick: Living expenses grew by {latest['mom_expense_growth']}% in {latest['label']} compared to {prev['label']}.")
        elif latest["mom_expense_growth"] < -5:
            insights.append(f"Budget discipline: Living expenses reduced by {abs(latest['mom_expense_growth'])}% in {latest['label']} vs. {prev['label']}.")

    return {
        "has_data": True,
        "period": f"{monthly_trends[0]['label']} — {monthly_trends[-1]['label']}",
        "months_analyzed": month_count,
        "monthly_trends": monthly_trends,
        "summary": {
            "avg_income": avg_income,
            "avg_expenses": avg_expenses,
            "avg_debt": avg_debt,
            "avg_savings": avg_savings,
            "avg_surplus": avg_surplus,
            "avg_savings_rate": avg_sav_rate,
            "total_income_accumulated": round(total_income_sum, 2),
            "total_expenses_accumulated": round(total_expense_sum, 2),
            "total_savings_accumulated": round(total_savings_sum, 2),
            "financial_health_score": health_score,
            "health_rating": health_rating,
        },
        "category_trends": category_trends,
        "top_categories": [
            {"category": k, "total": round(v, 2), "percentage": round(v / total_expense_sum * 100, 1) if total_expense_sum > 0 else 0}
            for k, v in sorted_categories[:5]
        ],
        "insights": insights,
    }


def get_monthly_statement(year_month: str) -> Dict[str, Any]:
    """Generate detailed breakdown for a specific month (YYYY-MM)."""
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM transactions
            WHERE SUBSTR(date, 1, 7) = ?
            ORDER BY date ASC, id ASC
        """, (year_month,))
        rows = [dict(r) for r in cursor.fetchall()]

    inflow = sum(r["amount"] for r in rows if r["type"] == "income")
    expenses = sum(r["amount"] for r in rows if r["type"] == "expense")
    debt = sum(r["amount"] for r in rows if r["type"] == "debt")
    savings = sum(r["amount"] for r in rows if r["type"] == "savings")
    surplus = inflow - (expenses + debt)

    return {
        "month": year_month,
        "inflow": inflow,
        "expenses": expenses,
        "debt": debt,
        "savings": savings,
        "net_surplus": surplus,
        "transactions": rows,
        "count": len(rows),
    }
