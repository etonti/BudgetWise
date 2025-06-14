from flask import Flask, jsonify, request, g
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

DATABASE = os.path.join(os.path.dirname(__file__), 'budgetwise.db')

# Initialisation de la base si elle n'existe pas
def init_db():
    if not os.path.exists(DATABASE):
        with sqlite3.connect(DATABASE) as db:
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

# Accès à la base via Flask.g
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(error):
    db = g.pop('db', None)
    if db:
        db.close()

# ✅ Route de test pour Render
@app.route('/')
def index():
    return jsonify({"message": "Bienvenue sur l'API BudgetWise"}), 200

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    type_filter = request.args.get('type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = 'SELECT * FROM transactions'
    params = []
    conditions = []

    if type_filter:
        conditions.append('type = ?')
        params.append(type_filter)
    if start_date:
        conditions.append('date >= ?')
        params.append(start_date)
    if end_date:
        conditions.append('date <= ?')
        params.append(end_date)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query += ' ORDER BY date DESC'

    db = get_db()
    transactions = db.execute(query, params).fetchall()
    return jsonify([dict(tx) for tx in transactions])

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    tags = ','.join(data.get('tags', []))

    db = get_db()
    cursor = db.execute('''
        INSERT INTO transactions (type, amount, category, date, description, tags)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (data['type'], data['amount'], data['category'], data['date'], data.get('description'), tags))

    db.commit()
    transaction_id = cursor.lastrowid
    new_transaction = db.execute('SELECT * FROM transactions WHERE id = ?', (transaction_id,)).fetchone()
    return jsonify(dict(new_transaction)), 201

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    data = request.json
    tags = ','.join(data.get('tags', []))

    db = get_db()
    db.execute('''
        UPDATE transactions
        SET type = ?, amount = ?, category = ?, date = ?, description = ?, tags = ?
        WHERE id = ?
    ''', (data['type'], data['amount'], data['category'], data['date'], data.get('description'), tags, id))

    db.commit()
    updated_transaction = db.execute('SELECT * FROM transactions WHERE id = ?', (id,)).fetchone()
    if updated_transaction:
        return jsonify(dict(updated_transaction))
    return jsonify({'error': 'Transaction not found'}), 404

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    db = get_db()
    db.execute('DELETE FROM transactions WHERE id = ?', (id,))
    db.commit()
    return jsonify({'message': 'Transaction deleted'})

@app.route('/api/budget', methods=['GET'])
def get_budget():
    db = get_db()
    budgets = db.execute('SELECT * FROM budgets').fetchall()
    return jsonify({b['category']: b['amount'] for b in budgets})

@app.route('/api/budget', methods=['POST'])
def set_budget():
    data = request.json
    db = get_db()
    db.execute('DELETE FROM budgets')
    for category, amount in data.items():
        db.execute('INSERT INTO budgets (category, amount) VALUES (?, ?)', (category, amount))
    db.commit()
    budgets = db.execute('SELECT * FROM budgets').fetchall()
    return jsonify({b['category']: b['amount'] for b in budgets}), 201

@app.route('/api/stats', methods=['GET'])
def get_stats():
    db = get_db()
    income = db.execute('SELECT SUM(amount) FROM transactions WHERE type = "income"').fetchone()[0] or 0
    expenses = db.execute('SELECT SUM(amount) FROM transactions WHERE type = "expense"').fetchone()[0] or 0
    balance = income - expenses

    categories = {}
    for row in db.execute('SELECT category, SUM(amount) as total FROM transactions WHERE type = "expense" GROUP BY category'):
        categories[row['category']] = row['total']

    return jsonify({
        'balance': balance,
        'income': income,
        'expenses': expenses,
        'categories': categories
    })

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
