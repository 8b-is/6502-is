<div align="center">
  <h1>🕹️ Visual6502 <em>3D</em></h1>
  <p><strong>A Modern WebGL Interactive Simulation of the Iconic MOS 6502 Microprocessor</strong></p>
  <h3>🌐 <a href="https://3d.6502.is/">Live Demo at 3d.6502.is</a></h3>

  <p>
    <a href="https://8b.is">
      <img src="https://img.shields.io/badge/Brought%20to%20you%20by-8b.is-000000?style=for-the-badge&logo=code" alt="8b.is" />
    </a>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## 🌟 Overview

**Visual6502 3D** is a complete, real-time 3D reimagining of the classic [Visual6502](http://www.visual6502.org/) project. By mapping the exact logic gates and trace layouts of the original MOS 6502 die into three-dimensional space, this application allows you to explore the physical architecture and execution cycle of the microprocessor that powered the Apple II, Commodore 64, and NES—right in your browser.

## ✨ Features

- 🗺️ **Full 3D Chip Topology:** Freely orbit, pan, and zoom around the physical silicon layout.
- 🎛️ **Dynamic Layer Control:** Use real-time opacity sliders to independently inspect the Metal, Polysilicon, Powered Diffusion, and Grounded Diffusion layers.
- ⚡ **Cycle-Accurate Simulation:** The engine evaluates the deterministic logic nodes of the CPU on every clock cycle.
- 💻 **Integrated Hex Editor:** Write raw 6502 machine code and inject it directly into the simulated memory space.
- 🔍 **Live Disassembler & Debugger:** Watch your program execute with live inspection of the Program Counter (PC), Accumulator (A), X/Y Registers, Stack Pointer (SP), and Status Flags.
- 📱 **Responsive Glassmorphism UI:** A sleek, fully responsive dashboard that looks stunning on desktops and gracefully adapts to mobile devices.

---

## 🚀 Getting Started

### Local Development (Node.js)

The project is built with Vite for lightning-fast HMR and optimized builds.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aye-is/6502-3D.git
   cd 6502-3D
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Build for production:**
   ```bash
   npm run build
   ```

### 🐳 Docker & Coolify Deployment

Deploying Visual6502 3D is incredibly simple. We provide a highly-optimized, multi-stage `Dockerfile` and a `docker-compose.yml` that serves the compiled static application using Nginx.

If you use **Coolify**, simply point it to your repository and select the **Docker Compose** deployment method. It will automatically build and deploy the app with zero configuration required.

To run it manually via Docker:
```bash
docker-compose up -d --build
```
Your simulation will be available at `http://localhost`.

---

## 🏗️ Architecture

- **Engine:** Ported ES-Module simulation engine derived from the original transistor-level simulation logic.
- **Renderer:** React Three Fiber (R3F) handling the massive WebGL geometry and optimized instanced rendering of the chip traces.
- **UI:** Custom CSS Grid / Flexbox architecture leveraging deep glassmorphism aesthetics.

---

<div align="center">
  <p>Crafted with passion for retro computing and modern web technologies.</p>
  <a href="https://8b.is"><strong>8b.is</strong></a>
</div>
