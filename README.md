# MR Portal (Medical Representative Management System)

A comprehensive full-stack application designed to streamline the daily operations of Medical Representatives. This portal allows MRs to manage their schedules, track visits, and visualize their routes, while providing administrators with powerful insights through detailed reports and analytics.

## 🚀 Key Features

*   **Interactive Dashboard**: Real-time overview of daily activities (Planned, Completed, Cancelled) with KPI cards.
*   **Smart Scheduling**: View and manage daily client visits with an intuitive interface.
*   **Route Visualization**: Integrated Leaflet maps to visualize the daily route and client locations.
*   **Admin Console**: Centralized management for administrators to oversee MR performance and schedules.
*   **Comprehensive Reports**:
    *   Activity Reports
    *   Compliance & Coverage
    *   Customer Behavior Analytics
    *   Travel & Distance Tracking
*   **Responsive Design**: Built with a mobile-first approach using modern UI/UX principles.

## 🛠️ Technology Stack

### Frontend
*   **Framework**: [React](https://react.dev/) (powered by [Vite](https://vitejs.dev/))
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Maps**: [React Leaflet](https://react-leaflet.js.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Navigation**: React Router DOM
*   **State Management**: Context API

### Backend
*   **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Data Processing**: Pandas
*   **Machine Learning**: XGBoost / Scikit-learn (for analytics/predictions)
*   **Server**: Uvicorn

## 📂 Project Structure

```bash
mr-project/
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/   # Reusable UI components (Sidebar, MapView, Cards)
│   │   ├── pages/        # Application pages (Dashboard, Reports, Login)
│   │   ├── context/      # Auth and application state
│   │   └── lib/          # API clients and utilities
│   └── public/
│
└── backend/              # FastAPI Application
    ├── app/
    │   ├── routers/      # API endpoints (schedule, admin, reports)
    │   ├── services/     # Business logic & DB interactions
    ├── scripts/          # Utility scripts (data seeding, maintenance)
    └── supabase_schema.sql  # Database schema definition
