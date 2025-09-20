# PurFood Nutrition Plan API Documentation

## Overview
A comprehensive Express.js REST API for nutrition planning and meal tracking with user authentication, goal management, and meal history.

## Base URL
```
http://localhost:4000/api
```

## Authentication
The API uses JWT tokens stored in HTTP-only cookies for authentication. Include credentials in requests.

## Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- General endpoints: 100 requests per 15 minutes

## Endpoints

### Health Check
```http
GET /api/health
```
Returns server status and timestamp.

### Authentication

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "age": 25,
  "weight": 70,
  "height": 175,
  "activityLevel": "moderate",
  "dietaryRestrictions": ["vegetarian"]
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Logout
```http
POST /api/logout
```

#### Get Current User
```http
GET /api/me
```

### User Profile Management

#### Get User Profile
```http
GET /api/users/profile
Authorization: Required (Cookie)
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Required (Cookie)
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "age": 26,
  "weight": 65,
  "height": 170,
  "activityLevel": "active",
  "dietaryRestrictions": ["gluten-free"]
}
```

#### Delete User Account
```http
DELETE /api/users/profile
Authorization: Required (Cookie)
```

### Goals Management

#### Create Goal
```http
POST /api/goals
Authorization: Required (Cookie)
Content-Type: application/json

{
  "type": "weight_loss",
  "targetValue": 65,
  "currentValue": 70,
  "unit": "kg",
  "deadline": "2024-12-31",
  "description": "Lose 5kg by end of year"
}
```

#### Get User Goals
```http
GET /api/goals
Authorization: Required (Cookie)
```

#### Update Goal
```http
PUT /api/goals/:id
Authorization: Required (Cookie)
Content-Type: application/json

{
  "currentValue": 68,
  "description": "Updated progress"
}
```

#### Delete Goal
```http
DELETE /api/goals/:id
Authorization: Required (Cookie)
```

### Meal History Management

#### Log Meal
```http
POST /api/meals
Authorization: Required (Cookie)
Content-Type: application/json

{
  "name": "Breakfast Bowl",
  "foods": [
    {
      "name": "Oatmeal",
      "quantity": 50,
      "unit": "g",
      "calories": 190
    },
    {
      "name": "Banana",
      "quantity": 1,
      "unit": "piece",
      "calories": 105
    }
  ],
  "totalCalories": 295,
  "totalProtein": 8,
  "totalCarbs": 54,
  "totalFat": 3,
  "mealType": "breakfast",
  "consumedAt": "2024-01-15T08:00:00Z",
  "notes": "Healthy start to the day"
}
```

#### Get User Meals
```http
GET /api/meals?limit=20
Authorization: Required (Cookie)
```

#### Update Meal
```http
PUT /api/meals/:id
Authorization: Required (Cookie)
Content-Type: application/json

{
  "totalCalories": 300,
  "notes": "Updated calorie count"
}
```

#### Delete Meal
```http
DELETE /api/meals/:id
Authorization: Required (Cookie)
```

## Data Models

### User
```javascript
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "age": "number",
  "weight": "number",
  "height": "number",
  "activityLevel": "sedentary|light|moderate|active|very_active",
  "dietaryRestrictions": ["string"],
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### Goal
```javascript
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "targetValue": "number",
  "currentValue": "number",
  "unit": "string",
  "deadline": "ISO string",
  "description": "string",
  "isActive": "boolean",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### Meal
```javascript
{
  "id": "string",
  "userId": "string",
  "name": "string",
  "foods": [
    {
      "name": "string",
      "quantity": "number",
      "unit": "string",
      "calories": "number"
    }
  ],
  "totalCalories": "number",
  "totalProtein": "number",
  "totalCarbs": "number",
  "totalFat": "number",
  "mealType": "breakfast|lunch|dinner|snack",
  "consumedAt": "ISO string",
  "notes": "string",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with 24-hour expiration
- HTTP-only cookies for token storage
- CORS protection
- Helmet security headers
- Rate limiting
- Input validation
- SQL injection prevention (parameterized queries)

## Environment Variables

Create a `.env` file with:
```
PORT=4000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
COOKIE_SECRET=your_cookie_secret_key_change_this_too
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:4000`
