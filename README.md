
# Project ShopApp Admin Backend (NestJS)

## Functions

This project serves as the backend for the ShopApp Admin Panel, providing the necessary API endpoints and services for managing users, products, orders, feedback, and more. The core functionalities include:

- **User Management**: Create, update, and delete users.
- **Product Management**: Manage product listings, categories, and sizes.
- **Order Management**: Handle order creation, updating, and status management.
- **Real-time Features**: Leverage WebSocket for real-time notifications.
- **Authentication**: Google Authentication integration.

## Technologies

- **Backend Framework**: NestJS (Node.js framework for building efficient, reliable, and scalable server-side applications)
- **Language**: TypeScript
- **Database**: Supports various databases with Sequelize ORM (MySQL, PostgreSQL, etc.)
- **Authentication**: Google OAuth, JWT
- **Real-time Communication**: Socket.io
- **Cloud**: Google Cloud for key management (via `gcs-key.json`)
- **Utilities**: Custom utilities for mail and text processing

## Requirements

- **Node.js** (version >= 14.0.0)
- **NestJS CLI** (for development)
- **Database**: MongoDB
- **Google Cloud**: For managing authentication and Google Cloud integration

### Steps to Set Up Environment:

1. Clone the repository:
   ```bash
   git clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` and configure your environment variables (e.g., database connection, Google Cloud credentials).

4. Run the development server:
   ```bash

   cd backend-nestjs -> npm run start:dev
   ```

5. Visit `http://localhost:9090/api` to access the API.

## How to Run

1. **For Local Development**:
   Ensure that your `.env` file is set up correctly, including any database or API keys. Then, run:
   ```bash
   npm run start:dev
   ```

2. **For Production**:
   To build and run the application in production mode:
   ```bash
   npm run build
   npm run start:prod
   ```

---
