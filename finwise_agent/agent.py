import os
from dotenv import load_dotenv
from strands import Agent
from strands.models.ollama import OllamaModel

from finwise_agent.tools import (
    financial_snapshot,
    goal_progress,
    goal_plan,
    what_if_analysis,
)

# Load environment variables from .env file if present
load_dotenv()


def create_agent():
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    model_id = os.environ.get("OLLAMA_MODEL", "llama3.1")

    free_model = OllamaModel(
        host=host,
        model_id=model_id,
    )

    return Agent(
        model=free_model,
        tools=[
            financial_snapshot,
            goal_progress,
            goal_plan,
            what_if_analysis,
        ],
        system_prompt="""
You are FINWISE, a personal financial planning assistant for users in India.

Rules:
1. Use the provided financial tools for all financial calculations.
2. Never invent or manually calculate financial metrics when a tool can calculate them.
3. Clearly distinguish savings rate, surplus rate, and debt-to-income ratio.
4. Savings rate means monthly savings contribution divided by monthly income.
5. Surplus rate means monthly surplus divided by monthly income.
6. Debt-to-income ratio means monthly debt payment divided by monthly income.
7. Use Indian Rupees (₹) when presenting amounts.
8. Explain results clearly and practically.
9. Do not provide stock, cryptocurrency, or investment price predictions.
10. Do not claim certainty about someone's financial future.
11. When discussing a What-If scenario, clearly separate current values from projected values.
""",
    )


def run_agent(user_message: str, profile: dict = None, goal: dict = None) -> str:
    """Run the Strands agent with the user's message and optional financial profile/goal context."""
    try:
        agent = create_agent()

        context_str = ""
        if profile:
            income = profile.get("income", 0)
            expenses = profile.get("expenses", {})
            debt_payment = profile.get("debtPayment", 0)
            savings = profile.get("savingsContribution", 0)

            context_str += f"\nUser Financial Profile:\n"
            context_str += f"- Monthly Income: ₹{income}\n"
            context_str += f"- Living Expenses: {expenses}\n"
            context_str += f"- Monthly Debt Payment: ₹{debt_payment}\n"
            context_str += f"- Monthly Savings Contribution: ₹{savings}\n"

        if goal:
            name = goal.get("name", "Goal")
            target_amount = goal.get("targetAmount", 0)
            amount_saved = goal.get("amountSaved", 0)
            target_date = goal.get("targetDate", "")

            context_str += f"\nUser Goal:\n"
            context_str += f"- Goal Name: {name}\n"
            context_str += f"- Target Amount: ₹{target_amount}\n"
            context_str += f"- Amount Saved: ₹{amount_saved}\n"
            context_str += f"- Target Date: {target_date}\n"

        prompt = f"{user_message}\n{context_str}".strip()
        response = agent(prompt)
        return str(response)
    except Exception as err:
        err_text = str(err)
        if "Connection" in err_text or "11434" in err_text:
            return (
                "⚠️ Ollama Connection Error: Could not connect to local Ollama server at http://localhost:11434. "
                "Make sure Ollama is running (`ollama serve` or Ollama app)."
            )
        else:
            return f"⚠️ Agent Execution Error: {err_text}"


if __name__ == "__main__":
    test_response = run_agent(
        "Analyze my financial situation and tell me if I'm on track for my goal.",
        profile={
            "income": 60000,
            "expenses": {
                "housing": 12000,
                "food": 6000,
                "transportation": 3000,
                "education": 4000,
                "healthcare": 1000,
                "entertainment": 1000,
                "subscriptions": 1000,
                "other": 2000,
            },
            "debtPayment": 5000,
            "savingsContribution": 10000,
        },
        goal={
            "name": "Emergency Fund",
            "targetAmount": 150000,
            "amountSaved": 50000,
            "targetDate": "2027-03-01",
        },
    )
    print(test_response)