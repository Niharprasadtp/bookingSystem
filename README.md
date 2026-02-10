# Appointment Booking System

A full-stack MERN (MongoDB, Express, React, Node.js) application designed for service-based businesses (salons, clinics, etc.) to manage appointments. It features a dual-role system for **Service Providers** to manage availability and **Users** to book real-time slots.

## 🌟 Key Features

* **User & Provider Roles:** Separate dashboards for clients and service providers.
* **Dynamic Availability:** Providers can set working hours and days off.
* **Smart Slot Generation:** The system automatically calculates available time slots based on service duration and existing bookings.
* **Appointment Management:** Users can cancel upcoming bookings; Providers can accept or reject pending requests.
* **Real-time Status:** Visual calendar with color-coded statuses (Pending, Confirmed, Cancelled).

---

## 🚀 How to Run

### Prerequisites
* [Node.js](https://nodejs.org/) (v14 or higher)
* [MongoDB](https://www.mongodb.com/) (Local or Atlas Cloud)

### 1. Backend Setup
1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `backend` directory and add the following:
    ```env
    PORT=4000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key_here
    ```
    > **Note:** A MongoDB Atlas connection string is recommended for the best experience, but a local instance (`mongodb://127.0.0.1:27017/booking_db`) works as well.

4.  Start the server:
    ```bash
    npm run dev
    ```
    *The server should run on http://localhost:4000*

### 2. Frontend Setup
1.  Open a new terminal and navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory:
    ```env
    VITE_API_URL=http://localhost:4000/api
    ```
4.  Start the React app:
    ```bash
    npm run dev
    ```
    *Open the link provided (usually http://localhost:5173) to view the app.*

---

## 🧠 Booking Logic & Architecture

The core of this application is the **Slot Generation Algorithm** located in `backend/controllers/slotController.js`. It ensures no double-bookings occur and respects variable service durations.

**The Algorithm Flow:**
1.  **Inputs:** Provider ID, Service ID, and Selected Date.
2.  **Schedule Retrieval:** The system fetches the Provider's specific schedule for that day of the week (e.g., Tuesday: 9:00 AM - 5:00 PM).
3.  **Duration Lookup:** It retrieves the duration of the requested service (e.g., 45 minutes).
4.  **Collision Detection:**
    * The system fetches all *active* (non-cancelled) appointments for that provider on that date.
    * It converts all existing bookings into "busy intervals" (start time to end time).
5.  **Slot Iteration:**
    * The loop starts at the Provider's `startTime`.
    * It calculates a potential slot: `Current Time` to `Current Time + Service Duration`.
    * **Validation 1 (Past Time):** If the date is "Today", slots in the past are discarded.
    * **Validation 2 (Overlap):** It checks if the potential slot overlaps with any existing "busy interval".
    * If valid, the start time is added to the "Available" list.
    * The loop increments by 30 minutes and repeats until the `endTime` is reached.

---

## 📋 Assumptions

* **Time Step:** The booking interface offers slots in 30-minute intervals (e.g., 10:00, 10:30) for simplicity, though the backend logic supports variable durations.
* **Time Zone:** The application currently relies on the server and browser's local time. Cross-timezone scheduling is not yet implemented.
* **Currency:** All service prices are displayed in USD ($).
* **Roles:** A user chooses their role (Client vs. Provider) upon registration. This role is permanent for that account.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, React Big Calendar, Axios, React Hot Toast.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB (Mongoose Schema).
* **Authentication:** JWT (JSON Web Tokens) with HttpOnly cookies/local storage.