# SocialPilot — Social Media Management Platform

A premium, state-of-the-art social media management dashboard built with **Next.js 16 (App Router)** and **Tailwind CSS v4**. This application features a fully responsive, glassmorphic dark-themed user interface tailored for marketers, agencies, and enterprise social media coordinators.

---

## 🚀 Key Features

*   **Sleek Landing Page**: Interactive landing view with structured hero segments, feature matrices, and vertical baseline-aligned navigation.
*   **Secure Authentication**: Custom Login and Registration views equipped with:
    *   Dynamic password strength indicators (fair, weak, good, strong validation metrics).
    *   Role selection dropdown (Admin, Creator, Marketing Team, Business, and Client roles).
    *   Natively styled dark-theme glass form inputs and state-aware disabled fields.
*   **Interactive Dashboard**:
    *   Quick-actions strip (Quick post creation, calendar shortcuts, reports).
    *   Weekly Engagement Area Chart (broken down by likes, comments, and shares).
    *   Tabbed Upcoming/Published post slider with platform icons.
    *   Connected accounts widget and contextual notification center.
*   **Campaign Manager**: Multi-state view tracking campaigns (Active, Completed, Draft, Paused) with:
    *   Dynamic progress bars showing campaign milestones.
    *   Structured grid cards highlighting budget, reach, and engagement metrics.
*   **Content Calendar**: Interactive content planning layout built using `react-big-calendar`.
*   **Advanced Analytics**:
    *   Followers distribution pie charts (with vertically-stacked, anti-collision legend listings).
    *   Tabular recent activity logs and top-performing post charts.
*   **Profile Management**:
    *   Role-locked forms for personal information.
    *   Password reset accordion guard.
    *   Clean integration with platform linkages and status indicators.
*   **Access Control**: Centralized role-based routing guard that blocks unauthorized views and displays a tailored, animated "Access Restricted" alert.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 16.2.10 (App Router)
*   **Core Library**: React 19.2.4
*   **Styling**: Tailwind CSS v4.0.0 (PostCSS)
*   **State & Form Validation**: React Hook Form v7.81
*   **Charts & Visualizations**: Recharts v3.9.2
*   **Scheduler Calendar**: React Big Calendar v1.20
*   **Iconography**: Lucide React & React Icons

---

## ⚙️ Development Setup

To compile and launch the application locally:

### 1. Install Dependencies
Navigate to the frontend directory and install npm packages:
```bash
npm install
```

### 2. Launch the Development Server
Due to platform-specific architecture differences on Windows hosts where the native SWC binary compiler fails, the dev/build commands are optimized to run using the Webpack bundler alongside WASM bindings:
```bash
npm run dev
```
The application will be live at: **[http://localhost:3000](http://localhost:3000)**

### 3. Build Production Bundle
To build the static application bundle for hosting:
```bash
npm run build
```

---

## ⚡ Performance Optimizations

1.  **Route Lazy-Loading**: All 11 pages in the main dashboard view `app/(dashboard)/*` utilize React code-splitting via `next/dynamic` with `ssr: false`. This:
    *   Prevents bloated initial layout bundle sizes.
    *   Solves development page compilation bottlenecks.
    *   Resolves hydration mismatch warnings caused by client-only rendering blocks (such as charts).
2.  **Tailwind v4 Specificity Handling**: Inline CSS rules are used for critical grid gaps (`gap`), paddings, and alignment properties to prevent Tailwind v4's Preflight reset rules from overriding utility alignments.
3.  **Static View Isolation**: Auth backgrounds and decoration gradients are isolated using a dedicated `.auth-scroll-container` class to completely separate viewport scroll bindings from background grids, solving double-scroll viewport artifacts.
