# 🏙️ MTY PLUSVALÍA: AI Real Estate Investment Platform

![Project Status](https://img.shields.io/badge/Status-Hackathon_Demo-orange)
![Tech Stack](https://img.shields.io/badge/AI-Gemini_1.5_Flash-blue)
![Platform](https://img.shields.io/badge/Platform-Next.js_Firebase-black)

**MTY PLUSVALÍA** is an intelligent platform designed to democratize real estate investment analysis in the Monterrey metropolitan area. It leverages the power of **Gemini AI** and **Google Maps** to generate real-time financial, demographic, and commercial reports, guided by "Bricky," our voice-enabled AI agent.

---

## 🚀 About This Project

This project merges geospatial data with Generative AI to provide:
* **🧠 Business Intelligence:** Profitable business type suggestions based on specific zone data.
* **📊 Financial Projection:** Estimated ROI and cost per square meter calculations.
* **🗺️ Geographic Context:** Competition and demographic assessment using Google Places.
* **🗣️ Voice Interaction:** Audio reports narrated by AI (Text-to-Speech) for an immersive user experience.

---

## 🛠️ Technologies & Services (Google Stack)

This project was built by integrating the comprehensive Google Cloud and Firebase ecosystem:

### **🧠 Artificial Intelligence (Core)**
* **Gemini AI Agent ("Bricky"):** Natural language processing and real estate reasoning using the `Generative Language API`.
* **Google AI Studio:** Prompt engineering and configuration of the `gemini-1.5-flash` model.
* **Google Cloud Text-to-Speech API:** Neural voice generation for the AI assistant.

### **🌍 Google Maps Platform**
* **Maps JavaScript API:** Interactive visualization and map rendering.
* **Places API:** Extraction of points of interest and commercial competition data.
* **Geocoding API:** Conversion of coordinates into readable addresses.

### **🔥 Infrastructure (Firebase)**
* **Firebase Hosting:** Web application deployment (Next.js).
* **Cloud Functions (2nd Gen):** Serverless backend to securely orchestrate Gemini and TTS API calls.
* **Firebase Authentication:** User management (Google Sign-In).
* **Firebase Console:** Project and domain management.

---

## 🚧 Development Status (Important Notice)

> **⚠️ Note regarding Authentication:**
> The **Create Account / Sign In** functionality (Firebase Auth) is currently in **BETA**.
> * The system allows for basic authentication, but features such as profile persistence and report history saving are under active development for post-hackathon versions.
> * The core access to map analysis and the AI agent is **fully enabled** for demonstration purposes.

---

## ⚙️ Configuration & Installation

Follow these steps to run the project locally:

### 1. Prerequisites
* Node.js 18+ installed.
* Google Cloud account with billing enabled (for Maps & Gemini APIs).
* Firebase CLI installed (`npm install -g firebase-tools`).

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone [https://github.com/your-username/mty-plusvalia.git](https://github.com/your-username/mty-plusvalia.git)
cd mty-plusvalia
npm install