# NestJS REST API - Complete Application Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [File-by-File Documentation](#file-by-file-documentation)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Data Flow](#data-flow)
8. [Configuration](#configuration)

---

## Project Overview

**Project Name:** restapi_nestjs  
**Version:** 0.0.1  
**Framework:** NestJS (v11.0.1)  
**Language:** TypeScript  
**Database:** PostgreSQL (v13)  
**ORM:** Prisma v6.19.2  
**Port:** 3333 (default) or PORT env variable

### Purpose
A production-ready REST API for managing users, authentication, and bookmarks with JWT-based security, built with NestJS and PostgreSQL.

### Key Features
- User registration and authentication with JWT tokens
- Password hashing with Argon2
- User profile management
- Bookmark CRUD operations with ownership validation
- Global validation pipes
- Comprehensive error handling
- Full e2e testing with Pactum

---

## Architecture

### Architectural Pattern: Module-Based Architecture

```
AppModule (Root)
├── ConfigModule (Global)
├── AuthModule
│   ├── AuthController
│   ├── AuthService
│   ├── JwtStrategy (Passport)
│   └── JwtGuard
├── UserModule
│   ├── UserController
│   └── UserService
├── BookmarkModule
│   ├── BookmarkController
│   └── BookmarkService
└── PrismaModule (Global)
    └── PrismaService
```

### Design Patterns Used
- **Dependency Injection:** NestJS core feature for loose coupling
- **Service Layer Pattern:** Business logic separated from controllers
- **Guard Pattern:** JWT authentication guard for route protection
- **Strategy Pattern:** Passport JWT strategy
- **DTO Pattern:** Data Transfer Objects for validation and type safety
- **Decorator Pattern:** Custom `@GetUser()` decorator for extracting user

---

## Directory Structure

### Root Level Files & Folders

```
restapi_nestjs/
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
├── .prettierrc                   # Prettier code formatter config
├── docker-compose.yml            # Docker compose for PostgreSQL
├── eslint.config.mjs             # ESLint configuration
├── nest-cli.json                 # NestJS CLI configuration
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.build.json           # TypeScript build configuration
├── README.md                     # Project readme
├── DOCUMENTATION.md              # This file
├── dist/                         # Compiled JavaScript output
├── node_modules/                 # Installed dependencies
├── prisma/                       # Prisma ORM files
├── src/                          # Source code
└── test/                         # E2E tests
```

---

## File-by-File Documentation

### Configuration Files

#### `.env`
**Purpose:** Environment variables for the application

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestdb?schema=public"
JWT_SECRET="your_jwt_secret_key"
PORT=3333  # Optional, defaults to 3333
```

**Used By:**
- Prisma for database connection
- JwtStrategy for token signing
- Main bootstrap function for port binding

---

#### `package.json`
**Purpose:** Project metadata and npm dependencies

**Key Scripts:**
- `npm run start:dev` - Start development server with hot reload
- `npm run db:dev:restart` - Reset database and apply migrations
- `npm run test:e2e` - Run e2e tests
- `npm run lint` - Run ESLint with auto-fix
- `npm run build` - Build for production
- `npm run start:prod` - Run production build

**Key Dependencies:**
- `@nestjs/common` - Core NestJS decorators and utilities
- `@nestjs/core` - Core NestJS framework
- `@nestjs/jwt` - JWT module for token handling
- `@nestjs/passport` - Passport integration
- `@prisma/client` - Prisma ORM client
- `argon2` - Password hashing
- `class-validator` - DTO validation
- `passport-jwt` - JWT strategy for Passport

---

#### `tsconfig.json`
**Purpose:** TypeScript compiler configuration

**Key Settings:**
- `target: ES2023` - Modern ECMAScript target
- `module: nodenext` - Node.js module resolution
- `moduleResolution: nodenext` - Modern module resolution
- `strict: true` - Strict type checking
- `outDir: ./dist` - Output directory for compiled code

---

#### `nest-cli.json`
**Purpose:** NestJS CLI configuration

Specifies the source root as `src/` and enables output deletion before build.

---

#### `docker-compose.yml`
**Purpose:** Docker container orchestration for development

**Services:**
- PostgreSQL v13
  - Port: 5432
  - Username: postgres
  - Password: postgres
  - Database: nestdb

**Commands:**
```bash
docker compose up db -d        # Start database
docker compose rm db -s -f -v  # Remove database
```

---

#### `eslint.config.mjs`
**Purpose:** Code quality and style enforcement

Ensures consistent code formatting and catches potential errors before runtime.

---

#### `.prettierrc`
**Purpose:** Code formatting rules

Maintains consistent code style across the project.

---

### Source Code Structure (`/src`)

#### Main Application Files

##### `main.ts`
**Purpose:** Application entry point

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // Removes properties not defined in DTOs
    }),
  );
  await app.listen(process.env.PORT ?? 3333);
}
```

**Responsibilities:**
- Creates NestJS application instance
- Configures global validation pipe
- Listens on specified port

---

##### `app.module.ts`
**Purpose:** Root module that imports all feature modules

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    BookmarkModule,
    PrismaModule,
  ],
})
export class AppModule {}
```

**Imports:**
- `ConfigModule` - Loads .env variables globally
- `AuthModule` - Authentication functionality
- `UserModule` - User management
- `BookmarkModule` - Bookmark management
- `PrismaModule` - Database service

---

### Authentication Module (`/src/authentication`)

#### `auth.module.ts`
**Purpose:** Feature module for authentication

```typescript
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
```

**Provides:**
- Authentication endpoints
- JWT token generation
- User registration and login

---

#### `auth.controller.ts`
**Purpose:** HTTP request handler for authentication

**Endpoints:**
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user

**Request/Response:**
```typescript
// Request Body (both endpoints)
{
  email: string;
  password: string;
}

