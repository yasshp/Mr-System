# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Dcom MR Scheduling", version="2.0")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for now to ensure Vercel frontend can connect
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
    return {"message": ""}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MR System API")

# Add CORS middleware - allow your Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mrsystem.vercel.app",          # your live URL
        "http://localhost:5173",                 # for local dev (Vite default port)
        "*"                                      # temporary: allow all (for testing only - remove later)
    ],
    allow_credentials=True,
    allow_methods=["*"],                         # allow GET, POST, PUT, DELETE, OPTIONS
    allow_headers=["*"],                         # allow all headers
)

# Your existing routes
# from app.routers import admin, reports, auth
# app.include_router(admin.router)
# app.include_router(reports.router)
# app.include_router(auth.router)

# Test endpoint to confirm CORS works
@app.get("/test")
def test():
    return {"message": "CORS is working!"}    