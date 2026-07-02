FROM python:3.12-slim

# Runtime deps: libsqlite3 for SQLite, curl for healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-0 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Persistent data directory (mounted as volume in compose)
RUN mkdir -p /app/data

# Non-root user for security
RUN useradd -r -u 1000 -d /app hermes \
    && chown -R hermes:hermes /app
USER hermes

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
