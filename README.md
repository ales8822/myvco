```text
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── models/   # Database models
│   │   ├── routers/  # API endpoints
│   │   ├── schemas/  # Modular Pydantic models
│   │   ├── services/ # Business logic
│   │   └── main.py   # Application entry
│   └── requirements.txt
│
└── frontend/         # React frontend
    ├── src/
    │   ├── components/ # Shared components
    │   ├── features/   # Feature-based modules
    │   │   ├── dashboard/
    │   │   ├── knowledge/
    │   │   ├── library/
    │   │   ├── meeting/
    │   │   │   ├── components/
    │   │   │   └── hooks/ # Optimized chat hooks
    │   │   └── staff/
    │   ├── pages/      # Route components
    │   ├── stores/     # Zustand state management
    │   └── lib/        # API client
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
2. **Configure Settings**: Set up your Gemini API key or Ollama URL in the Settings page
3. **Hire Staff**: Add AI staff members with different roles and personalities
4. **Add Knowledge & Assets**: Build your company's knowledge base and upload assets
5. **Start Meetings**: Create meetings and have conversations with your AI staff
6. **Context-Aware Responses**: AI staff will reference company knowledge and previous discussions
7. **Manage Companies**: Archive companies you no longer need, or permanently delete them

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
- `GET /companies` - List all companies (supports filtering by archived status)
- `POST /companies` - Create company
- `GET /companies/{id}` - Get company details
- `PUT /companies/{id}` - Update company
- `DELETE /companies/{id}` - Delete company
- `PUT /companies/{id}/archive` - Toggle archive status

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

### Settings
- `GET /settings` - Get application settings
- `POST /settings` - Update application settings

### Assets
- `GET /companies/{id}/assets` - List company assets
- `POST /companies/{id}/assets` - Create asset
- `DELETE /companies/{id}/assets/{assetId}` - Delete asset

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



"🎨 Design System & Visual Consistency"

1. The "True Dark" Color Palette
Base Background: neutral-950 (#0a0a0a) – Use for page-level wrappers.
Primary Surfaces: neutral-900 (#171717) – Use for Cards, Modals, and Sidebars.
Secondary Surfaces: neutral-800 (#262626) – Use for Table rows, Input fields, and hover states.
Borders: neutral-800 (Subtle) or neutral-700 (High contrast).

2. Brand Accents
Primary (Teal): Used for "Action" and "Knowledge" (primary-500/600). It represents growth and factual data.
Secondary (Indigo): Used for "Configuration" and "Behavior" (secondary-500/600). It represents the AI logic and background settings.

3. Categorical UI Patterns
To keep the app intuitive, we follow these color-coding rules:
Manifestos/Prompts: Always use Indigo accents.
Knowledge/Assets: Always use Teal accents.
Destructive Actions: Use Red but paired with neutral-dark backgrounds (never pure white-on-red).

4. Component Anatomy
Corners: Standardized to rounded-xl (12px) for main containers and rounded-lg (8px) for inputs/buttons.
Glassmorphism: Overlays/Modals must use backdrop-blur-sm with a bg-black/60 overlay.
Transitions: All interactive elements should include transition-all duration-200 to maintain a smooth, "app-like" feel.

5. Typography Hierarchy
Titles: text-gray-900 / dark:text-white (High Emphasis).
Body: text-gray-700 / dark:text-neutral-300 (Medium Emphasis).
Metadata: text-gray-500 / dark:text-neutral-500 (Low Emphasis).

## 📄 License

MIT License - feel free to use this project however you'd like!

