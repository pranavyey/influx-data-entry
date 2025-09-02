# Influx Data Entry - Makefile
# Phase 0: Docker Compose Management

.PHONY: help build up down logs clean

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker compose build

up: ## Start all services in detached mode
	docker compose up -d

down: ## Stop and remove all containers, networks, and volumes
	docker compose down -v

logs: ## Follow logs from all services
	docker compose logs -f

logs-frontend: ## Follow logs from frontend service
	docker compose logs -f frontend

logs-api: ## Follow logs from api service
	docker compose logs -f api

logs-influxdb: ## Follow logs from influxdb service
	docker compose logs -f influxdb

logs-grafana: ## Follow logs from grafana service
	docker compose logs -f grafana

clean: ## Remove all containers, networks, volumes, and images
	docker compose down -v --rmi all

status: ## Show status of all services
	docker compose ps

restart: ## Restart all services
	docker compose restart

# Development helpers
dev: ## Start services with live reload (if configured)
	docker compose up --build

# Phase 1 helpers (for future use)
minikube-start: ## Start minikube (Phase 2)
	@echo "Phase 2: Minikube deployment not yet implemented"

k8s-deploy: ## Deploy to Kubernetes (Phase 3)
	@echo "Phase 3: Kubernetes deployment not yet implemented"
