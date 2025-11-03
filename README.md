# 🎨 MoodBoard Frontend — React + Tailwind + Vite

The React frontend for MoodBoard, a visual mood board interface with AI clustering. Built with modern tools like Vite and Tailwind, deployed on Vercel, live at: https://moodboard-frontend-ten.vercel.app/.

---

## 🚀 Tech Stack

- React 18 – declarative UI
- Tailwind CSS – utility-first styling
- Vite – lightning-fast dev server
- Axios – HTTP client
- Vercel – auto CI/CD + deployment

---

## 📁 Structure

```text
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── api/                # Axios API clients and config
│   ├── pages/              # App views/routes (Boards, Items, Search, etc.)
│   ├── App.tsx             # Main React application component
│   ├── main.tsx            # App entry point (Vite)
│   └── index.css           # Global Tailwind styles
├── public/                 # Static assets (favicon, icons, etc.)
├── .env                    # Local development environment variables
├── vite.config.ts          # Vite configuration
├── package.json            # Project metadata and dependencies
└── vercel.json             # Vercel deployment config
```

---

## 🧩 Local Development

### 1. Install Dependencies

```bash
cd frontend

npm install
```

### 2. Add .env.local

```bash
VITE_API_URL=http://localhost:8000/api
VITE_STATIC_URL=http://localhost:8000
```

### 3. Run Dev Server

```bash
npm run dev
```

Visit:
http://localhost:5173

---

## ✨ Features

- Create and browse boards
- Upload or paste text/images
- Global semantic search
- Dynamic clustering + GPT labeling
- Responsive mobile layout

---

## 🧠 Notes

- When using VITE_API_URL, ensure it includes /api
- Static files (images) are served from /static

---

## 👤 Author

Joseph Nechleba  
https://josephnechleba.com
