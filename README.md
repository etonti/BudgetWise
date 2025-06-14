# BudgetWise - Gestion de budget intelligent

## Présentation du projet

BudgetWise est une application web complète de gestion financière personnelle offrant des outils avancés pour suivre et optimiser vos finances.

### Fonctionnalités principales
- **Gestion des transactions** :
  - Ajout/modification/suppression
  - Catégorisation et tags
  - Filtres avancés

- **Analyse financière** :
  - Tableau de bord complet
  - Alertes intelligentes
  - Bilan mensuel exportable

- **Visualisation** :
  - Graphique des dépenses
  - Historique mensuel
  - Comparaison budget/réel

### Nouveautés
- 2 nouveaux graphiques
- Export PDF automatique

## Technologies

### Backend
- Flask (Python)
- SQLite/JSON
- PDFKit

### Frontend
- HTML/CSS/JS
- Chart.js
- CSS Variables

### Infrastructure
- **CI**: Python CI (tests automatisés)
- Hébergement: Render
- Monitoring: Sentry

## Démo

[![Démo Live](https://img.shields.io/badge/Démo-Live-success)](https://budgetwise-zntb.onrender.com)

## Code

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/etonti/BudgetWise)

## Installation

```bash
git clone https://github.com/etonti/BudgetWise
cd BudgetWise/backend
pip install -r requirements.txt
flask run#
