from what_if import calculate_what_if


result = calculate_what_if(
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
    income_delta=11000
)

print("Current:")
print(result["current"])

print("\nProjected:")
print(result["projected"])

print("\nChanges:")
print(result["changes"])

print("\nSurplus Change:")
print(result["surplus_change"])