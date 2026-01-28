# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Dcom MR Scheduling", version="2.0")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.routers import auth, schedule, reports, admin
app.include_router(auth.router)
app.include_router(schedule.router)
app.include_router(reports.router)
app.include_router(admin.router)

@app.get("/")
def home():
    return {"message": "Dcom API Running - Made by Yash in Ahmedabad ❤️"}