// Response
{
  access_token: string;
}
```

---

#### `auth.service.ts`
**Purpose:** Business logic for authentication

**Methods:**
- `register(dto)` - Create new user with hashed password
- `login(dto)` - Validate credentials and generate JWT token
- `signToken(userId, email)` - Generate JWT token with 15-minute expiration

**Features:**
- Argon2 password hashing
- Unique email constraint validation
- JWT token generation with payload (sub, email)
- Error handling for duplicate emails and invalid credentials

**Important Code:**
```typescript
async signToken(userId: number, email: string) {
  const payload = { sub: userId, email };
  const secret = this.config.get<string>('JWT_SECRET');
  const token = await this.jwt.signAsync(payload, {
    expiresIn: '15m',
    secret: secret,
  });
  return { access_token: token };
}
```

---

#### Authentication Subdirectory: `guard/`

##### `jwt.guard.ts`
**Purpose:** Passport Guard for JWT authentication

```typescript
export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}
```

**Usage:** Applied with `@UseGuards(JwtGuard)` decorator on protected routes

**Functionality:**
- Extracts JWT token from Authorization header (Bearer token)
- Validates token signature using JWT_SECRET
- Passes decoded payload to JwtStrategy.validate()
- Returns 401 Unauthorized if token is invalid or missing

---

##### `guard/index.ts`
**Purpose:** Barrel export for guards

```typescript
export * from './jwt.guard';
```

---

#### Authentication Subdirectory: `strategy/`

##### `jwt.strategy.ts`
**Purpose:** Passport JWT Strategy for token validation

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  validate(payload: { sub: number; email: string }) {
    return payload;
  }
}
```

**Configuration:**
- Extracts JWT from "Authorization: Bearer {token}" header
- Uses JWT_SECRET from environment
- Validates token expiration

**Payload Validation:**
- `sub` - User ID
- `email` - User email

---

##### `strategy/index.ts`
**Purpose:** Barrel export for strategies

---

#### Authentication Subdirectory: `decorator/`

##### `get-user.decorator.ts`
**Purpose:** Custom NestJS parameter decorator

