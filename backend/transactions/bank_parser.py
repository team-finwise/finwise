import re
import csv
import io
import os
import pytesseract
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
if os.name == "nt":
    tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path

CATEGORY_KEYWORDS = {
    "Food": [
        "swiggy", "zomato", "blinkit", "zepto", "bigbasket", "instamart", "supermarket",
        "grocery", "restaurant", "cafe", "starbucks", "mcdonald", "dominos", "pizza",
        "burger", "dhabha", "bakers", "dining", "eats", "food", "tea", "coffee"
    ],
    "Housing": [
        "rent", "landlord", "flat", "apartment", "society", "maintenance", "pg",
        "stay", "house", "brokerage", "electricity", "bescom", "tneb", "cesc", "water", "piped gas"
    ],
    "Transportation": [
        "uber", "ola", "rapido", "metro", "smart card", "dmrc", "bmrc", "mmrda",
        "irctc", "railway", "train", "flight", "indigo", "air india", "petrol", "fuel",
        "hpcl", "bpcl", "iocl", "fastag", "toll", "parking", "auto", "cab"
    ],
    "Education": [
        "udemy", "coursera", "course", "college", "school", "tuition", "fee",
        "university", "exam", "book", "kindle", "stationery", "coaching", "upsc", "gate"
    ],
    "Healthcare": [
        "apollo", "pharmacy", "medplus", "1mg", "pharmeasy", "hospital", "clinic",
        "doctor", "lab", "dental", "opticals", "lenskart", "medicine", "diagnostic"
    ],
    "Subscriptions": [
        "netflix", "spotify", "prime", "amazon prime", "hotstar", "youtube", "apple.com",
        "google storage", "cloud", "subscription", "broadband", "wifi", "jio", "airtel", "vi"
    ],
    "Entertainment": [
        "pvr", "inox", "cinepolis", "bookmyshow", "cinema", "movie", "gaming", "steam",
        "playstation", "pub", "club", "concert", "event"
    ],
    "Debt": [
        "loan", "emi", "hdfc loan", "sbi loan", "credit card", "cred", "card payment",
        "overdraft", "bajaj finance", "home credit", "interest debit"
    ],
    "Savings": [
        "sip", "mutual fund", "zerodha", "groww", "uti", "nippon", "hdfc amc", "icici pru",
        "nps", "ppf", "rd", "fd", "deposit", "investment", "gold", "sovereign"
    ],
    "Salary": [
        "salary", "payroll", "stipend", "wages", "tech corp", "infosys", "tcs", "wipro",
        "accenture", "google", "microsoft", "amazon dev", "employer"
    ],
    "Freelance": [
        "upwork", "fiverr", "freelance", "consulting", "client payment", "invoice payment"
    ],
}


