from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.repsonses import JSONResponse
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

# Safe defaults for container environment
INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://influxdb:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "my-token")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "my-org")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "my-bucket")

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)

@app.get("/")
async def root():
    return {
        "service": "influx-data-entry-api",
        "status": "ok",
        "endpoints": {
            "health": "/health",
            "write": "/write-line-protocol",
            "docs": "/docs",
        },
    }

@app.get("/health")
async def health():
    return JSONResponse(content={"status": "healthy"}, status_code=200)

@app.get("/ready")
async def ready():
    try:
        h = client.health()
        if getattr(h, "status", "").lower() == "pass":
            return JSONResponse(content={"status": "ready"}, status_code=200)
        return JSONResponse(
            content={"status": "degraded", "details": getattr(h, "message", "")}, status_code=503
        )
    except Exception as e:
        return JSONResponse(content={"status": "down", "error": str(e)}, status_code=503)

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
