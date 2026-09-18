from calculations import (
    calculate_financial_snapshot,
    calculate_goal_progress,
    calculate_goal_plan
)


snapshot = calculate_financial_snapshot(
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
    savings_contribution=10000
)

goal_progress = calculate_goal_progress(
    target_amount=150000,
    amount_saved=50000
)

goal_plan = calculate_goal_plan(
    target_amount=150000,
    amount_saved=50000,
    monthly_savings=10000,
    target_date="2027-03-01"
)

print("Financial Snapshot:")
print(snapshot)

print("\nGoal Progress:")
print(goal_progress)

print("\nGoal Plan:")
print(goal_plan)