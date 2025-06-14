import pytest
from app import app, get_db
import sqlite3
import os

@pytest.fixture
def client():
    # Use an in-memory database for testing
    app.config['TESTING'] = True
    app.config['DATABASE'] = ':memory:'
    
    with app.test_client() as client:
        with app.app_context():
            # Initialize the test database
            db = get_db()
            db.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT NOT NULL,
                    date TEXT NOT NULL,
                    description TEXT,
                    tags TEXT
                )
            ''')
            db.execute('''
                CREATE TABLE IF NOT EXISTS budgets (
                    category TEXT PRIMARY KEY,
                    amount REAL NOT NULL
                )
            ''')
            db.commit()
        yield client

def test_add_transaction(client):
    # Test adding an income transaction
    response = client.post('/api/transactions', json={
        'type': 'income',
        'amount': 1000.0,
        'category': 'salary',
        'date': '2023-10-01',
        'description': 'Monthly salary',
        'tags': ['recurring']
    })
    assert response.status_code == 201
    assert response.json['type'] == 'income'
    assert response.json['amount'] == 1000.0
    
    # Verify it's in the database
    with app.app_context():
        db = get_db()
        tx = db.execute('SELECT * FROM transactions').fetchone()
        assert tx is not None
        assert tx['type'] == 'income'

def test_get_transactions(client):
    # Add test data directly to DB
    with app.app_context():
        db = get_db()
        db.execute('''
            INSERT INTO transactions (type, amount, category, date, description, tags)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('income', 1000.0, 'salary', '2023-10-01', 'Salary', 'recurring'))
        db.commit()

    # Test getting all transactions
    response = client.get('/api/transactions')
    assert response.status_code == 200
    assert isinstance(response.json, list)
    assert len(response.json) == 1
    assert response.json[0]['type'] == 'income'

# ... (keep other tests but adapt them to use the database)