```typescript
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Usage:** `@GetUser() user: User` or `@GetUser('id') userId: number`

**Functionality:**
- Extracts user object from request (set by JwtGuard)
- Can extract specific properties if data parameter is provided
- Used in protected routes to access authenticated user

---

##### `decorator/index.ts`
**Purpose:** Barrel export for decorators

---

#### Authentication Subdirectory: `dto/`

##### `authentication.dto.ts`
**Purpose:** Data validation for authentication endpoints

```typescript
export class AuthenticationDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
```

**Validation Rules:**
- `email` - Must be valid email format and not empty
- `password` - Must be string and not empty

**Used By:**
- `POST /auth/signup`
- `POST /auth/signin`

**Benefits:**
- Automatic validation via GlobalPipe
- Type safety in service layer
- Clear API documentation

---

##### `dto/index.ts`
**Purpose:** Barrel export for DTOs

---

### User Module (`/src/user`)

#### `user.module.ts`
**Purpose:** Feature module for user management

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

**Provides:**
- User profile endpoints
- User update functionality

---

#### `user.controller.ts`
**Purpose:** HTTP request handler for user operations

**Endpoints:**
- `GET /users/me` - Get current authenticated user profile
- `PATCH /users` - Update user profile

**Protected Route Example:**
```typescript
@HttpCode(HttpStatus.OK)
@UseGuards(JwtGuard)
@Get('me')
getMe(@GetUser() user: User) {
  return user;
}
```

**Features:**
- JWT authentication via JwtGuard
- GetUser decorator for accessing authenticated user
- HTTP status code control

---

#### `user.service.ts`
**Purpose:** Business logic for user operations

**Methods:**
- `editUser(userId, dto)` - Update user information

**Features:**
- Updates user in database
- Removes password hash from response
- Uses Prisma for database operations

---

#### User Subdirectory: `dto/`

##### `edit-user.dto.ts`
**Purpose:** Data validation for user profile updates

```typescript
export class EditUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
```

**Validation Rules:**
- All fields optional
- `email` - Valid email if provided
- `firstName`/`lastName` - String if provided

**Flexibility:** User can update any combination of fields

---

##### `dto/index.ts`
**Purpose:** Barrel export for DTOs

---

### Bookmark Module (`/src/bookmark`)

#### `bookmark.module.ts`
**Purpose:** Feature module for bookmark management

```typescript
@Module({
  controllers: [BookmarkController],
  providers: [BookmarkService],
})
export class BookmarkModule {}
```

**Provides:**
- Complete CRUD operations for bookmarks
- Bookmark ownership validation

---

#### `bookmark.controller.ts`
**Purpose:** HTTP request handler for bookmark operations

**Endpoints:**
- `GET /bookmarks` - Get all bookmarks for authenticated user
- `GET /bookmarks/:id` - Get specific bookmark by ID
- `POST /bookmarks` - Create new bookmark
- `PATCH /bookmarks/:id` - Update bookmark
- `DELETE /bookmarks/:id` - Delete bookmark

**All routes protected with JwtGuard**

**Key Features:**
- `@UseGuards(JwtGuard)` on class level protects all routes
- `@GetUser('id')` extracts user ID for ownership validation
- `@Param('id', ParseIntPipe)` validates ID is integer
- `@HttpCode(HttpStatus.NO_CONTENT)` for DELETE returns 204

---

#### `bookmark.service.ts`
**Purpose:** Business logic for bookmark operations

**Methods:**

##### `getBookmarks(userId: number)`
Retrieves all bookmarks for a user

```typescript
getBookmarks(userId: number) {
  return this.prisma.bookmark.findMany({
    where: { userId },
  });
}
```

##### `getBookmarkById(userId: number, bookmarkId: number)`
Retrieves specific bookmark with ownership check

```typescript
getBookmarkById(userId: number, bookmarkId: number) {
  return this.prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId },
  });
}
```

##### `createBookmark(userId: number, dto: CreateBookmarkDto)`
Creates new bookmark with automatic user association

```typescript
async createBookmark(userId: number, dto: CreateBookmarkDto) {
  const bookmark = await this.prisma.bookmark.create({
    data: {
      userId,
      ...dto,
    },
  });
  return bookmark;
}
```

##### `editBookmarkById(userId: number, bookmarkId: number, dto: EditBookmarkDto)`
Updates bookmark with ownership verification

```typescript
async editBookmarkById(
  userId: number,
  bookmarkId: number,
  dto: EditBookmarkDto,
) {
  const bookmark = await this.prisma.bookmark.findUnique({
    where: { id: bookmarkId },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new ForbiddenException('Access to resources denied');
  }

  return this.prisma.bookmark.update({
    where: { id: bookmarkId },
    data: { ...dto },
  });
}
```

##### `deleteBookmarkById(userId: number, bookmarkId: number)`
Deletes bookmark with ownership verification

```typescript
async deleteBookmarkById(userId: number, bookmarkId: number) {
  const bookmark = await this.prisma.bookmark.findUnique({
    where: { id: bookmarkId },
  });

  if (!bookmark || bookmark.userId !== userId) {
    throw new ForbiddenException('Access to resources denied');
  }

  await this.prisma.bookmark.delete({
    where: { id: bookmarkId },
  });
}
```

**Security Features:**
- Ownership validation for edit and delete
- Query filtering by userId for read operations
- ForbiddenException for unauthorized access attempts

---

#### Bookmark Subdirectory: `dto/`

##### `create-bookmark.dto.ts`
**Purpose:** Data validation for bookmark creation

```typescript
export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  link: string;
}
```

**Validation Rules:**
- `title` - Required string
- `description` - Optional string
- `link` - Required string (URL)

---

##### `edit-bookmark.dto.ts`
**Purpose:** Data validation for bookmark updates

```typescript
export class EditBookmarkDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  link?: string;
}
```

**Flexibility:** All fields optional, user can update any combination

---

##### `dto/index.ts`
**Purpose:** Barrel export for DTOs

```typescript
export * from './create-bookmark.dto';
export * from './edit-bookmark.dto';
```

---

### Prisma Module (`/src/prisma`)

#### `prisma.module.ts`
**Purpose:** Global module providing database service

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Key Decorator:**
- `@Global()` - Makes PrismaService available everywhere without importing

**Benefits:**
- Single database connection instance
- Centralized connection management
- Automatic export to all modules

---

#### `prisma.service.ts`
**Purpose:** Prisma Client wrapper and database connection

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
    });
  }

  cleanDb() {
    return this.$transaction([
      this.bookmark.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
```

