try:
    from backend.finwise_agent.tools import (
        financial_snapshot,
        goal_progress,
        goal_plan,
        what_if_analysis,
    )
except ImportError:
    from finwise_agent.tools import (
        financial_snapshot,
        goal_progress,
        goal_plan,
        what_if_analysis,
    )


print("Financial Snapshot:")
print(
    financial_snapshot(
        income=60000,
        housing=12000,
        food=6000,
        transportation=3000,
        education=4000,
        healthcare=1000,
        entertainment=1000,
        subscriptions=1000,
        other=2000,
        debt_payment=5000,
        savings_contribution=10000,
    )
)

print("\nGoal Progress:")
print(
    goal_progress(
        target_amount=150000,
        amount_saved=50000,
    )
)

print("\nGoal Plan:")
print(
    goal_plan(
        target_amount=150000,
        amount_saved=50000,
        monthly_savings=10000,
        target_date="2027-03-01",
    )
)

print("\nWhat-If:")
print(
    what_if_analysis(
        income=60000,
        housing=12000,
        food=6000,
        transportation=3000,
        education=4000,
        healthcare=1000,
        entertainment=1000,
        subscriptions=1000,
        other=2000,
        debt_payment=5000,
        savings_contribution=10000,
        income_delta=11000,
    )
)