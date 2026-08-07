# Suraksha System & Technology Overview

This document provides a comprehensive overview of the **Suraksha** ecosystem, which consists of a **Web Application (Monorepo)** and a **Mobile Application**. Both applications are built using modern JavaScript/TypeScript stacks and share several architectural patterns, including real-time communication, robust state management, and geospatial capabilities.

---

## 1. How It Works (System Workflow)

The Suraksha ecosystem relies on a seamless data flow between the end-users (Mobile App), the centralized server (Backend), and the administrators/operators (Web App). Here is how the core mechanisms work together:

### Real-Time Communication & Tracking
- **The Flow:** When a mobile user opens the app or has background location enabled, their GPS coordinates are periodically sent to the backend. The backend uses **Socket.io** to instantly broadcast these updates to the Web App.
- **The Result:** Administrators on the Web App dashboard can see live movements of citizens, volunteers, or incidents on the **React Leaflet** map in real-time, without needing to refresh the page.

### Alerts and Push Notifications
- **The Flow:** An administrator uses the Web App to create a high-priority alert (e.g., "Flash Flood Warning in Region X"). The Web App sends this data to the Express.js backend via a REST API call.
- **The Result:** The backend simultaneously records the alert in the **PostgreSQL** database and triggers external services. It uses the **Expo Server SDK** to push notifications directly to the Mobile App users, **Twilio** to send SMS warnings, and **Nodemailer** for email alerts. 

### Geospatial Processing (Safe Routes & Zones)
- **The Flow:** The mobile app relies heavily on geospatial algorithms. When a user requests a safe route or checks for danger zones, their current location is processed by the backend using **@turf/turf** (for polygon/radius calculations) and **ngeohash** (for spatial indexing). 
- **The Result:** The system checks the user's location against known flood boundaries or disaster incidents in the database and returns safe navigational paths or proximity warnings (Location Gates) directly to the user's React Native Map.

### Authentication & Security
- **The Flow:** Users logging into either the Web or Mobile app authenticate through standard credentials or Google Auth. The backend verifies this and generates a secure **JSON Web Token (JWT)**. For admins, **Speakeasy** is used to enforce Two-Factor Authentication (2FA).
- **The Result:** The JWT is stored securely on the device (using **Expo Secure Store** on mobile or HTTP-only cookies/local storage on the web) and attached to every subsequent API request to ensure data is only accessed by authorized roles.

### Relief Tokens and Data Syncing
- **The Flow:** Admins generate digital Relief Tokens via the Web App to distribute resources. These tokens are saved in the database via **Prisma ORM**. When citizens view their tokens on the Mobile App, **React Query** fetches the data and caches it. 
- **The Result:** If the citizen loses internet access temporarily, React Query serves the cached token data so they can still present it at Relief Camps.

---

## 2. Web Application (Monorepo)

The Web Application is structured as a monorepo containing both the frontend client and the backend server. It orchestrates the administrative and dashboard side of the Suraksha platform.

### Core Features & Modules
* **Comprehensive Dashboards:** Provides dedicated dashboards for main operations, citizen views, and analytical metrics.
* **Incident & Alerts Management:** Modules for reporting incidents, broadcasting real-time alerts, and tracking damage assessments.
* **Geospatial & Water Level Monitoring:** Features live interactive maps, river mappings, and specific tools for water level monitoring in flood-prone areas.
* **Relief & Camps Management:** Tools to manage relief camps, track resources, and issue/verify Relief Tokens.
* **Missing Persons & Help Requests:** Dedicated portals for reporting missing persons, issuing public requests, and coordinating rescue efforts.
* **User & Volunteer Management:** Comprehensive user profiles, authentication, volunteer onboarding, and task management.
* **Family Safety Tracking:** Modules dedicated to connecting families and tracking their safety statuses.
* **AI Research & Analytics:** Special dashboard (`AIResearchPage`) for analyzing trends and data using artificial intelligence models.
* **Donations Tracking:** System to manage and visualize monetary and resource donations.

### System Architecture
- **Monorepo Management:** Uses standard NPM Workspaces to manage `frontend` and `backend` under a single root repository.
- **Concurrent Development:** Utilizes `concurrently` to run both the backend server and frontend development server simultaneously, along with starting a local PostgreSQL database automatically.

