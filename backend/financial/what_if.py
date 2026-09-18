try:
    from backend.financial.calculations import calculate_financial_snapshot
except ImportError:
    try:
        from financial.calculations import calculate_financial_snapshot
    except ImportError:
        from calculations import calculate_financial_snapshot
def calculate_what_if(
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
    savings_contribution,
    income_delta=0,
    housing_delta=0,
    food_delta=0,
    transportation_delta=0,
    education_delta=0,
    healthcare_delta=0,
    entertainment_delta=0,
    subscriptions_delta=0,
    other_delta=0,
    debt_payment_delta=0,
    savings_contribution_delta=0
):
    current = calculate_financial_snapshot(
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

    projected_income = income + income_delta
    projected_housing = housing + housing_delta
    projected_food = food + food_delta
    projected_transportation = transportation + transportation_delta
    projected_education = education + education_delta
    projected_healthcare = healthcare + healthcare_delta
    projected_entertainment = entertainment + entertainment_delta
    projected_subscriptions = subscriptions + subscriptions_delta
    projected_other = other + other_delta
    projected_debt_payment = debt_payment + debt_payment_delta
    projected_savings = savings_contribution + savings_contribution_delta

    projected = calculate_financial_snapshot(
        income=projected_income,
        housing=projected_housing,
        food=projected_food,
        transportation=projected_transportation,
        education=projected_education,
        healthcare=projected_healthcare,
        entertainment=projected_entertainment,
        subscriptions=projected_subscriptions,
        other=projected_other,
        debt_payment=projected_debt_payment,
        savings_contribution=projected_savings
    )

    return {
        "current": current,
        "projected": projected,
        "changes": {
            "income_change": income_delta,
            "housing_change": housing_delta,
            "food_change": food_delta,
            "transportation_change": transportation_delta,
            "education_change": education_delta,
            "healthcare_change": healthcare_delta,
            "entertainment_change": entertainment_delta,
            "subscriptions_change": subscriptions_delta,
            "other_change": other_delta,
            "debt_payment_change": debt_payment_delta,
            "savings_contribution_change": savings_contribution_delta
        },
        "surplus_change": (
            projected["monthly_surplus"]
            - current["monthly_surplus"]
        )
    }