**Features:**
- Extends PrismaClient for full ORM functionality
- Injects DATABASE_URL from config
- Provides `cleanDb()` utility for testing

**Methods:**
- `this.user` - Access User model operations
- `this.bookmark` - Access Bookmark model operations
- `this.$transaction()` - Execute multiple operations atomically

---

### Generated Files (`/src/generated/prisma`)

**Purpose:** Auto-generated Prisma client types and utilities

These files are generated by `prisma generate` command and should NOT be manually edited.

**Key Files:**
- `client.ts` - Main Prisma Client class
- `models.ts` - TypeScript models
- `enums.ts` - Enumeration types
- `models/User.ts` - User model types
- `models/Bookmark.ts` - Bookmark model types

---

### Prisma Configuration Files (`/prisma`)

#### `schema.prisma`
**Purpose:** Database schema definition

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id Int @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt()
  email String @unique
  hash String
  firstName String?
  lastName String?
  bookmarks Bookmark[]
  @@map("users")
}

model Bookmark {
  id Int @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt()
  title String
  description String?
  link String
  userId Int
  user User @relation(fields: [userId], references: [id])
  @@map("bookmarks")
}
```

**Key Elements:**

##### Generator
- Generates Prisma Client for TypeScript

##### DataSource
- Provider: PostgreSQL
- Connection URL from environment

##### User Model
- `id` - Auto-incrementing primary key
- `email` - Unique, for login
- `hash` - Argon2 password hash
- `firstName`/`lastName` - Optional profile fields
- `bookmarks` - Relation to user's bookmarks
- `@@map("users")` - Maps to lowercase table name

##### Bookmark Model
- `id` - Auto-incrementing primary key
- `title`, `link` - Required bookmark fields
- `description` - Optional field
- `userId` - Foreign key to User
- `user` - Relation to owner User
- `@@map("bookmarks")` - Maps to lowercase table name

---

#### `migrations/20260206195536_init/migration.sql`
**Purpose:** Initial database migration

Creates `users` and `bookmarks` tables with proper constraints:

```sql
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  "email" TEXT UNIQUE NOT NULL,
  "hash" TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT
);

