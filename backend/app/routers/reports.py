# app/routers/reports.py
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, timedelta

from app.services.supabase_db import load_data

router = APIRouter(prefix="/reports", tags=["Reports"])

# In app/routers/reports.py
# @router.get("/activity")
# def get_activity_report(start_date: str, end_date: str, mr_id: Optional[str] = None):
#     print(f"[ACTIVITY REPORT] START - start={start_date}, end={end_date}, mr_id={mr_id or 'all'}")

#     try:
#         df = load_data("Master_Schedule")
#         print(f"[ACTIVITY] Loaded rows: {len(df)}, columns: {list(df.columns)}")

#         if df.empty:
#             return {"data": [], "total_activities": 0}

#         # Safe date conversion with dayfirst=True (handles DD-MM-YYYY)
#         df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
#         df = df.dropna(subset=['date'])

#         if mr_id:
#             if 'mr_id' in df.columns:
#                 df['mr_id'] = df['mr_id'].astype(str).str.strip()
#                 df = df[df['mr_id'] == mr_id.strip()]
#             print(f"[ACTIVITY] After MR filter rows: {len(df)}")

#         start = pd.to_datetime(start_date, dayfirst=True)
#         end = pd.to_datetime(end_date, dayfirst=True)

#         filtered = df[(df['date'] >= start) & (df['date'] <= end)]
#         print(f"[ACTIVITY] Filtered rows after date range: {len(filtered)}")

#         if filtered.empty:
#             return {"data": [], "total_activities": 0}

#         grouped = filtered.groupby(filtered['date'].dt.date).size().reset_index(name='activity_count')
#         grouped['date'] = grouped['date'].dt.strftime('%Y-%m-%d')
#         grouped = grouped.sort_values('date')

#         total = grouped['activity_count'].sum()

#         return {
#             "data": grouped[['date', 'activity_count']].to_dict(orient="records"),
#             "total_activities": int(total)
#         }

