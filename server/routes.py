# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException
import librosa
import numpy as np
import io
from database import get_db, return_db

router = APIRouter()

@router.post("/uploadFFT/")
async def upload_fft(file: UploadFile = File(...)):
    # Read the uploaded file as bytes
    audio_data = await file.read()

    # Print the length of the received audio data in megabytes
    data_length_mb = len(audio_data) / (1024 * 1024)
    file_name = file.filename
    print(f"Received file: {file_name}, size: {data_length_mb:.2f} MB")

    # Process the audio file
    try:
        # Load the audio file
        y, sr = librosa.load(io.BytesIO(audio_data), sr=4500)
        
        y_harmonic, y_percussive = librosa.effects.hpss(y)

        # Compute STFT with specific parameters on the audio signal
        hop_length = 64  # Number of samples between successive frames
        n_fft = 2048  # Length of the FFT window
        stft = librosa.stft(y_harmonic, n_fft=n_fft, hop_length=hop_length, window="hann")
        stft_magnitude = np.abs(stft)
        stft_db = librosa.amplitude_to_db(stft_magnitude, ref=np.max)
        
        
        
        # Convert the STFT data to a list of lists for JSON serialization
        stft_data = stft_db.tolist()

        return stft_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
@router.get("/helloworld")
async def read_helloworld():
    return {"message": "Hello, World!"}

@router.get("/testDB")
def test_db_connection():
    db = None
    try:
        db = get_db()
        with db.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                return {"message": "Database connection successful"}
            else:
                raise HTTPException(status_code=500, detail="Database connection failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if db:
            return_db(db)