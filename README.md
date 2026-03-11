
# MR Portal 🏥

> A complete full-stack platform designed for Medical Representative scheduling and management, leveraging hybrid AI algorithms and real-time routing to create optimized daily visit plans.

---

# 📖 Project Overview

## The Problem

Planning and managing daily schedules for medical representatives across large geographic territories is highly challenging. When schedules are created manually, it often results in inefficient routing, missed high-priority contacts, and poor time utilization. These inefficiencies negatively impact engagement levels and sales performance.

## Why It Was Built

MR Portal was developed to automate and streamline this scheduling challenge. The system combines structured business rules with machine learning (XGBoost) and real-world road distance calculations using the OSRM API. This hybrid approach allows organizations to generate deterministic, data-driven schedules that improve operational efficiency.

## Real-World Use Case

In pharmaceutical or medical device companies, territories are typically assigned to individual Medical Representatives. With MR Portal, administrators can automatically generate an entire month’s visit schedule for all representatives in a single action.

The system intelligently prioritizes high-value doctors, clusters visits geographically, incorporates real-world road distances and travel times, and ensures that each MR's schedule fits within standard working hours.

---

# ✨ Key Features

* **Hybrid AI Scheduling Algorithm:** Combines business-rule scoring with an XGBoost machine learning model to prioritize contacts based on engagement status, previous visits, and geographic patterns.
* **Intelligent Route Optimization:** Uses the Open Source Routing Machine (OSRM) API to calculate realistic road distances and driving times between locations.
* **Interactive Map Dashboard:** Displays planned, completed, and cancelled visits in real-time through a React-Leaflet interactive map interface.
* **Advanced Reporting System:** Produces detailed reports on compliance, travel activity, and customer engagement, with simple one-click CSV export functionality.
* **Role-Based Access Control:** Provides separate workflows and dashboards tailored for Medical Representatives (task execution) and Admin users (schedule generation, analytics, and data monitoring).

---

# 🏗️ System Architecture

The platform follows a modern **decoupled client-server architecture**.

### Frontend (Client Layer)

The frontend is implemented as a dynamic React Single Page Application built with Vite and styled using Tailwind CSS. It communicates with backend services through secure REST APIs and visualizes route information through Leaflet-based interactive maps.

### Backend (API Layer)

The backend is powered by a FastAPI server running on Uvicorn. It manages multiple API routers, JWT-based authentication, and hosts the core AI-powered scheduling logic responsible for generating optimized visit plans.

### Database (Data Layer)

Supabase (PostgreSQL) serves as the main database system. Strict Row-Level Security policies are applied to ensure safe data access and scalable isolation across central tables such as `users`, `contacts`, `activities`, and `master_schedule`.

### External Dependencies

* **XGBoost** is used for predictive machine learning scoring.
* **OSRM API** is used for road-distance calculations and routing logic.

---

# 💻 Technical Stack

## Programming Languages

Python, JavaScript, SQL

## Frontend

* React 19 / Vite
* Tailwind CSS (UI styling)
* React Router (Client-side navigation)
* React-Leaflet & Leaflet (Map visualization)
* dnd-kit (Drag-and-drop Kanban functionality)

## Backend

* Python 3.9+
* FastAPI & Uvicorn (REST API development)
* Supabase (PostgreSQL database)
* Pandas (data manipulation and matrix processing)
* PyJWT (authentication handling)

## Machine Learning & Infrastructure

* XGBoost & Scikit-learn (Machine learning scoring models)
* OSRM API (road distance and routing engine)

---

# 🧠 AI / ML Details

The platform’s intelligence is driven by a carefully designed **9-step scheduling pipeline** that uses a hybrid scoring mechanism.

### Models Used

The system employs an **XGBoost regression model** that is trained dynamically during the scheduling process.

### Feature Engineering

Several engineered features are used for prioritization, including:

* LabelEncoded business segments
* Engagement status indicators
* Historical referral metrics
* Lifetime visit counts
* Visit frequency over the previous 90 days
* Geographic clustering features using latitude and longitude

### Training Pipeline

The process begins with a deterministic rule-based scoring system that assigns points based on business priorities, such as neglected contacts or strategic referral segments.

These rule-based scores are then used as training labels for the XGBoost model. This enables the model to capture complex non-linear relationships and geographic proximity patterns that may not be detected through static rules alone.

### Evaluation & Optimization

The final prioritization score is calculated through a **50/50 combination** of the rule-based score and the prediction generated by the XGBoost model.

The highest priority contacts are then ordered using OSRM routing to ensure travel times are realistic and the schedule strictly adheres to operational working hours between **10:00 AM and 7:00 PM**.

---

# 📂 Project Structure

```
mr-project/
├── backend/
│   ├── app/
│   │   ├── routers/        # API endpoints (authentication, scheduling, reports, admin)
│   │   ├── services/       # Core ML scheduling logic, routing modules, and database services
│   │   └── main.py         # FastAPI application entry point
│   ├── scripts/            # Data seed scripts, ML simulators, migration utilities
│   ├── requirements.txt    # Python dependency list
│   └── supabase_schema.sql # Database schema definition
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Map, Kanban board, Sidebar)
│   │   ├── pages/          # Application views (Dashboard, Reports, Admin)
│   │   └── lib/            # API integration utilities
│   ├── package.json        # Node dependencies
│   └── tailwind.config.js  # Tailwind configuration
└── README.md
```

---

# 🚀 Installation Guide

## Prerequisites

* Node.js (v18 or higher)
* Python (v3.9 or higher)
* Supabase account

---

## 1. Database Setup

Execute the SQL script located at `backend/supabase_schema.sql` within the Supabase SQL Editor. This will create the required tables and configure the necessary Row-Level Security policies.

---

## 2. Backend Setup

```bash
# Move into the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Configure environment variables
echo SUPABASE_URL=your_supabase_url > .env
echo SUPABASE_KEY=your_supabase_anon_key >> .env

# Start the FastAPI server
uvicorn app.main:app --reload
```

The backend service will run at:

```
http://localhost:8000
```

---

## 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend application will be accessible at:

```
http://localhost:5173
```

---

# 💡 Usage

## Generating Schedules (Admin Workflow)

1. Log in to the platform using the admin credentials
   **Username:** ADMIN
   **Password:** ADMIN
2. Open the **Admin Console** section.
3. Click **Generate Schedule**. The FastAPI backend will process all zone contacts, calculate priority scores using XGBoost, determine travel routes through OSRM, and generate optimized daily itineraries for the next 30 days.
4. Review the generated schedule in the **Master_Schedule Dataset Inspector**.

![Schedule Generation Process](schedule%20generation.png)

---

## Daily MR Workflow

1. Log in using your assigned Medical Representative credentials.
2. Access the **Dashboard** to view your optimized route displayed dynamically on the Leaflet map interface.
3. Update task progress using the drag-and-drop Kanban board (Planned → Completed).
4. Monitor your historical performance, travel statistics, and compliance metrics through the **Reports** section.

---

## Example API Request

You can retrieve the detailed schedule for a specific MR programmatically using the following request:

```bash
curl -X GET "http://localhost:8000/schedule/daily/MR_W1_1/2023-10-25" \
     -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Application Outputs (Placeholder)

*(Insert screenshots demonstrating the Map Dashboard, Kanban Task Board, Reports Interface, and Admin Dataset Inspector to provide visual context for the application.)*

---

*Engineered for scalability. Designed for operational efficiency.*

---
