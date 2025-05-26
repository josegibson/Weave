FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python, LibreOffice and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libreoffice \
    libreoffice-script-provider-python \
    fonts-liberation \
    --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy server files
COPY . .

# Create upload and output directories
RUN mkdir -p uploads
RUN mkdir -p converted

# Make directories accessible
RUN chmod -R 777 /app/uploads
RUN chmod -R 777 /app/converted

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["python3", "app.py"] 