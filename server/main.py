# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import router as api_router
from auth import router as auth_router
from mailhelper import send_email


app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router
app.include_router(api_router)
app.include_router(auth_router)

# Created a Simple File Server
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


