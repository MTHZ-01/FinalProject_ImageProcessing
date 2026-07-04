# Interactive Spatial-Domain Image Processing App

This project is a standalone image processing application with a React frontend and a Django backend using Channels for realtime WebSocket-based filtering.

## Project Structure

- `frontend/`: React app built with Vite and optional Electron support.
- `backend/`: Django backend with Channels and image processing logic.

## Prerequisites

- Node.js (recommended v18+)
- Python 3.10+ or compatible
- `npm` and `pip`

## Backend Setup

1. Open a terminal and change directory to `backend/`.

2. Create and activate a Python virtual environment:

   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

4. Apply Django migrations:

   ```powershell
   python manage.py migrate
   ```

5. Start the Django backend server:

   ```powershell
   python manage.py runserver 127.0.0.1:8000
   ```

6. Confirm it is running by visiting:

   ```text
   http://127.0.0.1:8000/
   ```

## Frontend Setup

1. Open a separate terminal and change directory to `frontend/`.

2. Install frontend dependencies:

   ```powershell
   npm install
   ```

3. Start the Vite development server:

   ```powershell
   npm run dev
   ```

4. Open the application in the browser:

   ```text
   http://localhost:5173
   ```

## Running the Full App

- Start the backend first on `127.0.0.1:8000`.
- Then start the frontend on `localhost:5173`.
- The React app connects to the backend for realtime filter execution.

## Notes

- The backend uses Django Channels for WebSocket-based image processing.
- The frontend can send filter requests and receive processed images in realtime.
- If you want a production build, you can run `npm run build` in the frontend.

## Troubleshooting

- If the frontend cannot connect to backend, verify backend is running and accessible.
- If dependencies fail to install, check your Node.js and Python versions.
- If the backend fails to start, make sure the Python virtual environment is activated and `requirements.txt` installs successfully.
