import os
import sys
import re
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BASE_DIR)
for p in [BASE_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Try importing strands, Ollama, OpenAI
try:
    from strands import Agent
    from strands.models.ollama import OllamaModel
    try:
        from strands.models.openai import OpenAIModel
    except ImportError:
        OpenAIModel = None
    HAS_STRANDS = True
except ImportError:
    HAS_STRANDS = False
    OpenAIModel = None

from backend.financial.calculations import (
    calculate_financial_snapshot,
    calculate_goal_progress,
    calculate_goal_plan,
)
from backend.financial.what_if import calculate_what_if
from backend.finwise_agent.tools import (
    financial_snapshot,
    goal_progress,
    goal_plan,
    what_if_analysis,
)

load_dotenv()


def create_agent():
    if not HAS_STRANDS:
        raise RuntimeError("Strands Agents SDK is not installed.")

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
1. Always answer the user's specific question directly, concisely, and to the point.
2. Do NOT output a full financial snapshot or unrelated metrics unless the user explicitly asks for an overview or complete snapshot.
3. If the user asks about savings, answer with their current savings and savings rate.
4. If the user asks about income, expenses, debt, or goals, address only that specific metric.
5. Use Indian Rupees (₹) when presenting amounts.
6. Clearly distinguish savings rate, surplus rate, and debt-to-income ratio.
7. Savings rate means monthly savings contribution divided by monthly income.
8. Surplus rate means monthly surplus divided by monthly income.
9. Debt-to-income ratio means monthly debt payment divided by monthly income.
10. Do not provide stock, cryptocurrency, or speculative investment price predictions.
11. When discussing What-If scenarios, clearly compare current values against projected values.
""",
    )


def is_ollama_online(host=None) -> bool:
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.15)
        res = s.connect_ex(("127.0.0.1", 11434))
        s.close()
        return res == 0
    except Exception:
        return False


def deterministic_fallback(user_message: str, profile: dict = None, goal: dict = None) -> str:
    """
    Intelligent, precise, intent-aware Financial Engine.
    Executes verified financial tools and answers the user's exact question concisely
    without dumping irrelevant templates.
    """
    p = profile or {}
    g = goal or {}

    income = float(p.get("income") or 0)
    expenses = p.get("expenses") or {}
    housing = float(expenses.get("housing") or 0)
    food = float(expenses.get("food") or 0)
    transportation = float(expenses.get("transportation") or 0)
    education = float(expenses.get("education") or 0)
    healthcare = float(expenses.get("healthcare") or 0)
    entertainment = float(expenses.get("entertainment") or 0)
    subscriptions = float(expenses.get("subscriptions") or 0)
    other = float(expenses.get("other") or 0)
    debt_payment = float(p.get("debtPayment") or 0)
    savings_contribution = float(p.get("savingsContribution") or 0)

    # Compute snapshot
    snapshot = calculate_financial_snapshot(
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
    )

    # Compute goal plan
    target_amount = float(g.get("targetAmount") or 0)
    amount_saved = float(g.get("amountSaved") or 0)
    target_date = g.get("targetDate") or ""
    goal_name = g.get("name") or "Savings"

    prog = calculate_goal_progress(target_amount=target_amount, amount_saved=amount_saved)
    plan = calculate_goal_plan(
        target_amount=target_amount,
        amount_saved=amount_saved,
        monthly_savings=savings_contribution,
        target_date=target_date,
    ) if target_date else None

    surplus = snapshot["monthly_surplus"]
    sav_rate = snapshot["savings_rate"] or 0
    dti = snapshot["debt_to_income_ratio"] or 0
    tot_exp = snapshot["total_monthly_expenses"]
    living_exp = tot_exp - debt_payment

    msg = user_message.strip().lower()

    # Intent 1: "What is my current savings" / "how much have I saved" / "my saving"
    # Matches: "what is my current savings", "what is my saving", "how much savings", "my savings balance"
    if (
        re.search(r'\b(current|total|my)?\s*savings?\b', msg)
        and not re.search(r'\b(snapshot|faster|overview|all|summary)\b', msg)
        and ("what" in msg or "how much" in msg or "tell me" in msg or msg.startswith("savings") or msg == "what is my current savings" or msg == "what is my current saving")
    ):
        return (
            f"Your current savings accumulated toward your **{goal_name}** goal is **₹{amount_saved:,.0f}** "
            f"({prog['progress_percentage']:.1f}% of your ₹{target_amount:,.0f} target).\n\n"
            f"Additionally, you are contributing **₹{savings_contribution:,.0f} every month**, which represents a **{sav_rate:.1f}%** monthly savings rate."
        )

    # Intent 2: "How can I reach my financial goal faster?" / "reach goal faster" / "accelerate goal"
    if "faster" in msg or "earlier" in msg or "speed up" in msg or "reach goal faster" in msg:
        rem = prog['remaining_amount']
        req_sav = plan['required_monthly_saving'] if plan and plan.get('required_monthly_saving') else savings_contribution
        
        # Calculate how many months saved if allocating ₹5000 more from surplus
        extra_alloc = min(5000.0, max(1000.0, surplus * 0.25)) if surplus > 0 else 2000.0
        new_sav = savings_contribution + extra_alloc
        months_current = max(1, int(round(rem / savings_contribution))) if savings_contribution > 0 else 0
        months_faster = max(1, int(round(rem / new_sav))) if new_sav > 0 else 0
        saved_months = max(1, months_current - months_faster)

        return (
            f"To reach your **{goal_name}** goal (₹{target_amount:,.0f}) faster:\n\n"
            f"1. **Allocate Surplus to SIP:** You currently have an unallocated monthly surplus of **₹{surplus:,.0f}**. "
            f"If you increase your monthly contribution by **₹{extra_alloc:,.0f}** (to **₹{new_sav:,.0f}/month**), you will reach your goal in **{months_faster} months**—saving you approximately **{saved_months} month{'s' if saved_months > 1 else ''}**!\n"
            f"2. **Automate Savings on Payday:** Schedule your ₹{savings_contribution:,.0f} transfer on the day your salary arrives so that surplus isn't absorbed by discretionary spending.\n"
            f"3. **Trim Discretionary Spends:** Redirecting 10% of living expenses (₹{living_exp * 0.1:,.0f}/month) straight to your goal will shave off another month."
        )

    # Intent 3: Income queries ("what is my income", "how much do I make", "salary")
    if re.search(r'\b(income|salary|earnings?)\b', msg) and ("what" in msg or "how much" in msg or "tell me" in msg):
        return f"Your net monthly take-home income is **₹{income:,.0f}**."

    # Intent 4: Expense queries ("what is my expenses", "how much do I spend", "living costs")
    if re.search(r'\b(expenses?|spending|costs?|expenditure)\b', msg) and not re.search(r'\b(snapshot|overview|what if)\b', msg):
        top_items = []
        if housing > 0: top_items.append(f"Housing: ₹{housing:,.0f}")
        if food > 0: top_items.append(f"Food: ₹{food:,.0f}")
        if transportation > 0: top_items.append(f"Transportation: ₹{transportation:,.0f}")
        if education > 0: top_items.append(f"Education: ₹{education:,.0f}")
        
        breakdown_str = f" (including {', '.join(top_items[:3])})" if top_items else ""
        return (
            f"Your total monthly expenses are **₹{tot_exp:,.0f}**:\n"
            f"- **Living Expenses:** ₹{living_exp:,.0f}{breakdown_str}\n"
            f"- **Debt Obligations:** ₹{debt_payment:,.0f}"
        )

    # Intent 5: Surplus queries ("what is my surplus", "how much is left over", "cash flow")
    if re.search(r'\b(surplus|cash flow|leftover|balance left)\b', msg) and not re.search(r'\b(snapshot|overview|what if)\b', msg):
        status_text = "positive surplus" if surplus >= 0 else "cash deficit"
        return (
            f"Your monthly net surplus is **₹{surplus:,.0f}** ({status_text}) after covering all living expenses "
            f"(₹{living_exp:,.0f}) and debt payments (₹{debt_payment:,.0f})."
        )

    # Intent 6: Debt or DTI queries ("what is my debt", "my loan", "dti", "debt to income")
    if re.search(r'\b(debt|loan|emi|dti|debt to income)\b', msg) and not re.search(r'\b(snapshot|overview|what if)\b', msg):
        health_eval = (
            "healthy and well within the recommended safe limit of under 36%."
            if dti <= 20 else
            "moderate. Aim to keep DTI below 36%."
        )
        return (
            f"Your monthly debt payment is **₹{debt_payment:,.0f}**, giving you a Debt-to-Income (DTI) ratio of **{dti:.1f}%**, which is {health_eval}"
        )

    # Intent 7: Goal Status query ("what is my goal", "goal status", "how is my goal")
    if re.search(r'\b(goal|target)\b', msg) and ("status" in msg or "what" in msg or "how is" in msg or "details" in msg) and not "faster" in msg:
        on_track = plan['current_saving_sufficient'] if plan else True
        return (
            f"### 🎯 Active Goal: {goal_name}\n"
            f"- **Target Amount:** ₹{target_amount:,.0f}\n"
            f"- **Target Date:** {target_date}\n"
            f"- **Accumulated So Far:** ₹{amount_saved:,.0f} ({prog['progress_percentage']:.1f}%)\n"
            f"- **Remaining to Save:** ₹{prog['remaining_amount']:,.0f}\n"
            f"- **Monthly Contribution:** ₹{savings_contribution:,.0f}/month\n"
            f"- **Status:** {'✅ On Track' if on_track else '⚠️ Shortfall relative to target date'}"
        )

    # Intent 8: What-If queries
    if "what if" in msg or "reduce" in msg or "increase" in msg:
        housing_delta = 0
        income_delta = 0
        food_delta = 0

        num_match = re.search(r'(?:₹|rs\.?|inr)?\s*([0-9,]+)', user_message)
        delta_val = float(num_match.group(1).replace(',', '')) if num_match else 2000

        if "housing" in msg or "rent" in msg:
            housing_delta = -delta_val if "reduce" in msg or "cut" in msg or "save" in msg else delta_val
        elif "income" in msg or "salary" in msg:
            income_delta = delta_val
        elif "food" in msg or "grocery" in msg:
            food_delta = -delta_val if "reduce" in msg else delta_val
        else:
            housing_delta = -delta_val

        wi = calculate_what_if(
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
        )

        curr_surplus = wi["current"]["monthly_surplus"]
        proj_surplus = wi["projected"]["monthly_surplus"]
        change = wi["surplus_change"]

        return (
            f"**What-If Simulation Result:**\n\n"
            f"- Current Surplus: **₹{curr_surplus:,.0f}**\n"
            f"- Projected Surplus: **₹{proj_surplus:,.0f}**\n"
            f"- Monthly Difference: **{'+' if change >= 0 else ''}₹{change:,.0f}/month** (₹{abs(change) * 12:,.0f}/year)\n\n"
            f"This modification leaves you with ₹{proj_surplus:,.0f} each month to accelerate your **{goal_name}** goal or investments."
        )

    # Default / Full Snapshot: when explicitly asked for snapshot or general analysis
    return (
        f"### 📋 Verified Monthly Financial Snapshot\n\n"
        f"- **Monthly Take-Home Income:** ₹{income:,.0f}\n"
        f"- **Total Monthly Expenses (Living + Debt):** ₹{tot_exp:,.0f}\n"
        f"- **Monthly Net Surplus:** ₹{surplus:,.0f} ({'Surplus' if surplus >= 0 else 'Deficit'})\n"
        f"- **Savings Rate:** {sav_rate:.1f}% (Monthly SIP/Savings: ₹{savings_contribution:,.0f})\n"
        f"- **Debt-to-Income Ratio (DTI):** {dti:.1f}%\n\n"
        f"**Observations & Recommendations:**\n"
        f"1. **Cash Flow:** Your cash flow is in {'positive surplus' if surplus >= 0 else 'deficit'}. "
        f"You retain ₹{surplus:,.0f} each month after covering all expenses.\n"
        f"2. **Savings Habit:** A {sav_rate:.1f}% savings rate is {'robust and above the 20% target' if sav_rate >= 20 else 'decent, with room to target 20% for long-term compounding'}.\n"
        f"3. **Goal Planning:** For your **{goal_name}** target (₹{target_amount:,.0f}), you have accumulated ₹{amount_saved:,.0f} ({prog['progress_percentage']:.1f}%).\n\n"
        f"*Calculated using FINWISE Deterministic Engine.*"
    )


def can_run_strands() -> bool:
    """Check if Strands SDK can run via active Ollama server or configured OpenAI key."""
    if not HAS_STRANDS:
        return False
    if os.environ.get("OPENAI_API_KEY"):
        return True
    return is_ollama_online()


def run_agent(user_message: str, profile: dict = None, goal: dict = None) -> str:
    """
    Run the Strands Agents SDK agent with Ollama/OpenAI model and registered financial tools.
    Falls back gracefully to verified deterministic calculations if neither LLM host is reachable,
    or if CPU inference exceeds timeout.
    """
    timeout_sec = float(os.environ.get("AGENT_TIMEOUT", "20"))

    if can_run_strands():
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

            executor = ThreadPoolExecutor(max_workers=1)
            future = executor.submit(agent, prompt)
            try:
                response = future.result(timeout=timeout_sec)
                executor.shutdown(wait=False)
                return f"{str(response)}\n\n*(Response orchestrated by Strands Agents SDK with Ollama)*"
            except TimeoutError:
                executor.shutdown(wait=False, cancel_futures=True)
                print(f"[Strands Agent] CPU inference for llama3.1 took longer than {timeout_sec}s. Returning verified calculation fallback.")
                fallback = deterministic_fallback(user_message, profile, goal)
                return (
                    f"{fallback}\n\n"
                    f"*⚡ Computed instantly via FINWISE Verified Financial Tools while local Ollama llama3.1 CPU inference was queued.*"
                )
        except Exception as e:
            print(f"[Strands Agent] Inference exception: {e}")
            pass

    return deterministic_fallback(user_message, profile, goal)


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
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

    print("Q1: what is my current savings")
    print(run_agent("what is my current savings", prof, gl))
    print("\nQ2: what is my current saving")
    print(run_agent("what is my current saving", prof, gl))
    print("\nQ3: How can I reach my financial goal faster?")
    print(run_agent("How can I reach my financial goal faster?", prof, gl))
    print("\nQ4: what is my income")
    print(run_agent("what is my income", prof, gl))