CREATE TABLE "bookmarks" (
  "id" SERIAL PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "link" TEXT NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES "users"("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
```

---

#### `migrations/migration_lock.toml`
**Purpose:** Migration history lock file

Prevents divergent migrations and maintains consistency.

---

### Test Files (`/test`)

#### `app.e2e-spec.ts`
**Purpose:** End-to-end integration tests

**Test Coverage:**

##### Authentication Tests
- Signup validation (email, password required)
- Signin validation (email, password required)
- Successful signup and signin
- JWT token generation and storage

##### User Tests
- Get current user profile
- Edit user information (firstName, email)
- Profile updates reflected in response

##### Bookmark Tests
- Create bookmark
- Get all bookmarks
- Get bookmark by ID
- Edit bookmark
- Delete bookmark
- Verify deletion (empty list)

**Testing Framework:** Pactum (HTTP testing library)

**Key Test Features:**
- Token storage: `.stores('userAt', 'access_token')`
- Bearer token usage: `Authorization: Bearer $S{userAt}`
- Response validation: `.expectStatus(200)`, `.expectBody([])`
- Request body: `.withBody(dto)`

---

## Database Schema

### ER Diagram

```
┌─────────────────────────────────────────┐
│              users                      │
├─────────────────────────────────────────┤
│ id (PK)          INT AUTO_INCREMENT     │
│ email            TEXT UNIQUE NOT NULL   │
│ hash             TEXT NOT NULL          │
│ firstName        TEXT NULLABLE          │
│ lastName         TEXT NULLABLE          │
│ createdAt        TIMESTAMP DEFAULT NOW  │
│ updatedAt        TIMESTAMP AUTO UPDATE  │
└─────────────────────────────────────────┘
           │
           │ 1:Many
           ▼
┌─────────────────────────────────────────┐
│              bookmarks                  │
├─────────────────────────────────────────┤
│ id (PK)          INT AUTO_INCREMENT     │
│ title            TEXT NOT NULL          │
│ description      TEXT NULLABLE          │
│ link             TEXT NOT NULL          │
│ userId (FK)      INT NOT NULL           │
│ createdAt        TIMESTAMP DEFAULT NOW  │
│ updatedAt        TIMESTAMP AUTO UPDATE  │
└─────────────────────────────────────────┘
```

### Relationships

**One-to-Many (User → Bookmark)**
- One user can have many bookmarks
- Each bookmark belongs to exactly one user
- Foreign key: `bookmarks.userId` references `users.id`
- Delete cascade option available (currently RESTRICT)

---

## API Endpoints

### Authentication Endpoints

#### POST /auth/signup
Register new user

```
Request:
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 201 Created
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Error: 400 Bad Request (validation failure)
Error: 403 Forbidden (email already exists)
```

#### POST /auth/signin
Login user

```
Request:
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Error: 400 Bad Request (validation failure)
Error: 403 Forbidden (invalid credentials)
```

---

### User Endpoints

#### GET /users/me
Get authenticated user profile

```
Request:
GET /users/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2026-02-06T10:00:00Z",
  "updatedAt": "2026-02-06T10:00:00Z"
}

Error: 401 Unauthorized (invalid/missing token)
```

#### PATCH /users
Update user profile

```
Request:
PATCH /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "email": "newemail@example.com"
}

Response: 200 OK
{
  "id": 1,
  "email": "newemail@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "createdAt": "2026-02-06T10:00:00Z",
  "updatedAt": "2026-02-06T11:30:00Z"
}

Error: 401 Unauthorized (invalid/missing token)
Error: 400 Bad Request (validation failure)
```

---

### Bookmark Endpoints

#### GET /bookmarks
Get all user's bookmarks

```
Request:
GET /bookmarks
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "title": "NestJS Guide",
    "description": "Complete NestJS tutorial",
    "link": "https://docs.nestjs.com",
    "userId": 1,
    "createdAt": "2026-02-06T10:00:00Z",
    "updatedAt": "2026-02-06T10:00:00Z"
  }
]

Error: 401 Unauthorized (invalid/missing token)
```

#### GET /bookmarks/:id
Get specific bookmark

```
Request:
GET /bookmarks/1
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "title": "NestJS Guide",
  "description": "Complete NestJS tutorial",
  "link": "https://docs.nestjs.com",
  "userId": 1,
  "createdAt": "2026-02-06T10:00:00Z",
  "updatedAt": "2026-02-06T10:00:00Z"
}

