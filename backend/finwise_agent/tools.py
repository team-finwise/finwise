from strands import tool

try:
    from backend.financial.calculations import (
        calculate_financial_snapshot,
        calculate_goal_progress,
        calculate_goal_plan
    )
    from backend.financial.what_if import calculate_what_if
except ImportError:
    try:
        from financial.calculations import (
            calculate_financial_snapshot,
            calculate_goal_progress,
            calculate_goal_plan
        )
        from financial.what_if import calculate_what_if
    except ImportError:
        from calculations import (
            calculate_financial_snapshot,
            calculate_goal_progress,
            calculate_goal_plan
        )
        from what_if import calculate_what_if


@tool
def financial_snapshot(
    income: float,
    housing: float,
    food: float,
    transportation: float,
    education: float,
    healthcare: float,
    entertainment: float,
    subscriptions: float,
    other: float,
    debt_payment: float,
    savings_contribution: float
) -> dict:
    """Calculate verified monthly financial metrics."""
    return calculate_financial_snapshot(
        income=income,
        housing=housing,
        food=food,
        transportation=transportation,
        education=education,
        healthcare=healthcare,
        entertainment=entertainment,
        subscriptions=subscriptions,
        other=other,
        debt_payment=debt_payment,
        savings_contribution=savings_contribution
    )


@tool
def goal_progress(
    target_amount: float,
    amount_saved: float
) -> dict:
    """Calculate goal progress and remaining amount."""
    return calculate_goal_progress(
        target_amount=target_amount,
        amount_saved=amount_saved
    )


@tool
def goal_plan(
    target_amount: float,
    amount_saved: float,
    monthly_savings: float,
    target_date: str
) -> dict:
    """Calculate the monthly saving required to reach a financial goal."""
    return calculate_goal_plan(
        target_amount=target_amount,
        amount_saved=amount_saved,
        monthly_savings=monthly_savings,
        target_date=target_date
    )


@tool
def what_if_analysis(
    income: float,
    housing: float,
    food: float,
    transportation: float,
    education: float,
    healthcare: float,
    entertainment: float,
    subscriptions: float,
    other: float,
    debt_payment: float,
    savings_contribution: float,
    income_delta: float = 0,
    housing_delta: float = 0,
    food_delta: float = 0,
    transportation_delta: float = 0,
    education_delta: float = 0,
    healthcare_delta: float = 0,
    entertainment_delta: float = 0,
    subscriptions_delta: float = 0,
    other_delta: float = 0,
    debt_payment_delta: float = 0,
    savings_contribution_delta: float = 0
) -> dict:
    """Calculate the financial impact of a What-If scenario."""
    return calculate_what_if(
        income=income,
        housing=housing,
        food=food,
        transportation=transportation,
        education=education,
        healthcare=healthcare,
        entertainment=entertainment,
        subscriptions=subscriptions,
        other=other,
        debt_payment=debt_payment,
        savings_contribution=savings_contribution,
        income_delta=income_delta,
        housing_delta=housing_delta,
        food_delta=food_delta,
        transportation_delta=transportation_delta,
        education_delta=education_delta,
        healthcare_delta=healthcare_delta,
        entertainment_delta=entertainment_delta,
        subscriptions_delta=subscriptions_delta,
        other_delta=other_delta,
        debt_payment_delta=debt_payment_delta,
        savings_contribution_delta=savings_contribution_delta
    )