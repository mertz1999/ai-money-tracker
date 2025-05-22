# API Endpoints Documentation

This document describes all RESTful API endpoints for the AI Money Tracker backend.

---

## **Authentication & Users**

### Register a New User
- **POST** `/api/register`
- **Description:** Register a new user.
- **Input:**
  ```json
  {
    "username": "string",
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Output:**
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "created_at": "2024-06-01T12:00:00"
  }
  ```

### Login (Get JWT Token)
- **POST** `/api/token`
- **Description:** Login and receive a JWT access token.
- **Input:** (form data)
  - `username`: string
  - `password`: string
- **Output:**
  ```json
  {
    "access_token": "<JWT>",
    "token_type": "bearer"
  }
  ```

### Get Current User Info
- **GET** `/api/me`
- **Description:** Get info about the currently authenticated user.
- **Auth:** Bearer token required
- **Output:**
  ```json
  {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "created_at": "2024-06-01T12:00:00"
  }
  ```

---

## **Categories**

### Get All Categories
- **GET** `/api/categories`
- **Description:** List all available categories.
- **Output:**
  ```json
  [
    { "id": 1, "name": "Groceries" },
    { "id": 2, "name": "Entertainment" },
    ...
  ]
  ```

---

## **Sources**

### Get All Sources
- **GET** `/api/sources`
- **Description:** List all sources for the current user.
- **Auth:** Bearer token required
- **Output:**
  ```json
  [
    {
      "id": 1,
      "name": "Bank Account",
      "bank": true,
      "usd": false,
      "value": 1000.0
    },
    ...
  ]
  ```

### Add a New Source
- **POST** `/api/add_source`
- **Description:** Add a new source for the current user.
- **Auth:** Bearer token required
- **Input:**
  ```json
  {
    "name": "string",
    "bank": true,
    "usd": false,
    "value": 1000.0
  }
  ```
- **Output:**
  ```json
  {
    "id": 1,
    "message": "Source added successfully"
  }
  ```

---

## **Transactions**

### Get All Transactions
- **GET** `/api/transactions`
- **Description:** List all transactions for the current user.
- **Auth:** Bearer token required
- **Output:**
  ```json
  [
    {
      "id": 1,
      "name": "Groceries at Walmart",
      "date": "2024-06-01",
      "price": 50.0,
      "your_currency_rate": 60000.0,
      "is_usd": true,
      "category_id": 1,
      "source_id": 2,
      "category": "Groceries",
      "source": "Bank Account",
      "is_deposit": false
    },
    ...
  ]
  ```

### Add a New Expense Transaction
- **POST** `/api/add_transaction`
- **Description:** Add a new expense transaction.
- **Auth:** Bearer token required
- **Input:**
  ```json
  {
    "name": "string",
    "date": "YYYY-MM-DD",
    "price": 100.0,
    "is_usd": true,
    "category_id": 1,
    "source_id": 2
  }
  ```
- **Output:**
  ```json
  {
    "id": 1,
    "name": "string",
    "date": "YYYY-MM-DD",
    "price": 100.0,
    "is_usd": true,
    "category_id": 1,
    "source_id": 2,
    "category": "Groceries",
    "source": "Bank Account",
    "your_currency_rate": 60000.0
  }
  ```

### Add Income
- **POST** `/api/add_income`
- **Description:** Add an income transaction (deposit) to a source.
- **Auth:** Bearer token required
- **Input:**
  ```json
  {
    "name": "string",
    "date": "YYYY-MM-DD",
    "price": 1000.0,
    "is_usd": true,
    "category_name": "income",
    "source_name": "Bank Account",
    "is_deposit": true
  }
  ```
- **Output:**
  ```json
  {
    "id": 1,
    "message": "Income added successfully"
  }
  ```

### Delete a Transaction
- **DELETE** `/api/transactions/{transaction_id}`
- **Description:** Delete a transaction by its ID.
- **Auth:** Bearer token required
- **Output:**
  ```json
  {
    "message": "Transaction deleted successfully"
  }
  ```

---

## **AI & Utility Endpoints**

### Parse Transaction Description (AI)
- **POST** `/api/parse_transaction`
- **Description:** Use AI to parse a transaction description and extract structured data.
- **Auth:** Bearer token required
- **Input:**
  ```json
  {
    "text": "I spent 50 dollars on groceries at Walmart"
  }
  ```
- **Output:**
  ```json
  {
    "name": "Groceries at Walmart",
    "date": "2024-06-01",
    "price": 50.0,
    "is_usd": true,
    "category_name": "Groceries",
    "source_name": "Bank Account",
    "notes": null,
    "is_deposit": false
  }
  ```

### Get Exchange Rate
- **GET** `/api/exchange_rate?live=false`
- **Description:** Get the current USD to Toman exchange rate (cached by default, set `live=true` for a fresh fetch).
- **Output:**
  ```json
  {
    "rate": 60000.0,
    "timestamp": "2024-06-01T12:00:00"
  }
  ```

---

## **System & Health**

### Health Check
- **GET** `/health`
- **Description:** Check if the API is running.
- **Output:**
  ```json
  { "status": "healthy" }
  ```

### Root
- **GET** `/`
- **Description:** Welcome message for the API root.
- **Output:**
  ```json
  { "message": "Welcome to Money Tracker API" }
  ``` 