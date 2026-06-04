# AIDify

AIDify is an AI-powered study companion built for Kenyan university students. It combines a modern React frontend with a Node.js/Express backend and MongoDB storage to deliver authenticated chat sessions, Claude AI-powered question answering, tutoring assistance, and session history tracking.

## Project structure

- `AIDify/backend` — Express server, API routes, authentication, and MongoDB models.
- `AIDify/frontend` — React + Vite application for the user interface.
- `AIDify/README.md` — additional project setup notes.

## Key features

- User authentication (register/login)
- Chat-based AI tutoring experience
- Session history and chat persistence
- MongoDB database support
- Responsive React frontend

## Setup

### 1. Backend

```bash
cd AIDify/backend
npm install
npm run dev
```

### 2. Frontend

```bash
cd AIDify/frontend
npm install
npm run dev
```

## Environment

Be sure to configure the backend environment variables as required by the project. Typical values include:

- `MONGO_URI` — MongoDB connection URI
- `JWT_SECRET` — secret key for JSON Web Tokens
- `PORT` — backend server port (default usually `5000`)

## Notes

- The frontend runs separately from the backend and communicates with it through API requests.
- If the backend uses a custom port, update the frontend API base URL in `AIDify/frontend/src/services/api.js`.
- Ensure MongoDB is running before starting the backend.

## Contribution

Feel free to extend the app with additional AI features, improved user analytics, and better study tools tailored for students.

## License

Specify your project license here.