def clean_narration(raw: str) -> Tuple[str, str, str, str]:
    """
    Cleans a raw cryptic bank narration into:
    (clean_merchant, category, transaction_type, payment_method)
    """
    text = raw.strip()
    text_upper = text.upper()
    text_lower = text.lower()

    # Detect payment method
    payment_method = "UPI"
    if "UPI/" in text_upper or "/UPI" in text_upper:
        payment_method = "UPI"
    elif "NEFT" in text_upper:
        payment_method = "Net Banking"
    elif "IMPS" in text_upper:
        payment_method = "Net Banking"
    elif "RTGS" in text_upper:
        payment_method = "Net Banking"
    elif "POS" in text_upper or "ECOM" in text_upper or "CARD" in text_upper:
        payment_method = "Debit Card"
    elif "ATM" in text_upper or "CASH" in text_upper or "WDL" in text_upper:
        payment_method = "Cash"
    elif "ACH" in text_upper or "NACH" in text_upper or "AUTODEBIT" in text_upper:
        payment_method = "Net Banking"

    # Detect category & clean description
    detected_cat = "Other"
    detected_type = "expense"

    # Check for Salary / Income
    for kw in CATEGORY_KEYWORDS["Salary"]:
        if kw in text_lower:
            detected_cat = "Salary"
            detected_type = "income"
            break

    if detected_type != "income":
        for kw in CATEGORY_KEYWORDS["Freelance"]:
            if kw in text_lower:
                detected_cat = "Freelance"
                detected_type = "income"
                break

    if detected_type != "income":
        for kw in CATEGORY_KEYWORDS["Savings"]:
            if kw in text_lower:
                detected_cat = "Savings"
                detected_type = "savings"
                break

    if detected_type not in ["income", "savings"]:
        for kw in CATEGORY_KEYWORDS["Debt"]:
            if kw in text_lower:
                detected_cat = "Debt"
                detected_type = "debt"
                break

    if detected_type not in ["income", "savings", "debt"]:
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if cat in ["Salary", "Freelance", "Savings", "Debt"]:
                continue
            for kw in keywords:
                if kw in text_lower:
                    detected_cat = cat
                    detected_type = "expense"
                    break
            if detected_cat != "Other":
                break

    # Clean merchant name from UPI / NEFT format
    # Example: "UPI/428192384/SWIGGY BANGALORE/Paytm" -> "Swiggy Bangalore"
    clean_name = text
    if "UPI/" in text_upper:
        parts = text.split("/")
        if len(parts) >= 3:
            clean_name = parts[2].strip()
    elif "POS/" in text_upper:
        parts = text.split("/")
        if len(parts) >= 3:
            clean_name = parts[2].strip()
    elif "NEFT-" in text_upper or "IMPS-" in text_upper:
        parts = text.split("-")
        if len(parts) >= 3:
            clean_name = parts[2].strip()
    elif "ACH/" in text_upper or "NACH/" in text_upper:
        parts = text.split("/")
        if len(parts) >= 2:
            clean_name = parts[1].strip()

    # Format cleanly (title case if all caps)
    if clean_name.isupper() or "_" in clean_name or "-" in clean_name:
        clean_name = clean_name.replace("_", " ").replace("-", " ").title()

    if len(clean_name) > 45:
        clean_name = clean_name[:45]

    return clean_name, detected_cat, detected_type, payment_method


def parse_csv_statement(csv_text: str) -> List[Dict[str, Any]]:
    """
    Parse a real bank statement CSV into list of transaction dicts.
    Detects standard Indian bank statement column formats.
    """
    lines = csv_text.strip().splitlines()
    if not lines:
        return []

    # Find the header row (contains date, narration/description, amount/debit/credit)
    header_idx = -1
    for idx, line in enumerate(lines[:20]):
        l_lower = line.lower()
        if "date" in l_lower and ("narration" in l_lower or "description" in l_lower or "particular" in l_lower or "details" in l_lower):
            header_idx = idx
            break

    if header_idx == -1:
        # Fallback: assume first line with commas
        for idx, line in enumerate(lines):
            if "," in line:
                header_idx = idx
                break

    if header_idx == -1:
        return []

    reader = csv.reader(lines[header_idx:])
    headers = [h.strip().lower() for h in next(reader, [])]

    # Map column positions
    date_col = -1
    desc_col = -1
    debit_col = -1
    credit_col = -1
    amount_col = -1
    type_col = -1

    for i, h in enumerate(headers):
        if "date" in h and date_col == -1:
            date_col = i
        elif any(k in h for k in ["narration", "description", "particular", "detail", "remark"]) and desc_col == -1:
            desc_col = i
        elif any(k in h for k in ["debit", "withdrawal", "dr"]) and debit_col == -1:
            debit_col = i
        elif any(k in h for k in ["credit", "deposit", "cr"]) and credit_col == -1:
            credit_col = i
        elif any(k in h for k in ["amount", "txn amt", "value"]) and amount_col == -1:
            amount_col = i
        elif "type" in h and type_col == -1:
            type_col = i

    parsed = []
    for row in reader:
        if not row or len(row) <= max(date_col, desc_col):
            continue

        raw_date = row[date_col].strip() if date_col != -1 and date_col < len(row) else ""
        raw_desc = row[desc_col].strip() if desc_col != -1 and desc_col < len(row) else "Bank Transaction"

        if not raw_date or not raw_desc:
            continue

        # Format date to YYYY-MM-DD
        dt_str = raw_date
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%b-%Y", "%d-%b-%y", "%b %d, %Y"):
            try:
                dt_obj = datetime.strptime(raw_date, fmt)
                dt_str = dt_obj.strftime("%Y-%m-%d")
                break
            except Exception:
                continue

        clean_name, cat, tx_type, method = clean_narration(raw_desc)

        # Determine amount and type
        amount = 0.0
        if debit_col != -1 and credit_col != -1:
            dr_val = row[debit_col].replace(",", "").strip() if debit_col < len(row) else ""
            cr_val = row[credit_col].replace(",", "").strip() if credit_col < len(row) else ""

            try:
                dr_amt = float(dr_val) if dr_val else 0.0
            except ValueError:
                dr_amt = 0.0

            try:
                cr_amt = float(cr_val) if cr_val else 0.0
            except ValueError:
                cr_amt = 0.0

            if cr_amt > 0:
                amount = cr_amt
                tx_type = "income"
                if cat == "Other":
                    cat = "Salary"
            elif dr_amt > 0:
                amount = dr_amt
                if tx_type == "income":
                    tx_type = "expense"
        elif amount_col != -1 and amount_col < len(row):
            amt_str = row[amount_col].replace(",", "").replace("₹", "").replace("INR", "").strip()
            try:
                amount = abs(float(amt_str))
            except ValueError:
                amount = 0.0

            if type_col != -1 and type_col < len(row):
                t_str = row[type_col].lower()
                if "cr" in t_str or "income" in t_str or "credit" in t_str:
                    tx_type = "income"
                elif "sav" in t_str:
                    tx_type = "savings"
                elif "debt" in t_str:
                    tx_type = "debt"

        if amount > 0:
            parsed.append({
                "date": dt_str,
                "description": clean_name,
                "category": cat,
                "amount": amount,
                "type": tx_type,
                "payment_method": method,
                "notes": f"Bank Narration: {raw_desc}",
            })

    return parsed


