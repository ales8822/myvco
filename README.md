<!-- README.md -->
# MyVCO - My Virtual Company

A professional application for managing virtual companies with AI-powered staff members who maintain context, memory, and engage in meaningful meetings.

## 🚀 Features

- **Company Management**: Create and manage multiple virtual companies
- **AI Staff**: Hire AI-powered staff members with unique roles, personalities, and expertise
- **Smart Meetings**: Conduct meetings with context-aware AI staff that remember previous discussions
- **Knowledge Base**: Build a company knowledge base that AI staff can reference
- **Dual LLM Support**: Use Google Gemini API or Ollama models via RunPod
- **Memory System**: AI staff maintain context from previous meetings and company knowledge

## 📁 Project Structure

```
myvco/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── models/   # Database models
│   │   ├── routers/  # API endpoints
│   │   ├── services/ # Business logic
│   │   └── main.py   # Application entry
│   └── requirements.txt
│
└── frontend/         # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── stores/   # Zustand state management
    │   └── lib/      # API client
    └── package.json
```

## 🛠️ Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file (copy from `.env.example`):
```bash
copy .env.example .env
```

5. Edit `.env` and add your API keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
OLLAMA_BASE_URL=https://your-runpod-id.runpod.io  # Optional
```

6. Run the backend:
```bash
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8001
API docs at: http://localhost:8001/docs

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## 🎯 Usage

1. **Create a Company**: Start by creating your first virtual company
2. **Hire Staff**: Add AI staff members with different roles and personalities
3. **Add Knowledge**: Build your company's knowledge base
4. **Start Meetings**: Create meetings and have conversations with your AI staff
5. **Context-Aware Responses**: AI staff will reference company knowledge and previous discussions

## 🔧 Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **SQLite**: Lightweight database
- **Google Gemini API**: Primary LLM provider
- **Ollama**: Alternative LLM provider via RunPod

### Frontend
- **React**: UI library
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **React Router**: Navigation
- **Axios**: HTTP client

## 📝 API Endpoints

### Companies
- `GET /companies` - List all companies
- `POST /companies` - Create company
- `GET /companies/{id}` - Get company details
- `PUT /companies/{id}` - Update company
- `DELETE /companies/{id}` - Delete company

### Staff
- `POST /staff/companies/{id}/staff` - Hire staff
- `GET /staff/companies/{id}/staff` - List company staff
- `GET /staff/{id}` - Get staff details
- `PUT /staff/{id}` - Update staff
- `DELETE /staff/{id}` - Remove staff

### Meetings
- `POST /meetings/companies/{id}/meetings` - Create meeting
- `GET /meetings/companies/{id}/meetings` - List meetings
- `GET /meetings/{id}` - Get meeting details
- `POST /meetings/{id}/messages` - Send message (streaming)
- `PUT /meetings/{id}/status` - End meeting

### Knowledge
- `POST /knowledge/companies/{id}/knowledge` - Add knowledge
- `GET /knowledge/companies/{id}/knowledge` - List knowledge
- `DELETE /knowledge/{id}` - Delete knowledge

### LLM
- `GET /llm/providers` - Get available providers
- `GET /llm/ollama/models` - Fetch Ollama models

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=sqlite:///./myvco.db

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Google Gemini API
GEMINI_API_KEY=your_key_here

# Ollama RunPod (Optional)
OLLAMA_BASE_URL=https://your-pod.runpod.io

# Default Settings
DEFAULT_LLM_PROVIDER=gemini
DEFAULT_MODEL=gemini-2.0-flash
```

## 🚧 Development

- Backend runs on port 8001
- Frontend runs on port 5173
- Frontend proxies `/api` requests to backend
- Database file: `myvco.db` (created automatically)

## 📄 License

MIT License - feel free to use this project however you'd like!