### Backend Technologies (Express + Node.js)
The backend acts as the core API and data management layer for the platform.
* **Core Framework:** Node.js with **Express.js** and **TypeScript**.
* **Database & ORM:** **PostgreSQL** with **Prisma ORM**.
* **Real-time Communication:** **Socket.io** enables real-time event broadcasting.
* **Authentication & Security:** **JWT**, **Bcryptjs**, **Google Auth Library**, and **Speakeasy** (for 2FA).
* **Notifications & Messaging:** **Twilio** (SMS) and **Nodemailer** (Email).
* **Geospatial & Mapping:** **@turf/turf** and **ngeohash** for spatial analysis.
* **Utility & Document Generation:** **PDFKit**, **ExcelJS**, and **node-cron** for background tasks.

### Frontend Technologies (React + Vite)
The frontend provides a rich, interactive dashboard for administrators or web users.
* **Core Framework:** **React 19** built with **Vite** and **TypeScript**. 
* **Styling:** **Tailwind CSS v4** combined with `clsx` and `tailwind-merge`.
* **State Management & Data Fetching:** **Zustand** (client state) and **React Query v5** (server state/caching).
* **Routing:** **React Router v7**.
* **Maps & Visualizations:** **React Leaflet**, **Leaflet Heat**, **ApexCharts**, **Recharts**, and **React jVectorMap**.
* **Real-time Integration:** **Socket.io-client**.
* **Internationalization (i18n):** **i18next** and `react-i18next`.
* **Additional UI Libraries:** **FullCalendar**, **Lucide React**, and **React Dropzone**.

---

## 3. Mobile Application

The Mobile Application is designed for end-users on the go, providing access to Suraksha's features directly from their Android or iOS devices.

### Core Features & Modules
* **Emergency Alerts & Reporting:** Users can receive real-time push alerts and report incidents or damages directly from the app.
* **Location Gates & Safe Zones & Routing:** Guides users to safe zones using dynamic Safe Routes algorithms and location-based geofencing (Location Gates).
* **Preparedness & Education:** Dedicated screens providing resources and educational materials to prepare for disasters.
* **Family Safety Hub:** A specialized interface for family members to check in and report their safety status to each other.
* **Help Requests & Relief Tokens:** End-users can request help, find relief camps, and manage digital Relief Tokens for receiving aid.
* **Missing Persons & Donations:** Interfaces to browse/report missing persons and coordinate local donations.
* **Water Level Check:** Allows citizens to monitor real-time water levels near them.
* **Multi-Language Support:** Language screen for localized accessibility during crises.
* **Profile & Support Management:** Standard profile configuration and help/support centers.

### System Architecture
The app is built using the **Expo** framework on top of **React Native**, allowing for cross-platform deployment (iOS, Android, and Web) from a single codebase.

### Mobile Technologies (React Native + Expo)
* **Core Framework:** **React Native (v0.81.5)** powered by **Expo (SDK 54)** and **TypeScript**.
* **Styling:** **NativeWind v4** (Tailwind CSS v3.4 under the hood) and **React Native Paper** (Material Design).
* **Navigation:** **React Navigation v7** (Native Stack and Bottom Tabs).
* **State Management & Data Fetching:** Shares the exact same stack as the web frontend: **Zustand** and **React Query v5**.
* **Real-time Communication:** **Socket.io-client**.

### Hardware & Device Integrations (via Expo APIs)
The mobile app heavily leverages native device capabilities to function as a safety/tracking application:
* **Location & Geospatial:** **Expo Location** for background and foreground GPS tracking, combined with **React Native Maps**.
* **Camera & Media:** **Expo Camera** and **Expo Image Picker**.
* **Notifications & Background Tasks:** **Expo Notifications**, **Expo Background Fetch**, and **Expo Task Manager**.
* **Storage & Authentication:** **Expo Secure Store**, **AsyncStorage**, and **Expo Auth Session**.
* **Sensors & Utilities:** **Expo Speech**, **Expo Crypto**, and **Expo SQLite**.

---

## Summary of the Ecosystem

The **Suraksha** system is a highly cohesive disaster management platform:
1. **Shared Knowledge Base:** Both apps use **TypeScript**, **Tailwind CSS**, **Zustand**, **React Query**, and **Socket.io**.
2. **Real-time & Geospatial Focus:** Heavily relies on live data tracking and mapping (`Leaflet`, `React Native Maps`, `ngeohash`, `@turf/turf`).
3. **Enterprise-ready Backend:** The Express backend is robustly equipped with Prisma, PostgreSQL, scheduling, document generation, and multi-channel notifications, serving as a powerful centralized brain for both applications.
