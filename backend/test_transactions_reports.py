import unittest
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.database import init_db, get_db
from backend.transactions import service as trans_service
from backend.transactions.models import TransactionCreate, TransactionUpdate
from backend.reports import service as report_service


class TestTransactionsAndReports(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def setUp(self):
        trans_service.clear_all_transactions()

    def test_create_and_list_transaction(self):
        item = TransactionCreate(
            date="2026-09-01",
            description="Test Grocery",
            category="Food",
            amount=1500.0,
            type="expense",
            payment_method="UPI",
            notes="Weekly vegetables",
        )
        created = trans_service.create_transaction(item)
        self.assertIsNotNone(created["id"])
        self.assertEqual(created["description"], "Test Grocery")
        self.assertEqual(created["amount"], 1500.0)

        txs = trans_service.list_transactions()
        self.assertEqual(len(txs), 1)

    def test_transaction_summary(self):
        trans_service.create_transaction(
            TransactionCreate(date="2026-09-01", description="Salary", category="Salary", amount=50000.0, type="income")
        )
        trans_service.create_transaction(
            TransactionCreate(date="2026-09-02", description="Rent", category="Housing", amount=12000.0, type="expense")
        )
        trans_service.create_transaction(
            TransactionCreate(date="2026-09-05", description="Loan EMI", category="Debt", amount=4000.0, type="debt")
        )
        trans_service.create_transaction(
            TransactionCreate(date="2026-09-05", description="SIP", category="Savings", amount=8000.0, type="savings")
        )

        summary = trans_service.get_transaction_summary()
        self.assertEqual(summary.total_income, 50000.0)
        self.assertEqual(summary.total_expense, 12000.0)
        self.assertEqual(summary.total_debt, 4000.0)
        self.assertEqual(summary.total_savings, 8000.0)
        self.assertEqual(summary.net_cash_flow, 34000.0)
        self.assertEqual(summary.total_count, 4)

    def test_seed_and_historical_report(self):
        count = trans_service.seed_sample_transactions()
        self.assertGreater(count, 0)

        report = report_service.get_historical_report()
        self.assertTrue(report["has_data"])
        self.assertGreaterEqual(len(report["monthly_trends"]), 6)
        self.assertGreater(report["summary"]["avg_income"], 0)
        self.assertGreater(report["summary"]["financial_health_score"], 50)
        self.assertTrue(len(report["insights"]) > 0)


if __name__ == "__main__":
    unittest.main()