Error: 401 Unauthorized (invalid/missing token)
Error: 404 Not Found (bookmark not owned by user)
```

#### POST /bookmarks
Create new bookmark

```
Request:
POST /bookmarks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "React Hooks",
  "description": "Advanced React patterns",
  "link": "https://react.dev/reference/react"
}

Response: 201 Created
{
  "id": 2,
  "title": "React Hooks",
  "description": "Advanced React patterns",
  "link": "https://react.dev/reference/react",
  "userId": 1,
  "createdAt": "2026-02-06T11:30:00Z",
  "updatedAt": "2026-02-06T11:30:00Z"
}

Error: 401 Unauthorized (invalid/missing token)
Error: 400 Bad Request (validation failure)
```

#### PATCH /bookmarks/:id
Update bookmark

```
Request:
PATCH /bookmarks/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}

Response: 200 OK
{
  "id": 1,
  "title": "Updated Title",
  "description": "Updated description",
  "link": "https://docs.nestjs.com",
  "userId": 1,
  "createdAt": "2026-02-06T10:00:00Z",
  "updatedAt": "2026-02-06T12:00:00Z"
}

Error: 401 Unauthorized (invalid/missing token)
Error: 403 Forbidden (not owner of bookmark)
Error: 400 Bad Request (validation failure)
```

#### DELETE /bookmarks/:id
Delete bookmark

```
Request:
DELETE /bookmarks/1
Authorization: Bearer {token}

Response: 204 No Content
(empty body)

Error: 401 Unauthorized (invalid/missing token)
Error: 403 Forbidden (not owner of bookmark)
```

---

## Data Flow

### Authentication Flow

```
1. User submits signup/signin request
   ↓
2. AuthController receives request
   ↓
3. ValidationPipe validates DTO
   ↓
4. AuthService processes request
   - For signup: Hash password with Argon2, check unique email
   - For signin: Find user, verify password match
   ↓
5. Generate JWT token with payload (sub, email)
   ↓
6. Return access_token to client
   ↓
7. Client stores token (typically in localStorage)
```

### Authenticated Request Flow

```
1. Client sends request with "Authorization: Bearer {token}" header
   ↓
2. JwtGuard intercepts request
   ↓
3. JwtGuard extracts token from Authorization header
   ↓
4. Token validated against JWT_SECRET
   ↓
5. Token expiration checked (15 minutes)
   ↓
6. JwtStrategy.validate() called with decoded payload
   ↓
7. User object attached to request object
   ↓
8. @GetUser() decorator extracts user from request
   ↓
9. Controller receives user data
   ↓
10. Service layer uses userId for ownership validation
```

### Bookmark Operations Flow

```
Create Bookmark:
User Request → Controller → Service → Validate User ID → 
Create in DB → Return bookmark

Read Bookmarks:
User Request → Controller → Service → Query by User ID → 
Return bookmarks

Update Bookmark:
User Request → Controller → Service → Verify Ownership → 
Update in DB → Return updated bookmark

Delete Bookmark:
User Request → Controller → Service → Verify Ownership → 
Delete from DB → Return 204
```

---

## Configuration

### Environment Variables

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nestdb?schema=public"
JWT_SECRET="your_jwt_secret_key"
PORT=3333
```

**DATABASE_URL Components:**
- Protocol: `postgresql://`
- User: `postgres`
- Password: `postgres`
- Host: `localhost`
- Port: `5432`
- Database: `nestdb`
- Schema: `public`

### JWT Configuration

**Token Expiration:** 15 minutes
**Algorithm:** HS256 (HMAC with SHA-256)
**Payload:**
```javascript
{
  sub: userId,        // Subject (user ID)
  email: string,      // User email
  iat: timestamp,     // Issued at (auto-added by JWT)
  exp: timestamp      // Expiration time (auto-added by JWT)
}
```

### Validation Configuration

**Global ValidationPipe:**
- `whitelist: true` - Removes properties not defined in DTO
- Prevents accidental data injection
- Provides clear API contract

### Database Configuration

**Connection Pool:** Default (varies by driver)
**Transactions:** Supported via `$transaction()`
**Relations:** Eager loading via Prisma query options

---

## Development Commands

