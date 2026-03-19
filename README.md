# PaperFlix 🧠🎥

PaperFlix is a full-stack, Machine Learning-powered recommendation engine for Computer Science research papers. It uses a custom-built content-filtering algorithm (Cosine Similarity on 768-dimensional neural network embeddings) to create personalized "For You" feeds that evolve dynamically as you read.

## 🏗️ Architecture

- **Frontend:** Next.js (React)
- **Backend:** Django (Python Framework)
- **Database:** SQLite (In-Memory Vector Cache)
- **Machine Learning:** `sentence-transformers` (all-MiniLM-L6-v2) parsing live data from the arXiv API.

---

## 🚀 How to Run Locally

### Prerequisites

Make sure you have **Node.js (v18+)** and **Python (3.9+)** installed on your machine.

### 1. Clone the Repository

```bash
git clone <https://github.com/SyedAsadK/paper-flix.git>
cd paper-flix
```

### 2. Set up the Python Environment (Backend & ML)

We use a single virtual environment for both the Django server and the ML data pipeline.

# Create and activate a virtual environment
```bash
python -m venv venv
```

# On Mac/Linux
```bash
source venv/bin/activate
```

# On Windows
```bash
venv\Scripts\activate
```

# Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Build the Vector Database (Data Ingestion)

Before starting the server, you need to pull real research papers from arXiv and generate their mathematical embeddings.

```bash
cd data-prep
python prep*data.py
```

*(Note: This step downloads 200+ papers and runs them through a neural network. It may take 1-3 minutes depending on your CPU).*

### 4. Start the Django Backend

Once the database is populated, start the API server.

```bash
cd ../backend
python manage.py migrate # Sets up Django's default tables
python manage.py runserver 8080
```
_Leave this terminal window running._

### 5. Start the Next.js Frontend

Open a **new terminal window** (leave the backend running), navigate to the frontend folder, and start the React app.

```bash
cd frontend
npm install
npm run dev
```

### 🎉 View the App

Open your browser and navigate to **<http://localhost:3000>**. Create a profile, select a few starting topics, and watch your custom research feed generate in real-time!
