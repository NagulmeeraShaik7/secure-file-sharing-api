# Secure File Sharing System

This is a secure file-sharing system built using **Node.js**, **Express.js**, and **SQLite**. The system provides two types of users: **Ops Users** and **Client Users**, with distinct roles and functionalities.

## Features

- **Ops User**:
  - Login to the system.
  - Upload files (`.pptx`, `.docx`, `.xlsx`).

- **Client User**:
  - Sign up and receive a secure verification link.
  - Verify email.
  - Login to the system.
  - List all uploaded files.
  - Download files securely using an encrypted URL.

## Prerequisites

- **Node.js** (v14 or higher)
- **SQLite3**

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
Install dependencies:

bash
Copy code
npm install
Run the application:

bash
Copy code
node app.js
The server runs on http://localhost:3000.

# API Endpoints
Ops User Endpoints
Login
Endpoint:` POST /ops/login`
Request:
json

`
{
  "email": "ops_user@example.com",
  "password": "ops_password"
}`

`Response:
json
{
  "token": "<jwt-token>"
}`


# Upload File
Endpoint: `POST /ops/upload`
Headers:
makefile

Authorization: `Bearer <token>`
Request:
`Form-data:
file: .pptx, .docx, .xlsx file`

`Response:
json

{
  "message": "File uploaded successfully"
}`

# Client User Endpoints
Sign Up
Endpoint: `POST /client/signup`
Request:
json

`{
  "email": "client@example.com",
  "password": "password123"
}`

`Response:
json

{
  "verificationLink": "<encrypted-link>",
  "message": "Sign up successful"
}`


# Login
Endpoint: `POST /client/login`
Request:
json
`
{
  "email": "client@example.com",
  "password": "password123"
}
Response:
json

{
  "token": "<jwt-token>"
}`

# List Files
Endpoint: `GET /client/files`
Headers:
`Authorization: Bearer <token>`
`Response:
json

{
  "files": [
    {
      "id": 1,
      "filename": "example.pptx",
      "uploader_id": 1,
      "upload_time": "2024-11-15 10:00:00"
    }
  ]
}`

# Download File
Endpoint: `GET /client/download/:id`
Headers:

`Authorization: Bearer <token>`

`Response:
json

{
  "downloadLink": "<encrypted-link>",
  "message": "success"
}`
# Database Schema
   # Users Table
  `Column	Type	Description
  id	INTEGER	Primary key
  email	TEXT	User email (unique)
  password	TEXT	User password
  role	TEXT	ops or client role
  isVerified	INTEGER	Email verification flag`
  
# Files Table
`Column	Type	Description
id	INTEGER	Primary key
filename	TEXT	Name of the uploaded file
uploader_id	INTEGER	ID of the uploader
upload_time	DATETIME	Timestamp of the upload`

Security Notes
Encryption:

Sensitive data such as URLs is encrypted using crypto.
JWT Authentication:

Token-based authentication is implemented for secure access control.
File Type Validation:

Only .pptx, .docx, and .xlsx file types are allowed for upload.
Running Tests
You can test the endpoints using tools like Postman or cURL. Ensure the server is running locally at http://localhost:3000.

