# app/services/gsheets.py
import os
import pandas as pd
from google.oauth2 import service_account
import gspread

# Load credentials from secrets.toml (or .env, but toml is fine)
from toml import load as toml_load

secrets_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'secrets.toml')
secrets = toml_load(secrets_path)['connections']['gsheets']

credentials = service_account.Credentials.from_service_account_info(
    {
        "type": secrets["type"],
        "project_id": secrets["project_id"],
        "private_key_id": secrets["private_key_id"],
        "private_key": secrets["private_key"],
        "client_email": secrets["client_email"],
        "client_id": secrets["client_id"],
        "auth_uri": secrets["auth_uri"],
        "token_uri": secrets["token_uri"],
        "auth_provider_x509_cert_url": secrets["auth_provider_x509_cert_url"],
        "client_x509_cert_url": secrets["client_x509_cert_url"],
    },
    scopes=["https://www.googleapis.com/auth/spreadsheets"],
)

gc = gspread.authorize(credentials)
spreadsheet = gc.open_by_url(secrets["spreadsheet"])

def load_data(worksheet_name: str) -> pd.DataFrame:
    """Load data from a worksheet into a pandas DataFrame"""
    try:
        worksheet = spreadsheet.worksheet(worksheet_name)
        data = worksheet.get_all_records()
        df = pd.DataFrame(data)
        if not df.empty:
            df = df.dropna(how='all')
        return df
    except Exception as e:
        print(f"Error loading sheet '{worksheet_name}': {e}")
        return pd.DataFrame()

def save_data(df: pd.DataFrame, worksheet_name: str):
    """Save DataFrame to a worksheet (overwrites existing data)"""
    try:
        worksheet = spreadsheet.worksheet(worksheet_name)
        # Clear existing data
        worksheet.clear()
        # Write headers
        worksheet.append_row(df.columns.tolist())
        # Write data rows
        worksheet.append_rows(df.values.tolist())
        print(f"Saved data to sheet '{worksheet_name}'")
    except Exception as e:
        print(f"Error saving to sheet '{worksheet_name}': {e}")