from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "my-token")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "my-org")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "my-bucket")

@app.post("/write-line-protocol")
async def write_line_protocol(request: Request):
    body = await request.body()
    if not body:
        raise HTTPException(status_code=400, detail="No data provided")
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{INFLUXDB_URL}/api/v2/write",
            params={"org": INFLUXDB_ORG, "bucket": INFLUXDB_BUCKET, "precision": "ns"},
            headers={
                "Authorization": f"Token {INFLUXDB_TOKEN}",
                "Content-Type": "text/plain; charset=utf-8",
            },
            content=body,
        )
        if resp.status_code != 204:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"status": "success"}