# PDF statements do not have a universal table structure. Most banks do, however,
# retain a selectable text layer where each transaction begins with a date. The
# helpers below turn that text into transaction-sized rows before applying the
# same narration/category rules used by CSV and SMS imports.
PDF_DATE_PATTERN = re.compile(
    r"(?<!\d)(?:"
    r"\d{4}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])"
    r"|(?:0?[1-9]|[12]\d|3[01])[-/](?:0?[1-9]|1[0-2])[-/](?:\d{2}|\d{4})"
    r"|(?:0?[1-9]|[12]\d|3[01])[-/](?:0?[1-9]|1[0-2])"
    r"|(?:0?[1-9]|[12]\d|3[01])\s+[A-Za-z]{3,9}\s+(?:\d{2}|\d{4})"
    r")(?!\d)",
    re.IGNORECASE,
)
PDF_AMOUNT_PATTERN = re.compile(
    r"(?:₹|Rs\.?|INR)?\s*\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|(?:₹|Rs\.?|INR)?\s*\d+(?:\.\d{1,2})?",
    re.IGNORECASE,
)

# OCR is only a fallback for image-only PDFs. Keeping the page limit modest
# prevents a single upload from consuming excessive CPU on the local server.
PDF_OCR_MAX_PAGES = int(os.getenv("FINWISE_PDF_OCR_MAX_PAGES", "15"))


def _extract_scanned_pdf_text(pdf_bytes: bytes) -> str:
    """Render an image-only PDF in memory and extract its text with Tesseract."""
    try:
        import fitz
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "Scanned-PDF OCR is not installed. Install the project requirements and try again."
        ) from exc

    try:
        pytesseract.get_tesseract_version()
    except pytesseract.TesseractNotFoundError as exc:
        raise RuntimeError(
            "Scanned-PDF OCR needs Tesseract installed on this server. "
            "Install Tesseract OCR and make sure its executable is on PATH."
        ) from exc

    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
            if document.page_count > PDF_OCR_MAX_PAGES:
                raise ValueError(
                    f"Scanned PDF statements are limited to {PDF_OCR_MAX_PAGES} pages. "
                    "Please upload a shorter statement."
                )

            pages = []
            for page in document:
                # 144 DPI provides readable statement text without creating
                # unnecessarily large images or writing user data to disk.
                pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), colorspace=fitz.csGRAY, alpha=False)
                image = Image.open(io.BytesIO(pixmap.tobytes("png")))
                pages.append(pytesseract.image_to_string(image, config="--oem 3 --psm 6"))
            return "\n".join(pages)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("We could not read this scanned PDF. Please upload a clear bank statement PDF.") from exc


