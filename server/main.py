# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router as api_router

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