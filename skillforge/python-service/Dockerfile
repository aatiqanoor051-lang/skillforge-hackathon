FROM python:3.12-slim AS base
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PY_PORT=5001
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://localhost:5001/health').status==200 else sys.exit(1)" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5001"]
