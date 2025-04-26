# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/routes.py
from fastapi import APIRouter, File, UploadFile, HTTPException, Form, Request
import librosa
import numpy as np
import io
import jax.numpy as jnp
import jax.scipy.signal as jax_signal
from database import get_db, return_db
import msgpack
from starlette.responses import Response
import zlib
from scipy.interpolate import CubicSpline
from jose import jwt, JWTError
from uuid import uuid4
from crud import get_user_by_email
from starlette.responses import JSONResponse
import os
from auth import SECRET_KEY, ALGORITHM

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

SAMPLE_RATE = 8192
HOP_LENGTH = 916
FFT_WINDOW = 2048

def hpss(stft_matrix, kernel_size=31):
    """Extract only the harmonic component using Librosa's median filter."""
    harmonic_stft = librosa.decompose.median_filter(np.abs(stft_matrix), size=(1, kernel_size))
    
    harmonic_stft = harmonic_stft * np.exp(1j * np.angle(stft_matrix))  # Keep phase
    return harmonic_stft

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
        y, sr = librosa.load(io.BytesIO(audio_data), sr=SAMPLE_RATE)
        
        # y_preemphasized = librosa.effects.preemphasis(y)
        # y_harmonic, _ = librosa.effects.hpss(y_preemphasized)  # not using percussive component

        stft = librosa.stft(y, n_fft=FFT_WINDOW, hop_length=HOP_LENGTH, window="hann")
        stft_magnitude = np.abs(stft)
        stft_db = librosa.amplitude_to_db(stft_magnitude, ref=np.max)
        stft_db = stft_db.astype(np.float16)  # Convert to float16

        # Create a frequency bin array for interpolation
        frequencies = librosa.fft_frequencies(sr=SAMPLE_RATE, n_fft=FFT_WINDOW)

        # Define the frequency range from C5 to C7 (or any specific bins you want to interpolate)
        c5_freq = librosa.note_to_hz('C5')  # C5 frequency in Hz
        c7_freq = librosa.note_to_hz('C7')  # C7 frequency in Hz

        # Find the frequency bin indices that correspond to C5 and C7
        c5_idx = np.argmin(np.abs(frequencies - c5_freq))
        c7_idx = np.argmin(np.abs(frequencies - c7_freq))

        # Extract the part of the STFT that we want to interpolate (between C5 and C7)
        stft_db_range = stft_db[c5_idx:c7_idx]

        # Create an array of the indices to interpolate
        freq_range = np.linspace(c5_idx, c7_idx - 1, stft_db_range.shape[0])

        # Apply cubic spline interpolation
        cubic_spline = CubicSpline(freq_range, stft_db_range, axis=0)
        
        # Interpolate the data between C5 and C7
        stft_db_interpolated = cubic_spline(np.arange(c5_idx, c7_idx))

        # Replace the interpolated values back into the original STFT data
        stft_db[c5_idx:c7_idx] = stft_db_interpolated

        # Convert the STFT data to a list of lists for JSON serialization
        stft_data = stft_db.tolist()
        
        # Convert STFT to MessagePack
        packed_data = msgpack.packb(stft_data, use_bin_type=True)
        compressed_data = zlib.compress(packed_data)
        return Response(content=compressed_data, media_type="application/x-msgpack")
  

    except Exception as e:
        print(f"Error: {str(e)}")  # Add a print statement here for logging the error
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/uploadFFTjax/")
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
        y, sr = librosa.load(io.BytesIO(audio_data), sr=SAMPLE_RATE)
        
        
        y_harmonic_jax = jnp.array(y)

        # Compute STFT using JAX
        f, t, Zxx = jax_signal.stft(
            y_harmonic_jax, 
            fs=SAMPLE_RATE, 
            nperseg=FFT_WINDOW, 
            noverlap=FFT_WINDOW - HOP_LENGTH, 
            window="hann", 
            boundary=None
        )

        # Compute magnitude and convert to dB
        stft_magnitude = jnp.abs(Zxx)  # Magnitude spectrogram
        stft_db = librosa.amplitude_to_db(np.array(stft_magnitude), ref=np.max)  # Convert to dB
        stft_db = stft_db.astype(np.float16)  # Convert to float16

        # Convert the STFT data to a list of lists for JSON serialization
        stft_data = stft_db.tolist()

        # Convert STFT to MessagePack
        packed_data = msgpack.packb(stft_data, use_bin_type=True)
        compressed_data = zlib.compress(packed_data)
        return Response(content=compressed_data, media_type="application/x-msgpack")

    except Exception as e:
        print(f"Error: {str(e)}")  # Add a print statement here for logging the error
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
            
            
@router.post("/create-new-project")
async def create_new_project(
    request: Request,
    file: UploadFile,
    name: str = Form(...)
):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        access_token = token.split(" ")[1]
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_id = user["id"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Save file
    file_id = str(uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    song_url = f"/uploads/{filename}"

    # Save to DB
    project_id = str(uuid4())
    connection = get_db()
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO projects (id, user_id, name, song_url)
            VALUES (%s, %s, %s, %s)
        """, (project_id, user_id, name, song_url))
        connection.commit()
    except Exception as e:
        print("DB insert error:", e)
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        cursor.close()
        return_db(connection)

    return {"id": project_id}


# All Projects of a User
@router.get("/projects")
async def get_user_projects(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        access_token = token.split(" ")[1]
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Fetch the user ID
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user["id"]

    # Fetch all projects for the user
    connection = get_db()
    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT id, name, song_url FROM projects WHERE user_id = %s
        """, (user_id,))
        result = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        projects = [dict(zip(columns, row)) for row in result]
    finally:
        cursor.close()
        return_db(connection)

    return projects  # Return empty list if no projects

@router.get("/project/{project_id}")
async def get_project(project_id: str, request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        access_token = token.split(" ")[1]
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    connection = get_db()
    cursor = connection.cursor()
    try:
        cursor.execute("""
            SELECT id, user_id, name, song_url, seeker_position, zoom_factor,
                   loop_start, loop_end, created_at, updated_at
            FROM projects WHERE id = %s
        """, (project_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Project not found")

        columns = [desc[0] for desc in cursor.description]
        project = dict(zip(columns, result))
    finally:
        cursor.close()
        return_db(connection)

    return project