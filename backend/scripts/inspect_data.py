
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Fetch first 10 rows of master_schedule
print("--- Printing first 5 rows of master_schedule ---")
try:
    res = supabase.table("master_schedule").select("mr_id, date, customer_name").limit(5).execute()
    for row in res.data:
        print(row)
        
    # Check distinct MR_IDs (not easily doable in Supabase API without RPC, so just searching for 'MR')
    print("\n--- Searching for 'MR' in mr_id column ---")
    res_mr = supabase.table("master_schedule").select("*").ilike("mr_id", "%MR%").limit(5).execute()
    print(f"Found {len(res_mr.data)} rows matching '%MR%'")
    if res_mr.data:
        print(f"Sample: {res_mr.data[0]['mr_id']}")

except Exception as e:
    print(e)