#     except Exception as e:
#         print(f"[ACTIVITY CRASH] {type(e).__name__}: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
@router.get("/activity")
def get_activity_report(start_date: str, end_date: str, mr_id: Optional[str] = None):
    print(f"[ACTIVITY REPORT] START - start={start_date}, end={end_date}, mr_id={mr_id or 'all'}")

    try:
        df = load_data("Master_Schedule")
        print(f"[ACTIVITY] Loaded {len(df)} rows, columns: {list(df.columns)}")

        if df.empty:
            print("[ACTIVITY] Sheet is empty")
            return {"data": [], "total_activities": 0, "completed_activities": 0}

        # Ensure required columns exist
        if 'date' not in df.columns:
            raise HTTPException(status_code=500, detail="Missing 'date' column in Master_Schedule")

        # Clean date column as string first
        df['date'] = df['date'].astype(str).str.strip()

        # Convert to datetime with multiple fallback formats
        df['date'] = pd.to_datetime(
            df['date'],
            errors='coerce',
            format='%Y-%m-%d',
            exact=False
        )

        # Fallback for DD-MM-YYYY or other formats
        if df['date'].isna().sum() > len(df) * 0.5:
            df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)

        # Drop rows with invalid dates
        df = df.dropna(subset=['date'])

        # MR filter
        if mr_id:
            if 'mr_id' in df.columns:
                df = df[df['mr_id'].astype(str).str.strip() == mr_id.strip()]
            else:
                print("[ACTIVITY] No 'mr_id' column - ignoring MR filter")

        # Date range filter
        start = pd.to_datetime(start_date, dayfirst=True)
        end = pd.to_datetime(end_date, dayfirst=True)

        filtered = df[(df['date'] >= start) & (df['date'] <= end)]
        print(f"[ACTIVITY] After date filter: {len(filtered)} rows")

        # Deduplicate to prevent double counting (same as Dashboard logic)
        if 'activity_id' in filtered.columns:
            filtered = filtered.drop_duplicates(subset=['activity_id'])
            print(f"[ACTIVITY] After deduplication: {len(filtered)} rows")

        if filtered.empty:
            return {"data": [], "total_activities": 0, "completed_activities": 0}

        # Completed activities count (Overall for the period)
        completed = filtered[filtered['status'].astype(str).str.strip().isin(['Done', 'Completed', 'done', 'completed'])]
        completed_count = len(completed)

        # Group by date - SAFE way (no .dt crash)
        # We aggregate to get both total count and completed count per day
        # Helper to count completed
        def count_completed(series):
            return series.astype(str).str.strip().str.lower().isin(['done', 'completed']).sum()

        grouped = (
            filtered.groupby(filtered['date'].dt.floor('D'))
            .agg({
                'activity_id': 'size', # Total activities
                'status': count_completed # Completed activities
            })
            .reset_index()
        )
        grouped.rename(columns={'activity_id': 'activity_count', 'status': 'completed_activity_count'}, inplace=True)
        
        grouped['date'] = grouped['date'].dt.strftime('%Y-%m-%d')
        grouped = grouped.sort_values('date')

        total = grouped['activity_count'].sum()

        print(f"[ACTIVITY] SUCCESS - Total: {total}, Completed: {completed_count}")

        return {
            "data": grouped[['date', 'activity_count', 'completed_activity_count']].to_dict(orient="records"),
            "total_activities": int(total),
            "completed_activities": completed_count
        }

    except Exception as e:
        print(f"[ACTIVITY CRASH] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))    
@router.get("/compliance", response_model=List[Dict[str, Any]])
def get_compliance_report(month: int, year: int, mr_id: Optional[str] = None):
    """
    Compliance report for a month/year.
    Params: month (1-12), year (e.g. 2026), mr_id (optional)
    """
    try:
        df = load_data("Master_Schedule")
        if df.empty:
            return []

        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        start = datetime(year, month, 1)
        end = (start + timedelta(days=31)).replace(day=1) - timedelta(days=1)

        filtered = df[(df['date'] >= start) & (df['date'] <= end)]

        if mr_id:
            filtered = filtered[filtered['mr_id'] == mr_id]

        # Group by customer
        grouped = filtered.groupby('customer_name').agg({
            'date': 'nunique'  # No. of Dates
        }).reset_index()

        grouped['monthly_range'] = f"{start.strftime('%d-%m-%Y')} - {end.strftime('%d-%m-%Y')}"
        grouped['compliance_dates'] = grouped['date']  # Adjust logic if needed
        grouped['sr_no'] = range(1, len(grouped) + 1)

        return grouped.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customer-behaviour", response_model=List[Dict[str, Any]])
def get_customer_behaviour_report(month: int, year: int, mr_id: Optional[str] = None):
    """
    Customer behaviour report for a month/year.
    Params: month (1-12), year (e.g. 2026), mr_id (optional)
    """
    try:
        df = load_data("Master_Schedule")
        if df.empty:
            return []

        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        start = datetime(year, month, 1)
        end = (start + timedelta(days=31)).replace(day=1) - timedelta(days=1)

        filtered = df[(df['date'] >= start) & (df['date'] <= end)]

        if mr_id:
            filtered = filtered[filtered['mr_id'] == mr_id]

        # Pivot by day of week
        filtered['day_of_week'] = filtered['date'].dt.day_name()
        pivot = pd.pivot_table(
            filtered,
            index='customer_name',
            columns='day_of_week',
            values='activity_id',
            aggfunc='count',
            fill_value=0
        )

        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        pivot = pivot.reindex(columns=days, fill_value=0)
        pivot['total_activities'] = pivot.sum(axis=1)

        pivot.reset_index(inplace=True)
        pivot['sr_no'] = range(1, len(pivot) + 1)

        return pivot.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/travel", response_model=List[Dict[str, Any]])
def get_travel_report(month: int, year: int, mr_id: Optional[str] = None):
    """
    Travel km report for a month/year.
    Params: month (1-12), year (e.g. 2026), mr_id (optional)
    """
    try:
        df = load_data("Master_Schedule")
        if df.empty:
            return []

        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        start = datetime(year, month, 1)
        end = (start + timedelta(days=31)).replace(day=1) - timedelta(days=1)

        filtered = df[(df['date'] >= start) & (df['date'] <= end)]

        if mr_id:
            filtered = filtered[filtered['mr_id'] == mr_id]

        # Group by date
        grouped = filtered.groupby('date').agg({
            'distance_km': 'sum'  # Total distance per day
        }).reset_index()

        grouped['sr_no'] = range(1, len(grouped) + 1)
        grouped['date'] = grouped['date'].dt.strftime('%Y-%m-%d')
        grouped['travel_distance_km'] = grouped['distance_km'].round(2)
        grouped['actions'] = 'View'  # Placeholder for frontend button

        return grouped.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))