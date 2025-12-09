"""
WHO ICD-11 API Configuration
Replace the hardcoded credentials in your backend icd11.py with this code
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# WHO API Configuration (matching index.html ECT settings)
WHO_API_BASE = os.getenv("WHO_API_BASE", "https://id.who.int")
WHO_TOKEN_URL = os.getenv("WHO_TOKEN_URL", "https://icdaccessmanagement.who.int/connect/token")
WHO_API_URL = os.getenv("WHO_API_URL", f"{WHO_API_BASE}/icd/release/11/2025-01")

# Get credentials from environment variables (NEVER hardcode these!)
WHO_CLIENT_ID = os.getenv("WHO_CLIENT_ID")
WHO_CLIENT_SECRET = os.getenv("WHO_CLIENT_SECRET")

# Validate that credentials are set
if not WHO_CLIENT_ID:
    raise ValueError(
        "WHO_CLIENT_ID environment variable is not set. "
        "Please add it to your .env file or set it as a system environment variable."
    )

if not WHO_CLIENT_SECRET:
    raise ValueError(
        "WHO_CLIENT_SECRET environment variable is not set. "
        "Please add it to your .env file or set it as a system environment variable."
    )

# Optional: Log configuration (without exposing secrets)
import logging
logger = logging.getLogger(__name__)
logger.info(f"WHO API Base: {WHO_API_BASE}")
logger.info(f"WHO API URL: {WHO_API_URL}")
logger.info(f"WHO Client ID: {WHO_CLIENT_ID[:10]}...") # Only log first 10 chars
logger.info("WHO Client Secret: [REDACTED]")


# Example usage in your FastAPI endpoint
"""
from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

@router.get("/api/token")
async def get_who_token():
    '''Get WHO ICD-11 API access token'''
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                WHO_TOKEN_URL,
                data={
                    "client_id": WHO_CLIENT_ID,
                    "client_secret": WHO_CLIENT_SECRET,
                    "scope": "icdapi_access",
                    "grant_type": "client_credentials"
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to get WHO token: {response.text}"
                )
            
            token_data = response.json()
            return {
                "access_token": token_data.get("access_token"),
                "token_type": token_data.get("token_type", "Bearer"),
                "expires_in": token_data.get("expires_in", 3600)
            }
            
    except Exception as e:
        logger.error(f"Error getting WHO token: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get WHO API token: {str(e)}"
        )

@router.get("/api/icd/{code}")
async def get_icd_details(code: str):
    '''Get ICD-11 entity details'''
    try:
        # Get WHO token first
        token_response = await get_who_token()
        access_token = token_response["access_token"]
        
        # Fetch ICD entity
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{WHO_API_URL}/{code}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                    "API-Version": "v2",
                    "Accept-Language": "en"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to get ICD details: {response.text}"
                )
            
            return response.json()
            
    except Exception as e:
        logger.error(f"Error getting ICD details for {code}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get ICD details: {str(e)}"
        )
"""
