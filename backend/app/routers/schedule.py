# app/routers/schedule.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime
import traceback

from app.services.gsheets import load_data, save_data

router = APIRouter(prefix="/schedule", tags=["Schedule"])


class StatusUpdate(BaseModel):
    activity_id: str
    status: str  # Expected: "Done", "Pending", etc.


@router.get("/daily/{mr_id}/{date}", response_model=List[Dict[str, Any]])
def get_daily_schedule(mr_id: str, date: str):
    """
    Fetch all scheduled activities for a specific MR on a given date.
    Example: GET /schedule/daily/MR_W2_2/2026-01-23
    """
    print(f"[SCHEDULE GET] Requested for mr_id='{mr_id}', date='{date}'")

    try:
        df = load_data("Master_Schedule")
        print(f"[SCHEDULE GET] Master_Schedule rows loaded: {len(df)}")

        if df.empty:
            print("[SCHEDULE GET] Master_Schedule is empty")
            return []

        # Normalize columns for safe comparison
        if 'mr_id' in df.columns:
            df['mr_id'] = df['mr_id'].astype(str).str.strip()
        if 'date' in df.columns:
            df['date'] = df['date'].astype(str).str.strip()
        
        # Filter Logic
        # Special case: if mr_id is 'ADMIN' or 'admin', show ALL activities for that date
        if mr_id.lower() == 'admin':
             filtered = df[df['date'] == date.strip()]
        else:
            filtered = df[
                (df['mr_id'] == mr_id.strip()) &
                (df['date'] == date.strip())
            ]

        print(f"[SCHEDULE GET] Filtered rows: {len(filtered)}")

        # Deduplicate to prevent multiple cards for same activity
        if 'activity_id' in filtered.columns:
            filtered = filtered.drop_duplicates(subset=['activity_id'])

        # --- Safe Contacts merge (phone & segment) ---
        contacts = load_data("Contacts")
        if not contacts.empty:
            # print("[SCHEDULE GET] Contacts loaded")

            phone_col = None
            segment_col = None

            # Phone column search
            phone_keywords = ['phone', 'mobile', 'contact', 'tel', 'cell', 'number']
            for col in contacts.columns:
                lower = col.lower().strip()
                if any(kw in lower for kw in phone_keywords):
                    phone_col = col
                    break

            # Segment column search
            segment_keywords = ['segment', 'category', 'type', 'group', 'class']
            for col in contacts.columns:
                lower = col.lower().strip()
                if any(kw in lower for kw in segment_keywords):
                    segment_col = col
                    break

            # Apply merge only if columns exist and Contact_id is present
            if 'customer_id' in filtered.columns and 'Contact_id' in contacts.columns:
                if phone_col:
                    try:
                        contacts_dict = contacts.set_index('Contact_id')[phone_col].to_dict()
                        filtered['phone'] = filtered['customer_id'].map(contacts_dict).fillna('N/A')
                    except Exception as e:
                        print(f"[WARNING] Phone merge failed: {e}")
                        filtered['phone'] = 'N/A'
                else:
                    filtered['phone'] = 'N/A'

                if segment_col:
                    try:
                        contacts_dict = contacts.set_index('Contact_id')[segment_col].to_dict()
                        filtered['segment'] = filtered['customer_id'].map(contacts_dict).fillna('General')
                    except Exception as e:
                        print(f"[WARNING] Segment merge failed: {e}")
                        filtered['segment'] = 'General'
                else:
                    filtered['segment'] = 'General'
            else:
                 # If customer_id missing in schedule or Contact_id missing in contacts
                 filtered['phone'] = 'N/A'
                 filtered['segment'] = 'General'
        else:
            print("[SCHEDULE GET] Contacts sheet is empty")
            filtered['phone'] = 'N/A'
            filtered['segment'] = 'General'
            
        # Nan handling for JSON
        filtered = filtered.fillna('')

        # Return result
        return filtered.to_dict(orient="records")

    except Exception as e:
        print(f"[SCHEDULE GET ERROR] {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.put("/status")
def update_status(update: StatusUpdate):
    """
    Update task status (used by drag & drop + buttons).
    """
    print(f"[STATUS PUT] START - activity_id='{update.activity_id}', status='{update.status}'")

    try:
        df = load_data("Master_Schedule")
        
        if df.empty:
            raise HTTPException(status_code=404, detail="Master_Schedule is empty - no tasks to update")

        # 1. Check / normalize activity_id column
        if 'activity_id' not in df.columns:
            raise HTTPException(status_code=500, detail="Column 'activity_id' missing in Master_Schedule sheet")

        df['activity_id'] = df['activity_id'].astype(str).str.strip()

        mask = df['activity_id'] == update.activity_id.strip()
        if not mask.any():
            raise HTTPException(status_code=404, detail=f"Activity ID '{update.activity_id}' not found")

        # 2. Add 'status' column if missing (prevents KeyError)
        if 'status' not in df.columns:
            df['status'] = 'Pending'

        # 3. Update status
        df.loc[mask, 'status'] = update.status

        # 4. Save
        # IMPORTANT: Fix NaNs before saving
        df = df.fillna('')
        save_data(df, "Master_Schedule")

        return {"message": f"Task {update.activity_id} updated to {update.status}"}

    except Exception as e:
        print(f"[STATUS PUT CRASH] {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")