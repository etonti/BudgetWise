import pytest
from backend.app import app, get_db
import sqlite3
import os

@pytest.fixture
def client():
    # Configuration spécifique pour les tests
    app.config['TESTING'] = True
    app.config['DATABASE'] = ':memory:'
    
    # Réinitialise la base de données
    with app.app_context():
        db = get_db()
        db.execute('DROP TABLE IF EXISTS transactions')
        db.execute('''
            CREATE TABLE transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                description TEXT,
                tags TEXT
            )
        ''')
        db.commit()

    yield app.test_client()  # Utilisez cette syntaxe plus simple

def test_add_transaction(client):
    response = client.post('/api/transactions', json={
        'type': 'income',
        'amount': 1000,
        'category': 'salary',
        'date': '2023-11-01'
    })
    assert response.status_code == 201