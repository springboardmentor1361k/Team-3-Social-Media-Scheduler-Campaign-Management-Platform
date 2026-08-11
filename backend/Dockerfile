# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: install dependencies in a clean layer
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

# System deps needed to compile psycopg2-binary, cryptography, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first for better layer caching
COPY requirements.txt .

# Install into a prefix directory so we can copy it cleanly to the final stage
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Final image: slim runtime only
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim AS final

# Runtime system deps (libpq for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Remove dev/local files that should never be in the image
RUN rm -f .env celerybeat-schedule.* *.bak *.dat *.dir

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Expose FastAPI port
EXPOSE 8000

# ─────────────────────────────────────────────────────────────────────────────
# Default command: run FastAPI (override in docker-compose for Celery)
# ─────────────────────────────────────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
