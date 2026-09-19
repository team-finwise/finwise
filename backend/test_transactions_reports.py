import unittest
import os
import sys
from unittest.mock import patch

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
from backend.transactions.bank_parser import _parse_pdf_statement_text, _pdf_text_with_ocr_fallback


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

    def test_parse_text_extracted_from_pdf_statement(self):
        statement_text = """
            Account Statement
            Date Narration Debit Credit Balance
            12/09/2026 UPI/428192384/SWIGGY/Paytm 450.00 45,200.00
            01/09/2026 NEFT CR-TECH CORP SALARY 65,000.00 110,200.00
        """
        parsed = _parse_pdf_statement_text(statement_text)

        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0]["date"], "2026-09-12")
        self.assertEqual(parsed[0]["amount"], 450.0)
        self.assertEqual(parsed[0]["category"], "Food")
        self.assertEqual(parsed[1]["amount"], 65000.0)
        self.assertEqual(parsed[1]["type"], "income")
        self.assertEqual(parsed[1]["category"], "Salary")

    def test_parse_common_spaced_and_year_first_pdf_dates(self):
        statement_text = """
            Date Description Debit Credit Balance
            12 Sep 2026 UPI/0123/UBER INDIA 325.50 DR 42,110.00
            2026/09/13 ACME CONSULTING PAYMENT 12,500.00 CR 54,610.00
        """
        parsed = _parse_pdf_statement_text(statement_text)

        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0]["date"], "2026-09-12")
        self.assertEqual(parsed[0]["amount"], 325.50)
        self.assertEqual(parsed[0]["type"], "expense")
        self.assertEqual(parsed[1]["date"], "2026-09-13")
        self.assertEqual(parsed[1]["amount"], 12500.00)
        self.assertEqual(parsed[1]["type"], "income")

    def test_pdf_uses_local_ocr_only_when_native_text_is_missing(self):
        with patch(
            "backend.transactions.bank_parser._extract_scanned_pdf_text",
            return_value="12/09/2026 UPI/123/UBER 325.00 DR 42,110.00",
        ) as ocr:
            self.assertEqual(
                _pdf_text_with_ocr_fallback("", b"scanned-pdf"),
                "12/09/2026 UPI/123/UBER 325.00 DR 42,110.00",
            )
            ocr.assert_called_once_with(b"scanned-pdf")

        with patch("backend.transactions.bank_parser._extract_scanned_pdf_text") as ocr:
            self.assertEqual(_pdf_text_with_ocr_fallback("native PDF text", b"pdf"), "native PDF text")
            ocr.assert_not_called()


if __name__ == "__main__":
    unittest.main()
