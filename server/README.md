# PowerPoint to PDF Conversion Server

This server provides an API for converting PowerPoint (PPT/PPTX) files to PDF format. It is fully containerized with Docker and includes all necessary dependencies, including LibreOffice for conversion.

## Features

- RESTful API for PowerPoint to PDF conversion
- Cross-platform compatibility
- Dockerized deployment with all dependencies included
- Automatic converter selection based on available tools
- Simple to deploy and use

## API Endpoints

- `GET /api/health` - Check server health and available converters
- `POST /api/convert` - Convert a PowerPoint file to PDF
- `GET /api/download/<filename>` - Download a converted PDF file

## Deployment

### Prerequisites

- Docker
- Docker Compose

### Deployment Steps

1. Clone the repository
2. Navigate to the server directory
3. Build and start the container:

```bash
docker-compose up -d
```

This will:
- Build the Docker image with all dependencies
- Start the server on port 5000
- Create persistent volumes for uploads and converted files

### Testing the Deployment

To test if the server is running correctly:

```bash
curl http://localhost:5000/api/health
```

You should see a JSON response with the server status and available converters.

## Usage

### Converting a File

Send a POST request to `/api/convert` with a PPT/PPTX file in the `file` field:

```bash
curl -F "file=@presentation.pptx" http://localhost:5000/api/convert
```

The response will include a download URL for the converted PDF.

### Custom Port

To use a different port, edit the `docker-compose.yml` file and change the port mapping:

```yaml
ports:
  - "8080:5000"  # Map container port 5000 to host port 8080
```

## Troubleshooting

If you encounter issues:

1. Check the server logs:
```bash
docker-compose logs conversion-server
```

2. Ensure LibreOffice is working in the container:
```bash
docker exec -it ppt-conversion-server libreoffice --version
```

3. Make sure the upload and converted directories have the correct permissions. 