```bash
# Start development server with hot reload
npm run start:dev

# Reset database (remove and recreate)
npm run db:dev:restart

# Run e2e tests
npm run test:e2e

# Lint and fix code
npm run lint

# Format code with Prettier
npm run format

# Build for production
npm run build

# Run production build
npm run start:prod

# Run Prisma migrations
npm run prisma:dev:deploy

# Start Docker PostgreSQL
npm run db:dev:up

# Stop and remove Docker PostgreSQL
npm run db:dev:rm
```

---

## Security Considerations

### Password Security
- Passwords hashed with Argon2 (memory-hard algorithm)
- Hash never stored in plaintext
- Hash removed from all API responses

### Token Security
- JWT tokens with 15-minute expiration
- Secret key stored in environment variable (not in code)
- Bearer token extraction from Authorization header
- Token validation on every protected request

### Data Privacy
- User email marked UNIQUE (no duplicate registrations)
- Users can only access/modify their own bookmarks
- ForbiddenException thrown on unauthorized access attempts
- Password never returned in API responses

### Input Validation
- Global ValidationPipe with whitelist enabled
- DTOs define exact expected fields
- Invalid properties automatically rejected
- Type safety enforced at compile time

---

## Performance Considerations

### Database Queries
- Indexed queries by userId for fast retrieval
- Single query for bookmark fetching
- Ownership validation in query (findFirst with userId)

### JWT Tokens
- 15-minute expiration for security refresh cycle
- Payload kept minimal (sub, email only)
- Signature verification prevents tampering

### Caching Opportunities (Future)
- Cache user profile
- Cache bookmarks list per user
- Redis integration for session management

---

## Error Handling

### HTTP Status Codes
- `201 Created` - Resource successfully created
- `200 OK` - Request successful
- `204 No Content` - Successful deletion
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - Insufficient permissions or duplicate email
- `404 Not Found` - Resource not found

### Error Response Format
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### Exception Types
- `BadRequestException` - Validation failures
- `UnauthorizedException` - Missing/invalid auth
- `ForbiddenException` - Insufficient permissions
- `NotFoundException` - Resource not found
- `ConflictException` - Duplicate entry

---

## Testing Strategy

### E2E Test Coverage
- Authentication (signup, signin validation)
- User profile operations
- Bookmark CRUD operations
- Authorization checks
- Validation error handling

### Test Database
- Fresh database for each test run
- `prisma.cleanDb()` resets between tests
- Isolated test environment

### Test Tools
- **Pactum** - HTTP testing library
- **Jest** - Test runner (via E2E config)
- **Prisma** - Database setup/teardown

---

## Deployment Checklist

- [ ] Set `JWT_SECRET` to strong random value
- [ ] Configure `DATABASE_URL` for production database
- [ ] Set `PORT` environment variable
- [ ] Run database migrations
- [ ] Build application: `npm run build`
- [ ] Start production server: `npm run start:prod`
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS in production
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure CORS if needed
- [ ] Backup database regularly

---

## Troubleshooting

### Database Connection Issues
**Problem:** PrismaClientInitializationError
**Solution:** Verify DATABASE_URL is correct and PostgreSQL is running

### JWT Token Errors
**Problem:** Unauthorized on protected routes
**Solution:** Ensure token included in Authorization header as "Bearer {token}"

### Validation Errors
**Problem:** 400 Bad Request with validation messages
**Solution:** Check DTO requirements and ensure all required fields are provided

### Port Already in Use
**Problem:** Error: listen EADDRINUSE
**Solution:** Kill process on port 3333 or change PORT env variable

---

## Future Enhancements

- [ ] Refresh token mechanism
- [ ] Role-based access control (RBAC)
- [ ] Bookmark tags and categories
- [ ] Full-text search for bookmarks
- [ ] Bookmark sharing between users
- [ ] Rate limiting
- [ ] Request logging
- [ ] Caching layer (Redis)
- [ ] Pagination for bookmark lists
- [ ] Email verification on signup
- [ ] Password reset functionality
- [ ] Two-factor authentication

---

## Conclusion

This NestJS REST API provides a solid foundation for a bookmark management system with robust authentication, authorization, and data validation. The modular architecture allows for easy feature expansion and maintenance.

For more information, refer to:
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Passport.js Documentation](http://www.passportjs.org)
- [JWT Introduction](https://jwt.io/introduction)
