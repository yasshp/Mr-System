
# app/routers/schedule.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime
import traceback

from app.services.supabase_db import load_data, save_data, supabase

router = APIRouter(prefix="/schedule", tags=["Schedule"])


class StatusUpdate(BaseModel):
    activity_id: str
    status: str  # Expected: "Done", "Pending", etc.


@router.get("/daily/{mr_id}/{date}", response_model=List[Dict[str, Any]])
def get_daily_schedule(mr_id: str, date: str):
    """
    Fetch all scheduled activities for a specific MR on a given date.
    Uses efficient DB-side filtering.
    """
    print(f"[SCHEDULE GET] Requested for mr_id='{mr_id}', date='{date}'")

    try:
        if not supabase:
             raise HTTPException(status_code=500, detail="Database connection failed")

        # 1. Efficient DB Filter
        query = supabase.table("master_schedule").select("*")
        
        # Handle Admin requesting ALL data for a date
        if mr_id.lower() != 'admin':
            query = query.eq("mr_id", mr_id)
            
        query = query.eq("date", date)
        
        response = query.execute()
        data = response.data
        
        if not data:
            print("[SCHEDULE GET] No tasks found in DB query.")
            return []

        df = pd.DataFrame(data)
        print(f"[SCHEDULE GET] DB returned {len(df)} rows")

        # Deduplicate to prevent multiple cards for same activity
        if 'activity_id' in df.columns:
            df = df.drop_duplicates(subset=['activity_id'])

        # --- Safe Contacts merge (phone & segment) ---
        # Note: Ideally this should also be a DB JOIN, but preserving legacy logic for now
        # Fetching entire contacts table is less risky (usually < 1000 contacts), 
        # but strictly speaking we should fix this too. 
        # For now, let's keep it as is since Contacts is usually smaller than Schedule.
        contacts = load_data("Contacts")
        if not contacts.empty:
            
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

            # Apply merge only if columns exist and customer_id is present
            if 'customer_id' in df.columns and 'contact_id' in contacts.columns: 
                # Note: Supabase likely returns 'contact_id' (lowercase) not 'Contact_id'
                
                # Normalize Contact DF keys
                contacts.columns = [c.lower() for c in contacts.columns]
                
                if phone_col and phone_col.lower() in contacts.columns:
                    try:
                        contacts_dict = contacts.set_index('contact_id')[phone_col.lower()].to_dict()
                        df['phone'] = df['customer_id'].map(contacts_dict).fillna('N/A')
                    except Exception as e:
                        print(f"[WARNING] Phone merge failed: {e}")
                        df['phone'] = 'N/A'
                else:
                    df['phone'] = 'N/A'

                if segment_col and segment_col.lower() in contacts.columns:
                    try:
                        contacts_dict = contacts.set_index('contact_id')[segment_col.lower()].to_dict()
                        df['segment'] = df['customer_id'].map(contacts_dict).fillna('General')
                    except Exception as e:
                        print(f"[WARNING] Segment merge failed: {e}")
                        df['segment'] = 'General'
                else:
                    df['segment'] = 'General'
            else:
                 df['phone'] = 'N/A'
                 df['segment'] = 'General'
        else:
            df['phone'] = 'N/A'
            df['segment'] = 'General'
            
        # Nan handling for JSON
        df = df.fillna('')

        # Return result
        return df.to_dict(orient="records")

    except Exception as e:
        print(f"[SCHEDULE GET ERROR] {type(e).__name__}: {str(e)}")
        # Dump trace for debugging
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@router.put("/status")
def update_status(update: StatusUpdate):
    """
    Update task status (used by drag & drop + buttons).
    Uses efficient DB-side update.
    """
    print(f"[STATUS PUT] START - activity_id='{update.activity_id}', status='{update.status}'")

    try:
        # Direct DB Update
        response = supabase.table("master_schedule").update({"status": update.status}).eq("activity_id", update.activity_id).execute()
        
        if not response.data:
             raise HTTPException(status_code=404, detail=f"Activity ID '{update.activity_id}' not found or update failed")

        return {"message": f"Task {update.activity_id} updated to {update.status}"}

    except Exception as e:
        print(f"[STATUS PUT CRASH] {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")