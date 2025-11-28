# Medical Document Organizer with AI Summarization

A full-stack application for managing and summarizing medical documents using Google Gemini AI.

## Prerequisites

- Docker Desktop installed
- Docker Compose installed
- Git

## Project Structure

```
Medical-Document-Organizer-with-AI-Summarization/
├── server/               # Node.js Express backend
│   ├── .env             # Environment variables
│   ├── Dockerfile       # Backend Docker configuration
│   ├── package.json
│   └── server.js
├── frontend/            # React/Vite frontend
│   ├── Dockerfile       # Frontend Docker configuration
│   ├── package.json
│   └── src/
├── docker-compose.yml   # Docker Compose configuration
└── README.md
```

## Environment Setup

1. **Create `.env` file in the `server` folder:**

```bash
cd server
```

2. **Add the following to `server/.env`:**

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_uri_here
JWT_SECRET=your_secret_key_here
```

Get your Gemini API key from: https://aistudio.google.com/app/apikeys

## Running with Docker

### Start the Project

```bash
docker-compose up --build
```

This will:
- Build and start the backend (Node.js) on `http://localhost:5000`
- Build and start the frontend (React) on `http://localhost:5173`
- Start MongoDB on `localhost:27017`

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **MongoDB:** localhost:27017

### Stop the Project

```bash
docker-compose down
```

This stops all containers but keeps the data.

### View Logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

## Features

- 🔐 User authentication (Signup/Login)
- 📄 Upload medical documents (images/PDFs)
- 🤖 AI-powered summarization using Google Gemini 2.5 Pro
- 📚 Document management (view, delete)
- 🗄️ MongoDB database for persistent storage

## API Endpoints

### Authentication
- `POST /signup` - Register a new user
- `POST /login` - Login user

### Documents
- `POST /summarize` - Upload and summarize a medical document
- `GET /documents` - Get all user's documents
- `DELETE /documents/:id` - Delete a document

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, JWT
- **Frontend:** React, Vite
- **AI:** Google Generative AI (Gemini 2.5 Pro)
- **Containerization:** Docker, Docker Compose

## Troubleshooting

### Port Already in Use
If ports 5000, 5173, or 27017 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Change first number to unused port
```

### Docker can't download images
Ensure you have internet connection and Docker Desktop is running properly.

### MongoDB connection issues
Wait a few seconds for MongoDB to fully start before the backend connects.

## Development

To run locally without Docker:

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