def _pdf_text_with_ocr_fallback(extracted_text: str, pdf_bytes: bytes) -> str:
    """Use native PDF text when available, falling back to local OCR only when needed."""
    return extracted_text if extracted_text.strip() else _extract_scanned_pdf_text(pdf_bytes)


def _normalise_statement_date(value: str) -> Optional[str]:
    """Return an ISO date for common statement date formats."""
    value = re.sub(r"\s+", " ", value.strip())

    formats_with_year = (
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d/%m/%y",
        "%d-%b-%Y",
        "%d-%b-%y",
        "%d/%b/%Y",
        "%d/%b/%y",
        "%d %b %Y",
        "%d %b %y",
        "%d %B %Y",
        "%d %B %y",
    )

    for fmt in formats_with_year:
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Some bank PDFs omit the year from transaction dates.
    for fmt in ("%d/%m", "%d-%m"):
        try:
            parsed = datetime.strptime(value, fmt)
            return parsed.replace(year=datetime.now().year).strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None

def _pdf_rows_from_text(text: str) -> List[str]:
    """Join wrapped PDF text into rows, with one dated transaction per row."""
    # Some PDF generators place day, month and year on separate text lines.
    # Rejoin that sequence before locating the start of each transaction.
    text = re.sub(
        r"\b(\d{1,2})\s*\n\s*([A-Za-z]{3,9})\s*\n\s*(\d{2,4})\b",
        r"\1 \2 \3",
        text,
    )
    rows: List[str] = []
    current = ""
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line:
            continue
        if PDF_DATE_PATTERN.search(line):
            if current:
                rows.append(current)
            current = line
        elif current:
            current = f"{current} {line}"
    if current:
        rows.append(current)
    return rows


def _parse_pdf_statement_text(text: str) -> List[Dict[str, Any]]:
    """Parse common bank statement PDF rows with debit, credit and balance columns."""
    parsed: List[Dict[str, Any]] = []

    for row in _pdf_rows_from_text(text):
        date_match = PDF_DATE_PATTERN.search(row)
        if not date_match:
            continue

        date_value = _normalise_statement_date(date_match.group(0))
        after_date = row[date_match.end():].strip(" |:-")

        if not date_value or not after_date:
            continue

        amounts = []

        for match in PDF_AMOUNT_PATTERN.finditer(after_date):
            raw = match.group(0)
            cleaned = re.sub(r"(?i)(₹|rs\.?|inr|,|\s)", "", raw)

            try:
                value = abs(float(cleaned))
            except ValueError:
                continue

            if value > 0:
                amounts.append((match, value))

        if not amounts:
            continue

        # Standard statement format:
        # Date | Description | Debit/Credit | Balance
        if len(amounts) >= 2:
            transaction_match, amount = amounts[-2]
            balance_match, balance = amounts[-1]
        else:
            transaction_match, amount = amounts[0]

        raw_narration = after_date[:transaction_match.start()].strip(" |:-")

        if not raw_narration:
            continue

        clean_name, category, tx_type, method = clean_narration(raw_narration)

        row_lower = row.lower()

        # Explicit credit/income transactions.
        if "credit" in row_lower or "deposit" in row_lower or "interestcredit" in row_lower:
            tx_type = "income"
            if category == "Other":
                category = "Salary" if "salary" in row_lower or "payroll" in row_lower else "Other"

        # Withdrawals, purchases, checks and fees are expenses.
        elif any(
            keyword in row_lower
            for keyword in [
                "purchase",
                "withdrawal",
                "check",
                "service charge",
                "debit",
            ]
        ):
            tx_type = "expense"

        parsed.append({
            "date": date_value,
            "description": clean_name,
            "category": category,
            "amount": amount,
            "type": tx_type,
            "payment_method": method,
            "notes": f"PDF Bank Statement: {row[:180]}",
        })

    return parsed

