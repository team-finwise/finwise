import os
import sqlite3
from typing import Generator
from contextlib import contextmanager

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("FINWISE_DB_PATH", os.path.join(DB_DIR, "finwise.db"))


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'savings', 'debt')),
                payment_method TEXT DEFAULT 'UPI',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_type ON transactions(type);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_trans_category ON transactions(category);")
