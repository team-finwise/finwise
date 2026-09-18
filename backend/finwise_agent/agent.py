import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)
for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

from dotenv import load_dotenv
from strands import Agent
from strands.models.ollama import OllamaModel

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

load_dotenv()

SYSTEM_PROMPT = """You are FINWISE, a personal financial planning assistant for users in India.

Instructions:
- Use the provided financial calculation tools to compute accurate numbers before answering.
- Always answer the user's specific question directly and concisely.
- Use Indian Rupees (INR) with the Rs symbol when presenting amounts.
- Savings rate = monthly savings contribution divided by monthly income, expressed as a percentage.
- Surplus rate = monthly surplus divided by monthly income, expressed as a percentage.
- Debt-to-income ratio = monthly debt payment divided by monthly income, expressed as a percentage.
- Do not provide speculative investment predictions.
- When discussing what-if scenarios, clearly compare current vs projected values.
- Do not use emojis in your responses.
"""


def create_agent() -> Agent:
    host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
    model_id = os.environ.get("OLLAMA_MODEL", "llama3.1")

    model = OllamaModel(
        host=host,
        model_id=model_id,
    )

    return Agent(
        model=model,
        tools=[
            financial_snapshot,
            goal_progress,
            goal_plan,
            what_if_analysis,
        ],
        system_prompt=SYSTEM_PROMPT,
    )


def build_prompt(user_message: str, profile: dict = None, goal: dict = None) -> str:
    lines = [user_message]

    if profile:
        lines.append("\nUser Financial Profile:")
        lines.append(f"- Monthly Income: Rs {profile.get('income', 0)}")
        expenses = profile.get("expenses", {})
        if expenses:
            lines.append(f"- Expenses breakdown: {expenses}")
        lines.append(f"- Monthly Debt Payment: Rs {profile.get('debtPayment', 0)}")
        lines.append(f"- Monthly Savings Contribution: Rs {profile.get('savingsContribution', 0)}")

    if goal:
        lines.append("\nUser Financial Goal:")
        lines.append(f"- Goal Name: {goal.get('name', 'Savings')}")
        lines.append(f"- Target Amount: Rs {goal.get('targetAmount', 0)}")
        lines.append(f"- Amount Saved So Far: Rs {goal.get('amountSaved', 0)}")
        lines.append(f"- Target Date: {goal.get('targetDate', '')}")

    return "\n".join(lines).strip()


def run_agent(user_message: str, profile: dict = None, goal: dict = None) -> str:
    agent = create_agent()
    prompt = build_prompt(user_message, profile, goal)
    result = agent(prompt)
    return str(result).strip()


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    prof = {
        "income": 70000,
        "expenses": {
            "housing": 12000,
            "food": 6000,
            "transportation": 3000,
            "education": 4000,
            "healthcare": 1000,
            "entertainment": 1000,
            "subscriptions": 1000,
            "other": 1698,
        },
        "debtPayment": 5000,
        "savingsContribution": 21000,
    }
    gl = {
        "name": "Savings",
        "targetAmount": 150000,
        "amountSaved": 30000,
        "targetDate": "2027-03-31",
    }

    queries = [
        "What is my current savings?",
        "How can I reach my financial goal faster?",
        "What is my income?",
        "What is my debt-to-income ratio?",
    ]

    for q in queries:
        print(f"\nQ: {q}")
        print(run_agent(q, prof, gl))
        print("-" * 60)