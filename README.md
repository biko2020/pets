# Pet Professionals Platform

A multilingual, responsive web platform for pet professionals to create and manage their profiles. The platform supports various categories of pet services including veterinary care, grooming, pet hotels, and more.

## Features

- Multi-language support
- Responsive design
- Professional profile management
- Photo upload and management
- Category-based service listing
- Secure authentication
- Dashboard interface

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MySQL
- Authentication: JWT
- File Storage: Local storage with multer

## Setup Instructions

1. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the variables with your configuration

3. Initialize the database:
   ```bash
   cd backend
   npm run db:migrate
   ```

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm start
   ```

## Project Structure

```
pets/
├── backend/           # Node.js backend
├── frontend/          # React frontend
├── uploads/           # File uploads directory
└── README.md         # Project documentation
```
