# filepath: /d:/VISUAL STUDIO CODE PROJECTS/waveformAnalyzer/server/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
import bcrypt
import uuid
from crud import get_user_by_email
import os
from dotenv import load_dotenv

router = APIRouter()

# JWT config
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: str  # user email

class UserOut(BaseModel):
    id: uuid.UUID
    email: str

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def authenticate_user(email: str, password: str):
    """Authenticate the user by email and password."""
    user = get_user_by_email(email)  # Fetch user from the database
    if not user:
        return None  # User not found
    if not verify_password(password, user["password_hash"]):  # Verify password
        return None  # Password does not match
    return user  # Return the user if authentication is successful

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({
        "exp": expire,
        "sub": data.get("sub")  # <-- this ensures "sub" is in the payload
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# AUTHENTICATION ROUTES

@router.post("/login", response_model=Token)
def login(form_data: LoginRequest):
    if not authenticate_user(form_data.email, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(
        data={"sub": form_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(
        data={"sub": form_data.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

@router.post("/refresh", response_model=Token)
def refresh_token(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")

    refresh_token = token.split(" ")[1]

    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        new_access_token = create_access_token(
            data={"sub": user["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )

        return {
            "access_token": new_access_token,
            "refresh_token": refresh_token,
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

@router.get("/me", response_model=UserOut)
def read_users_me(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")

    access_token = token.split(" ")[1]

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {"id": user["id"], "email": user["email"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")