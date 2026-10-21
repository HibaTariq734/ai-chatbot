# Grove AI

A focused, responsive AI chat workspace built with Django and React. Sage green, walnut brown, and a subtle amber glow create a calm workspace with responsive suggestion cards, tactile controls, and comfortable reading.

## Features

- Token-by-token SSE replies with conversation memory and a three-dot thinking indicator.
- Markdown, syntax highlighting, code copy buttons, suggestion prompts, auto-scroll, and retry.
- Mobile-friendly sticky composer, keyboard controls, accessible labels and focus states.
- Strict API validation and friendly, secret-safe provider errors.
- In-memory sessions: refreshing or clearing the page removes the conversation. No database or browser storage contains your messages.

## Stack

Python 3.10+ · Django 5.2 · Django REST Framework · django-cors-headers · python-dotenv · Groq SDK · React 19 · Vite 7 · Tailwind CSS 4 · Framer Motion · react-markdown · react-syntax-highlighter · lucide-react. Use Node.js 22.12+ or 24 LTS.

## Windows setup

Open PowerShell in this project folder. `npm.cmd` avoids PowerShell execution-policy issues. Calling the virtual environment's Python directly also avoids needing to activate it.

### Backend

```powershell
cd backend
py -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Get a free Groq API key by signing in at [Groq Console](https://console.groq.com/keys), selecting **Create API key**, and copying the key into `GROQ_API_KEY` in `backend/.env`. Free accounts have usage limits; availability and limits are controlled by Groq. See the [official quickstart](https://console.groq.com/docs/quickstart). Never put the key in a frontend environment variable or commit `.env`.

Then run:

```powershell
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test
.\venv\Scripts\python.exe manage.py runserver
```

The API runs at `http://localhost:8000/api/chat/`. No migrations are needed for this stateless endpoint.

### Frontend (second PowerShell terminal, from the project root)

```powershell
cd frontend
npm.cmd install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd run dev
```

Open **http://localhost:5173** or **http://127.0.0.1:5173**. Keep both terminals running; Ctrl+C stops each server. During development, an unset or blank `VITE_API_URL` sends requests through Vite's `/api` proxy to `http://127.0.0.1:8000`; production builds default to `http://localhost:8000`. Set `VITE_API_URL` to call another backend directly. Restart Vite after changing its environment. Django permits both local frontend origins through CORS.

If Groq reports the model is unavailable, set `GROQ_MODEL` in `backend/.env` to an accessible text model from your Groq Console and restart Django. The default remains `openai/gpt-oss-20b`.

```powershell
# Production frontend compilation
npm.cmd run build
```

## API and limits

POST `/api/chat/` with JSON:

```json
{"messages":[{"role":"user","content":"Explain APIs simply"}]}
```

Send 1–20 messages, each with role `user` or `assistant` and a non-blank string of at most 4,000 characters. Validation returns HTTP 400 with `error` and field `details`. A missing key returns HTTP 503. Successful HTTP responses stream `data: {"content":"..."}` frames followed by `data: {"done":true}`; provider failures use `data: {"error":"..."}`. Every frame ends with two newlines. The model is `openai/gpt-oss-20b`; the server prepends a fixed system prompt. See [Groq streaming documentation](https://console.groq.com/docs/text-chat).

The UI sends the complete conversation and supports ten user turns before asking you to clear chat, keeping every request inside the 20-message limit. It also asks you to clear if a generated reply exceeds the API's 4,000-character history limit. Failed partial replies remain visible; Retry replaces that reply using the original request history. After a failure, retry or clear before sending another message. Provider output is capped at 1,000 tokens per reply. Requests time out after 45 seconds without activity.

## Configuration and deployment

All palette colors live in `frontend/src/index.css`; brand and small labels use JetBrains Mono, body text uses Inter via Google Fonts, and the welcome heading adds a Georgia serif accent. Tailwind is available alongside component styles. The streaming logic is isolated in `src/hooks/useChat.js`.

`DEBUG` defaults to false; `.env.example` enables it for local development. For a deployment, set `DEBUG=False`, a stable random `SECRET_KEY`, and appropriate `ALLOWED_HOSTS`; configure your frontend origin in Django's `CORS_ALLOWED_ORIGINS`. Serve behind HTTPS with a production WSGI server, disable proxy buffering for SSE, and allow enough worker capacity for long-lived streams. Django's development server is for local use. Before exposing a shared API publicly, add authentication and per-user request quotas at your application or gateway to protect your Groq allowance. This starter has no accounts or persistent conversation storage.

## Deploy on Vercel

Import the repository as a Vercel project on the **Hobby** plan. Set **Root Directory** to `backend` and **Framework Preset** to **Other**. Leave Build Command and Output Directory unset: `vercel.json` explicitly uses `@vercel/python` and routes every request to `config/wsgi.py`, which exports `app`. Vercel installs the five packages in `requirements.txt`; no Gunicorn, migrations, or static collection are required.

Set these environment variables in Vercel before deploying:

- `DEBUG=False`
- `SECRET_KEY`: a generated private random secret
- `GROQ_API_KEY`: your private Groq API key
- `ALLOWED_HOSTS=your-backend.vercel.app` (or `.vercel.app` for Vercel subdomains; comma-separated)
- `CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app` (exact frontend origins, comma-separated, with no trailing slash)

Deploy the frontend separately with `VITE_API_URL=https://your-backend.vercel.app` and rebuild it. The API remains `/api/chat/`; `/` has no page. The backend disables database access and needs no SQLite file. Local `.env` files are excluded from CLI uploads by `.vercelignore`; store deployed secrets in Vercel settings.

The Python runtime supports streaming, but responses must complete within the function duration allowed by your Hobby project's configuration. See the [Python runtime](https://vercel.com/docs/functions/runtimes/python) and [function limits](https://vercel.com/docs/functions/limitations). This configuration preserves the existing SSE logic; verify token streaming with a live request after deployment.

## Screenshots

_Add desktop and mobile screenshots of your running app here._

## Source file inventory

```text
.gitignore
README.md
backend/
  .env.example
  .gitignore
  requirements.txt
  vercel.json
  .vercelignore
  manage.py
  config/
    __init__.py
    settings.py
    tests.py
    urls.py
    wsgi.py
    asgi.py
  chat/
    __init__.py
    apps.py
    serializers.py
    urls.py
    views.py
    tests.py
frontend/
  .env.example
  .gitignore
  package.json
  package-lock.json
  index.html
  vite.config.js
  src/
    main.jsx
    App.jsx
    index.css
    hooks/useChat.js
    components/
      Header.jsx
      CopyButton.jsx
      MessageList.jsx
      MessageBubble.jsx
      TypingIndicator.jsx
      ChatInput.jsx
      SuggestionChips.jsx
      EmptyState.jsx
```

Installation also generates ignored `backend/venv/`, `frontend/node_modules/`, Python caches, and `frontend/dist/`. These are build/dependency artifacts, not source files.
