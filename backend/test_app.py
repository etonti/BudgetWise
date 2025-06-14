import pytest
import sqlite3
import pytest
from .app import app, get_db  

@pytest.fixture
def client():
    """Fixture de test avec base de données en mémoire"""
    app.config['TESTING'] = True
    app.config['DATABASE'] = ':memory:'
    
    with app.app_context():
        # Initialisation de la DB de test
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
        db.commit()
        
    yield app.test_client()
    
    # Nettoyage après test
    with app.app_context():
        db = get_db()
        db.execute('DROP TABLE IF EXISTS transactions')
        db.commit()

def test_add_transaction(client):
    """Test l'ajout d'une transaction"""
    test_data = {
        'type': 'income',
        'amount': 1000,
        'category': 'salary',
        'date': '2023-11-01',
        'description': 'Test transaction',
        'tags': ['test']
    }
    
    response = client.post('/api/transactions', json=test_data)
    assert response.status_code == 201
    assert response.json['amount'] == 1000

def test_get_transactions(client):
    """Test la récupération des transactions"""
   
    client.post('/api/transactions', json={
        'type': 'expense',
        'amount': 50,
        'category': 'food',
        'date': '2023-11-02'
    })
    
    response = client.get('/api/transactions')
    assert response.status_code == 200
    assert len(response.json) > 0