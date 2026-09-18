from fastapi import APIRouter, Query, Response
from backend.reports import service

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/historical")
def get_historical_report(months: int = Query(12, ge=1, le=36)):
    return service.get_historical_report(months_limit=months)


@router.get("/monthly/{year_month}")
def get_monthly_statement(year_month: str):
    return service.get_monthly_statement(year_month=year_month)


@router.get("/export")
def export_historical_csv():
    report = service.get_historical_report(months_limit=36)
    trends = report.get("monthly_trends", [])

    lines = ["Month,Label,Income,Expenses,Debt,Savings,Total Outflow,Surplus,Savings Rate %,Surplus Rate %,Status"]
    for t in trends:
        lines.append(
            f"{t['month']},{t['label']},{t['income']},{t['expenses']},{t['debt']},{t['savings']},"
            f"{t['total_outflow']},{t['surplus']},{t['savings_rate']}%,{t['surplus_rate']}%,{t['status']}"
        )

    csv_content = "\n".join(lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="finwise_historical_report.csv"'},
    )