def parse_pdf_statement(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """Extract and parse a text-based PDF bank statement.

    Encrypted and image-only/scanned PDFs are reported clearly because they
    require a password or OCR before their contents can be safely interpreted.
    """
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("PDF import is not installed. Run pip install -r requirements.txt.") from exc

    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        if reader.is_encrypted:
            raise ValueError("This PDF is password-protected. Export an unlocked statement from your bank and try again.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError("We could not read this PDF. Please upload a valid bank statement PDF.") from exc

    text = _pdf_text_with_ocr_fallback(text, pdf_bytes)
    print("\n========== PDF EXTRACTED TEXT ==========")
    print(text[:5000])
    print("========== END PDF TEXT ==========\n")
    if not text.strip():
        raise ValueError("No text was found in this PDF. Please upload a clear bank statement or use CSV.")
    return _parse_pdf_statement_text(text)


def parse_sms_statement(text: str) -> List[Dict[str, Any]]:
    """
    Parse pasted Indian bank transaction SMS messages.
    Supports formats from SBI, HDFC, ICICI, Axis, Kotak, etc.
    """
    # Split into individual SMS lines or sentences
    lines = re.split(r'\n+|\.(?=\s*[A-Z])', text)
    results = []

    today = datetime.now().strftime("%Y-%m-%d")

    for line in lines:
        l = line.strip()
        if not l or len(l) < 15:
            continue

        l_lower = l.lower()
        if not ("debited" in l_lower or "credited" in l_lower or "spent" in l_lower or "paid" in l_lower or "sent" in l_lower or "received" in l_lower):
            continue

        # Extract Amount
        # Matches: Rs. 450, Rs 1,200.50, INR 65000, Rs.450
        amt_match = re.search(r'(?:rs\.?|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)', l, re.IGNORECASE)
        if not amt_match:
            continue
        amt = float(amt_match.group(1).replace(",", ""))
        if amt <= 0:
            continue

        # Extract Type (Debit vs Credit)
        is_credit = "credited" in l_lower or "received" in l_lower or "refund" in l_lower
        tx_type = "income" if is_credit else "expense"

        # Extract Date
        # Matches formats: 12-Sep-26, 12/09/2026, 12-09-2026, 12Sep
        date_str = today
        date_match = re.search(r'(\d{1,2}[-/][A-Za-z0-9]{2,3}[-/]\d{2,4})', l)
        if date_match:
            raw_d = date_match.group(1)
            for fmt in ("%d-%b-%y", "%d-%b-%Y", "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y"):
                try:
                    dt = datetime.strptime(raw_d, fmt)
                    date_str = dt.strftime("%Y-%m-%d")
                    break
                except Exception:
                    pass

        # Extract Payee / Merchant
        # Match "to MERCHANT", "at MERCHANT", "towards REASON", etc.
        merchant_match = re.search(r'(?:paid to|sent to|transfer to|towards|to|at|for)\s+([A-Za-z0-9\s&_-]+?)(?:\s+on|\s+via|\s+ref|\s+avail|\s+bal|\.|$)', l, re.IGNORECASE)
        raw_payee = merchant_match.group(1).strip() if merchant_match else ""

        if not raw_payee or raw_payee.lower().startswith("rs") or raw_payee.lower().startswith("inr"):
            # Fallback search for common brand names
            for brand in ["Swiggy", "Zomato", "Blinkit", "Zepto", "Uber", "Ola", "Amazon", "Flipkart", "Netflix", "Spotify", "Rent", "Salary"]:
                if brand.lower() in l_lower:
                    raw_payee = brand
                    break

        if not raw_payee:
            raw_payee = "Bank Transaction"

        clean_name, cat, inferred_type, method = clean_narration(raw_payee)

        if is_credit and inferred_type != "income":
            inferred_type = "income"
            cat = "Salary" if "salary" in l_lower else "Other"

        results.append({
            "date": date_str,
            "description": clean_name if clean_name != "Bank Transaction" else raw_payee,
            "category": cat,
            "amount": amt,
            "type": inferred_type,
            "payment_method": method,
            "notes": f"SMS: {l[:100]}",
        })

    return results


def get_bank_passbook_preset(bank: str = "hdfc") -> List[Dict[str, Any]]:
    """
    Returns authentic bank passbook data formatted with authentic bank narrations.
    """
    if bank.lower() == "sbi":
        items = [
            ("2026-09-01", "NEFT/SBIN0012849/TECH_CORP_PVT_LTD_SALARY", 65000, "income", "Salary", "Net Banking"),
            ("2026-09-02", "UPI/428192001/APARTMENT_RENT_TRANSFER/HDFC", 12000, "expense", "Housing", "UPI"),
            ("2026-09-03", "UPI/428192002/BLINKIT_COMMERCE_NEW_DELHI", 1850, "expense", "Food", "UPI"),
            ("2026-09-05", "ACH/DR/SBI_EDUCATION_LOAN_EMI_A948", 5000, "debt", "Debt", "Net Banking"),
            ("2026-09-05", "ACH/DR/UTI_NIFTY_50_INDEX_FUND_SIP", 12000, "savings", "Savings", "Net Banking"),
            ("2026-09-07", "UPI/428192003/DELHI_METRO_SMARTCARD_RECHARGE", 1200, "expense", "Transportation", "UPI"),
            ("2026-09-09", "POS/492819/APOLLO_PHARMACY_SECTOR_18", 850, "expense", "Healthcare", "Debit Card"),
            ("2026-09-12", "UPI/428192004/ZOMATO_ORDER_BANGALORE", 760, "expense", "Food", "UPI"),
            ("2026-09-15", "ECOM/PURCHASE/AMAZON_SELLER_SERVICES", 2100, "expense", "Other", "Debit Card"),
            ("2026-09-18", "UPI/428192005/UBER_INDIA_TRIP_PAYTM", 640, "expense", "Transportation", "UPI"),
            ("2026-09-20", "NACH/DR/NETFLIX_ENTERTAINMENT_MUMBAI", 649, "expense", "Subscriptions", "Debit Card"),
            ("2026-09-24", "UPI/428192006/SWIGGY_INSTAMART_ORDER", 1120, "expense", "Food", "UPI"),
            ("2026-09-28", "ATM-WDL/SBI_ATM_GREEN_PARK_NEW_DELHI", 3000, "expense", "Other", "Cash"),
        ]
    else:  # HDFC Bank
        items = [
            ("2026-09-01", "NEFT CR-HDFC0000240-TECH CORP SOLUTIONS-SALARY SEP", 65000, "income", "Salary", "Net Banking"),
            ("2026-09-02", "UPI/4291048201/RENT OWNER A/C 9481/HDFC", 12000, "expense", "Housing", "UPI"),
            ("2026-09-04", "UPI/4291048202/SWIGGY BANGALORE/Paytm", 980, "expense", "Food", "UPI"),
            ("2026-09-05", "AUTODEBIT-HDFC LOAN SERVICES EMI-L94819", 5000, "debt", "Debt", "Net Banking"),
            ("2026-09-05", "ACH/ZERODHA BROKING LTD/MUTUAL FUND SIP", 12000, "savings", "Savings", "Net Banking"),
            ("2026-09-08", "UPI/4291048203/ZEPTO QUICK COMMERCE/GPay", 1450, "expense", "Food", "UPI"),
            ("2026-09-11", "POS 482019 AMAZON RETAIL INDIA MUMBAI", 2400, "expense", "Other", "Credit Card"),
            ("2026-09-14", "UPI/4291048204/UBER RIDES INDIA/PhonePe", 820, "expense", "Transportation", "UPI"),
            ("2026-09-17", "POS 948102 PVR CINEMAS FORUM MALL", 1100, "expense", "Entertainment", "Credit Card"),
            ("2026-09-19", "UPI/4291048205/SUPERMARKET HYPERLOCAL/HDFC", 2200, "expense", "Food", "UPI"),
            ("2026-09-22", "AUTODEBIT SPOTIFY INDIA SUBSCRIPTION", 119, "expense", "Subscriptions", "Credit Card"),
            ("2026-09-25", "UPI/4291048206/APOLLO HEALTH CLINIC/Paytm", 950, "expense", "Healthcare", "UPI"),
            ("2026-09-28", "ATM CASH WDL-HDFC ATM KORAMANGALA", 2000, "expense", "Other", "Cash"),
        ]

    output = []
    for dt, narr, amt, tx_type, cat, method in items:
        clean_name, auto_cat, auto_type, auto_method = clean_narration(narr)
        output.append({
            "date": dt,
            "description": clean_name,
            "category": cat or auto_cat,
            "amount": amt,
            "type": tx_type or auto_type,
            "payment_method": method or auto_method,
            "notes": f"Bank Passbook: {narr}",
        })

    return output
