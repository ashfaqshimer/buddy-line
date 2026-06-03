# Technical Specification Document

## Realtime Chat Application

Version: 1.0
Author: Shimer
Project Type: Portfolio / Production-grade Learning Project
Architecture Style: Modular Monolith (Evolution-ready)

---

# 1. Project Overview

## 1.1 Objective

Build a scalable realtime chat application using modern engineering best practices while maintaining production-quality standards.

The application initially supports direct messaging between a small number of users but is architected for future scalability into a distributed system.

Primary goals:

* Learn scalable system design
* Implement industry-grade backend architecture
* Practice realtime communication systems
* Gain DevOps and deployment experience
* Build a senior-level portfolio project

---

# 2. Core Functional Requirements

## 2.1 Authentication

* User registration
* User login
* JWT authentication
* Refresh token rotation
* Logout functionality
* Password hashing using bcrypt
* HttpOnly cookie support

## 2.2 Messaging

* Direct user-to-user messaging
* Realtime message delivery
* Message persistence
* Message history retrieval
* Message pagination
* Message edit/delete
* Delivery indicators
* Read receipts

## 2.3 Presence System

* Online/offline status
* Last seen timestamp
* Typing indicators
* Active socket tracking

## 2.4 Media

* Image upload support
* Image preview
* File size validation
* Secure upload handling

## 2.5 System Features

* Rate limiting
* Logging
* Health checks
* Monitoring readiness
* Error handling
* Input validation

---

# 3. Non-Functional Requirements

## 3.1 Scalability

* Horizontally scalable websocket layer
* Redis-backed socket synchronization
* Stateless API services
* Queue-ready architecture

## 3.2 Security

* OWASP-aligned practices
* JWT expiration handling
* Refresh token rotation
* CSRF protection
* Rate limiting
* Secure password hashing
* Input sanitization

## 3.3 Maintainability

* Modular architecture
* Strict TypeScript usage
* Layered backend design
* Shared types package
* Standardized coding practices

## 3.4 Reliability

* Graceful error handling
* Structured logging
* Health endpoints
* Retry-ready queue design

---

# 4. High-Level Architecture

## 4.1 Frontend

Technology:

* Next.js
* TypeScript
* Tailwind CSS
* React Query
* Zustand

Responsibilities:

* UI rendering
* Authentication state
* Websocket client handling
* API communication
* Optimistic UI updates

---

## 4.2 Backend

Technology:

* Node.js
* Express.js
* Socket.IO
* TypeScript

Responsibilities:

* REST API
* Authentication
* Realtime communication
* Business logic
* Database interaction

---

## 4.3 Database

Technology:

* PostgreSQL
* Prisma ORM

Responsibilities:

* User persistence
* Message storage
* Session storage
* Conversation tracking

---

## 4.4 Infrastructure

Technology:

* Redis
* BullMQ
* Docker
* Nginx

Responsibilities:

* Socket scaling
* Queue management
* Reverse proxy
* Caching
* Containerization

---

# 5. System Architecture Pattern

## 5.1 Architecture Style

Modular Monolith

Benefits:

* Easier local development
* Simpler deployment
* Lower operational complexity
* Future microservice extraction support

---

## 5.2 Backend Layer Structure

Request Flow:

Controller
→ Service
→ Repository
→ Database

### Controllers

Responsibilities:

* Request parsing
* Validation handling
* Response formatting

### Services

Responsibilities:

* Business logic
* Transaction orchestration
* Domain rules

### Repositories

Responsibilities:

* Database queries
* Persistence abstraction

---

# 6. Monorepo Structure

```txt
chat-app/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── shared-types/
│   ├── eslint-config/
│   ├── tsconfig/
│   └── ui/
│
├── docker/
├── scripts/
└── docs/
```

---

# 7. Backend Folder Structure

```txt
src/
├── config/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── chat/
│   ├── messages/
│   ├── presence/
│   └── uploads/
│
├── infrastructure/
│   ├── database/
│   ├── redis/
│   ├── queues/
│   └── sockets/
│
├── middleware/
├── utils/
├── types/
└── server.ts
```

---

# 8. Frontend Folder Structure

```txt
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── chat/
│   ├── messages/
│   └── presence/
│
├── hooks/
├── lib/
├── services/
├── stores/
├── types/
└── utils/
```

---

# 9. Database Design

## 9.1 Tables

### users

```txt
id
username
email
password_hash
avatar_url
created_at
updated_at
last_seen_at
```

### conversations

```txt
id
type
created_at
updated_at
```

### conversation_participants

```txt
id
conversation_id
user_id
joined_at
```

### messages

```txt
id
conversation_id
sender_id
content
message_type
edited_at
deleted_at
created_at
```

### message_reads

```txt
id
message_id
user_id
read_at
```

### refresh_tokens

```txt
id
user_id
token_hash
expires_at
created_at
revoked_at
```

---

# 10. Authentication Design

## 10.1 Authentication Flow

Login Flow:

1. User submits credentials
2. Server validates credentials
3. Access token generated
4. Refresh token generated
5. Refresh token stored hashed in DB
6. Tokens returned securely

---

## 10.2 Token Strategy

### Access Token

* Short-lived
* JWT
* Stored in memory

### Refresh Token

* Long-lived
* HttpOnly cookie
* Rotated on refresh

---

# 11. Realtime Architecture

## 11.1 Websocket Technology

Socket.IO

Reasons:

* Automatic reconnection
* Namespace support
* Room support
* Polling fallback
* Production maturity

---

## 11.2 Socket Events

### Client → Server

```txt
message:send
message:read
typing:start
typing:stop
presence:update
```

