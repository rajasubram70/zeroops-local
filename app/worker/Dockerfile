FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir redis==5.0.4 psycopg2-binary==2.9.9
COPY worker.py .
CMD ["python", "worker.py"]