# Influx Data Entry

A simple full-stack proof-of-concept (POC) app for writing and visualizing time-series data in InfluxDB.

## Purpose
This app demonstrates how to:
- Accept InfluxDB line protocol entries via a modern web UI
- Store those entries in InfluxDB using a FastAPI backend
- Visualize the stored data using Grafana dashboards

## Stack
- **Frontend:** Next.js (with shadcn/ui, Tailwind CSS, zod, react-hook-form)
- **Backend:** FastAPI (Python)
- **Database:** InfluxDB 2.x
- **Visualization:** Grafana
- **Containerization:** Docker Compose

## Features
- User-friendly form for entering InfluxDB line protocol (with dropdowns for measurement, tags, and fields)
- Data is written to InfluxDB via a FastAPI endpoint
- Grafana is pre-configured for easy data visualization

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)

### Quick Start
1. **Clone the repo:**
   ```sh
   git clone https://github.com/yourusername/influx-data-entry.git
   cd influx-data-entry
   ```
2. **Start backend, InfluxDB, and Grafana:**
   ```sh
   docker-compose up --build
   ```
3. **Start the frontend:**
   ```sh
   cd influx-data-entry
   npm install
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

4. **Access Grafana:**
   - [http://localhost:3001](http://localhost:3001)
   - Login: `admin` / `admin123`
   - Add InfluxDB as a data source (see docker-compose for credentials)

## Project Structure
- `backend/` — FastAPI backend
- `influx-data-entry/` — Next.js frontend
- `docker-compose.yml` — Multi-service orchestration

## License
MIT