### Server → Client

```txt
message:new
message:delivered
message:read
typing:update
presence:update
```

---

## 11.3 Room Strategy

Conversation-based rooms:

```txt
conversation:<conversationId>
```

Each user joins:

* Personal room
* Conversation rooms

---

# 12. Redis Design

## 12.1 Usage

Redis responsibilities:

* Socket adapter
* Presence cache
* Rate limiting
* Queue backend

---

## 12.2 Future Scaling

Supports:

* Multiple websocket servers
* Distributed presence tracking
* Shared event broadcasting

---

# 13. Queue Architecture

## 13.1 BullMQ Queues

Planned queues:

* notification-queue
* email-queue
* image-processing-queue

---

## 13.2 Queue Use Cases

* Async notifications
* Image processing
* Background cleanup
* Analytics processing

---

# 14. API Design

## 14.1 REST API Structure

```txt
/api/v1/auth
/api/v1/users
/api/v1/conversations
/api/v1/messages
```

---

## 14.2 API Standards

### Response Format

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 14.3 Validation

Library:

* Zod

Validation areas:

* Request body
* Query params
* Environment variables
* Socket payloads

---

# 15. Error Handling

## 15.1 Standardized Errors

Structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

---

## 15.2 Logging

Library:

* Pino

Log Types:

* API logs
* Socket events
* Authentication events
* Errors
* Performance logs

---

# 16. Security Standards

## 16.1 Security Features

* Helmet middleware
* CORS restrictions
* Rate limiting
* SQL injection prevention
* XSS sanitization
* Secure cookies
* Environment variable isolation

---

## 16.2 Password Security

* bcrypt hashing
* Minimum complexity validation
* Brute-force protection

---

# 17. Rate Limiting

## 17.1 API Rate Limiting

Strategy:

* IP-based limiting
* Redis-backed counters

Examples:

```txt
Login:
5 requests / minute

Messaging:
60 requests / minute
```

---

# 18. File Upload Strategy

## 18.1 Upload Handling

Library:

* Multer

---

## 18.2 Storage Strategy

Initial:

* Local Docker volume

Future:

* S3-compatible object storage

---

# 19. Caching Strategy

## 19.1 Redis Caching

Cache candidates:

* User presence
* Session state
* Conversation metadata

---

# 20. DevOps Strategy

## 20.1 Containerization

Technology:

* Docker
* Docker Compose

Services:

* web
* api
* postgres
* redis
* nginx

---

## 20.2 Reverse Proxy

Technology:

* Nginx

Responsibilities:

* SSL termination
* Request forwarding
* Load balancing readiness

---

# 21. CI/CD Pipeline

## 21.1 GitHub Actions

Pipeline stages:

1. Install dependencies
2. Lint
3. Run tests
4. Build
5. Docker build
6. Deploy

---

# 22. Testing Strategy

## 22.1 Frontend Testing

* React Testing Library
* Playwright

---

## 22.2 Backend Testing

* Jest
* Supertest

---

## 22.3 Test Types

* Unit tests
* Integration tests
* API tests
* Socket tests

---

# 23. Observability

## 23.1 Monitoring

Initial:

* Health endpoints
* Structured logs

Future:

* Prometheus
* Grafana
* OpenTelemetry

---

## 23.2 Health Endpoints

```txt
/health
/health/db
/health/redis
```

---

# 24. Deployment Strategy

## 24.1 Initial Deployment

Frontend:

* Vercel

Backend:

* Railway or Fly.io

Database:

* Neon PostgreSQL

Redis:

* Upstash Redis

---

# 25. Environment Variables

## 25.1 Required Variables

```txt
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
PORT=
NODE_ENV=
```

---

# 26. Coding Standards

## 26.1 Standards

* Strict TypeScript
* ESLint
* Prettier
* Husky pre-commit hooks
* Conventional commits

---

# 27. Future Evolution Plan

## 27.1 Planned Advanced Features

* Group chat
* Push notifications
* Voice/video calling
* Message reactions
* Threading
* End-to-end encryption

---

## 27.2 Planned Infrastructure Evolution

* Kubernetes
* Horizontal scaling
* Microservice extraction
* Distributed tracing
* CDN integration

---

# 28. Microservice Extraction Candidates

Future services:

* auth-service
* realtime-service
* notification-service
* media-service

---

# 29. MVP Milestones

## Phase 1

* Project setup
* Authentication
* PostgreSQL integration

## Phase 2

* Realtime messaging
* Socket rooms
* Presence tracking

## Phase 3

* Image uploads
* Read receipts
* Message history

## Phase 4

* Dockerization
* Deployment
* Monitoring

## Phase 5

* Redis scaling
* Queue integration
* CI/CD

---

# 30. Recommended Libraries

## Frontend

* React Query
* Zustand
* Axios
* Socket.IO Client
* Zod

## Backend

* Express
* Prisma
* Socket.IO
* Redis
* BullMQ
* Pino
* Zod

---

# 31. Key Engineering Principles

1. Keep business logic out of controllers
2. Never couple sockets directly to DB queries
3. Maintain strict module boundaries
4. Prefer stateless services
5. Design for observability early
6. Build incrementally
7. Avoid premature microservices
8. Favor maintainability over cleverness

---

# 32. Conclusion

This project is intentionally designed as:

* production-capable
* portfolio-worthy
* incrementally scalable
* operationally realistic

The architecture prioritizes:

* maintainability
* clean boundaries
* scalability readiness
* developer experience
* real-world engineering practices

The application should evolve naturally from:
MVP → Production-ready Monolith → Distributed Architecture
