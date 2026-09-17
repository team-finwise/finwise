from datetime import date


def calculate_financial_snapshot(
    income,
    housing,
    food,
    transportation,
    education,
    healthcare,
    entertainment,
    subscriptions,
    other,
    debt_payment,
    savings_contribution
):
    total_expenses = (
        housing
        + food
        + transportation
        + education
        + healthcare
        + entertainment
        + subscriptions
        + other
        + debt_payment
    )

    monthly_surplus = income - total_expenses

    savings_rate = (
        (savings_contribution / income) * 100
        if income > 0 else None
    )

    debt_to_income = (
        (debt_payment / income) * 100
        if income > 0 else None
    )

    return {
        "total_monthly_expenses": total_expenses,
        "monthly_surplus": monthly_surplus,
        "cash_flow_status": (
            "surplus" if monthly_surplus >= 0 else "deficit"
        ),
        "savings_rate": savings_rate,
        "debt_to_income_ratio": debt_to_income
    }


def calculate_goal_progress(target_amount, amount_saved):
    if target_amount <= 0:
        return {
            "remaining_amount": 0,
            "progress_percentage": 100
        }

    remaining_amount = max(target_amount - amount_saved, 0)
    progress_percentage = min(
        (amount_saved / target_amount) * 100,
        100
    )

    return {
        "remaining_amount": remaining_amount,
        "progress_percentage": progress_percentage
    }


def calculate_goal_plan(
    target_amount,
    amount_saved,
    monthly_savings,
    target_date
):
    remaining_amount = max(target_amount - amount_saved, 0)

    if remaining_amount == 0:
        return {
            "remaining_amount": 0,
            "required_monthly_saving": 0,
            "current_saving_sufficient": True
        }

    if monthly_savings <= 0:
        return {
            "remaining_amount": remaining_amount,
            "required_monthly_saving": None,
            "current_saving_sufficient": False
        }

    today = date.today()

    if isinstance(target_date, str):
        target_date = date.fromisoformat(target_date)

    months = (
        (target_date.year - today.year) * 12
        + target_date.month - today.month
    )

    if target_date.day >= today.day:
        months += 1

    if months <= 0:
        return {
            "remaining_amount": remaining_amount,
            "required_monthly_saving": None,
            "current_saving_sufficient": False
        }

    required_monthly_saving = remaining_amount / months

    return {
        "remaining_amount": remaining_amount,
        "required_monthly_saving": required_monthly_saving,
        "current_saving_sufficient": (
            monthly_savings >= required_monthly_saving
        )
    }