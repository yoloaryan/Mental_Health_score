# 🌌 MindPulse — Digital Wellbeing & Mental Health Score Predictor

> **Turn everyday digital habits into one clear wellbeing signal.**

MindPulse is an AI-powered digital wellbeing intelligence application. It analyzes behavioral patterns — including daily screen usage, phone unlocks, study hours, sleep duration, physical activity, and stress levels — using a trained machine learning model to predict a personal mental health score on a scale of `0.0` to `10.0`.

---

## ✨ Features

- **🤖 Machine Learning Model**: Scikit-Learn Pipeline (`scikit-learn==1.6.1`) trained on student social media & lifestyle behavioral data.
- **⚡ High-Performance FastAPI Backend**: Validates inputs with Pydantic v2 schemas and exposes high-speed RESTful inference endpoints.
- **🎨 Liquid Glassmorphism UI**: Built with modern CSS custom properties, 3-layer floating ambient liquid gradients, frosted glass cards (`backdrop-filter: blur(28px)`), and smooth SVG liquid score gauges.
- **🌓 Apple-Style Light / Dark Mode**: Segmented pill appearance control with zero Flash-of-Unstyled-Content (anti-FOUC) script and `localStorage` persistence.
- **☁️ Cloud Ready**: Pre-configured for seamless 1-click deployment on Render.

---

## 🛠️ Tech Stack

### **Backend**
- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Server**: Uvicorn
- **ML / Data**: Scikit-Learn 1.6.1, Joblib, Pandas, Pydantic

### **Frontend**
- **Core**: HTML5, Vanilla CSS3 (Custom Glassmorphism Tokens), ES6 JavaScript
- **Design Aesthetic**: Apple Vision Pro / Linear Liquid Glass Aesthetics

---

## 📊 Model & Input Parameters

| Parameter | Type | Valid Range / Options | Description |
| :--- | :--- | :--- | :--- |
| `Age` | Integer | `10` – `100` | Age of user |
| `Gender` | String | `Male`, `Female` | User gender |
| `Country` | String | e.g. `India`, `USA`, `Canada`, `UK`, etc. | Country of residence |
| `Academic_Level` | String | `High School`, `Undergraduate`, `Graduate` | Education status |
| `Most_Used_Platform` | String | `Instagram`, `YouTube`, `TikTok`, `WhatsApp`, etc. | Primary app platform |
| `Purpose_Of_Use` | String | `Networking`, `Education`, `Entertainment`, `News` | Primary usage goal |
| `Avg_Daily_Usage_Hours` | Float | `0.0` – `24.0` | Average screen time (hours) |
| `Daily_Unlocks` | Integer | `0`+ | Daily phone unlock count |
| `Study_Hours` | Float | `0.0` – `24.0` | Daily study time (hours) |
| `Physical_Activity_Hours`| Float | `0.0` – `24.0` | Exercise / movement (hours) |
| `Sleep_Hours_Per_Night` | Float | `0.0` – `24.0` | Sleep per night (hours) |
| `Stress_Level` | String | `Low`, `Medium`, `High`, `Very High` | Self-reported stress |

---

## 🔌 API Endpoints

### 1. Serve Web Application
- **`GET /`**
- **Response**: Serves `index.html` UI.

### 2. Predict Mental Health Score
- **`POST /predict`**
- **Content-Type**: `application/json`
- **Sample Payload**:
```json
{
  "Age": 22,
  "Gender": "Male",
  "Country": "India",
  "Academic_Level": "Undergraduate",
  "Most_Used_Platform": "Instagram",
  "Purpose_Of_Use": "Entertainment",
  "Avg_Daily_Usage_Hours": 5.5,
  "Daily_Unlocks": 40,
  "Study_Hours": 4.0,
  "Physical_Activity_Hours": 1.5,
  "Sleep_Hours_Per_Night": 7.0,
  "Stress_Level": "Medium"
}
```
- **Sample Response**:
```json
{
  "predicted_mental_health_score": 7.35
}
```

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yoloaryan/Mental_Health_score.git
cd Mental_Health_score
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run FastAPI Development Server
```bash
uvicorn main:app --port 2000 --reload
```

Open `http://127.0.0.1:2000` in your web browser!

---

## ☁️ Deploying on Render

1. Create a new **Web Service** on [Render Dashboard](https://dashboard.render.com).
2. Connect your GitHub repository `Mental_Health_score`.
3. Set the configuration:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Deploy**.

- **Live Demo**: [https://mental-health-score-1-h1mv.onrender.com](https://mental-health-score-1-h1mv.onrender.com)

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).