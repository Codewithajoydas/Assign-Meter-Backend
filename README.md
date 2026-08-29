# Assign Meter Backend

Backend API for the **Assign Meter** application.

Assign Meter is a workforce and equipment-management backend designed to manage electrical meters and related field equipment, assign equipment to field engineers/supervisors, track installation status, generate operational reports, process CSV/XLSX files, maintain equipment locations, provide real-time updates, and export operational data.

The backend is built with **Node.js, Express, MongoDB/Mongoose, JWT authentication, AWS S3, DuckDB, ExcelJS, Multer, and Server-Sent Events (SSE)**.

## Table of Contents

* [Overview](#overview)
* [Key Features](#key-features)
* [Technology Stack](#technology-stack)
* [Architecture](#architecture)
* [Project Structure](#project-structure)
* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Running the Server](#running-the-server)
* [Authentication](#authentication)
* [API Reference](#api-reference)

  * [Health Check](#health-check)
  * [Authentication APIs](#authentication-apis)
  * [Meter APIs](#meter-apis)
  * [Equipment Assignment APIs](#equipment-assignment-apis)
  * [Workforce APIs](#workforce-apis)
  * [Meter Status APIs](#meter-status-apis)
  * [Export APIs](#export-apis)
  * [Report APIs](#report-apis)
  * [Meter Location API](#meter-location-api)
  * [Notification API](#notification-api)
  * [BLE Device APIs](#ble-device-apis)
  * [Server-Sent Events](#server-sent-events)
  * [Invalid Meter API](#invalid-meter-api)
* [Database Models](#database-models)
* [Meter Lifecycle](#meter-lifecycle)
* [Report Generation](#report-generation)
* [File Processing](#file-processing)
* [Real-Time Updates](#real-time-updates)
* [Email Notifications](#email-notifications)
* [AWS S3 Integration](#aws-s3-integration)
* [Security](#security)
* [Error Handling](#error-handling)
* [Development](#development)
* [Production Considerations](#production-considerations)
* [Known Implementation Notes](#known-implementation-notes)
* [Future Improvements](#future-improvements)
* [License](#license)

---

# Overview

The Assign Meter Backend provides the server-side infrastructure for managing field operations around electrical meter deployment.

The application supports:

* User authentication
* Admin/workforce management
* Meter assignment
* NIC assignment
* SIM assignment
* Meter seal assignment
* Meter status processing
* Meter searching and filtering
* Meter location tracking
* BLE device tracking
* CSV/XLSX processing
* Unmapped-meter reporting
* Supervisor-specific reports
* Excel exports
* ZIP exports
* AWS S3 report storage
* Email notifications
* Push-notification token storage
* Real-time meter events using SSE

The server exposes REST APIs under `/api/*` and a Server-Sent Events endpoint under `/events`.

The main application entry point is `index.js`. The server connects to MongoDB during startup and registers all API routes from the `routes` directory.

---

# Key Features

## Authentication

The backend uses:

* JWT
* bcrypt password hashing
* Bearer-token authentication
* Admin authorization for workforce-management operations

JWTs generated during sign-in currently expire after **7 days**.

---

## Meter Management

The backend supports:

* Adding multiple meters at once
* Meter-number validation
* Duplicate detection
* Meter deletion
* Meter searching
* Meter filtering
* Pagination
* Sorting
* Status updates
* Supervisor-based filtering
* Package-based filtering
* Excel export

Meter numbers submitted through the assignment API are normalized and validated as seven-digit numeric values.

---

## Workforce Management

Administrators can:

* Create users
* View users
* Update users
* Delete users
* Change administrator privileges
* Reset user passwords

Workforce-management endpoints verify the current user's JWT and require administrator privileges.

---

## Equipment Assignment

The system separately tracks:

* Meters
* NIC devices
* SIM cards
* Meter seals
* BLE devices

This keeps equipment-specific attributes separate while still associating assignments with supervisors and installers.

---

## Reporting

The backend provides:

* Unmapped-meter report generation
* Supervisor-specific unmapped reports
* Last generated report retrieval
* Report last-modified information
* Pivot/report data access
* Excel exports
* ZIP exports

The unmapped report is generated using DuckDB and stored in AWS S3.

---

# Technology Stack

| Technology         | Purpose                         |
| ------------------ | ------------------------------- |
| Node.js            | JavaScript runtime              |
| Express 5          | HTTP server and REST API        |
| MongoDB            | Primary database                |
| Mongoose           | MongoDB ODM                     |
| JWT                | Authentication                  |
| bcrypt             | Password hashing                |
| CORS               | Cross-origin API access         |
| Cookie Parser      | Cookie handling                 |
| Multer             | Multipart/file uploads          |
| XLSX               | Spreadsheet parsing             |
| ExcelJS            | Excel generation                |
| Archiver           | ZIP generation                  |
| DuckDB             | CSV analytics/report processing |
| AWS SDK S3         | Cloud report storage            |
| Nodemailer         | Gmail-based email transport     |
| Resend             | Email notifications             |
| Server-Sent Events | Real-time browser updates       |

The current `package.json` defines Express 5, Mongoose 9, AWS S3 SDK, DuckDB, bcrypt, JWT, Multer, ExcelJS, XLSX, Archiver, Nodemailer, Resend and related dependencies.

---

# Architecture

The application follows a straightforward Express + MongoDB backend architecture.

```text
Client / Frontend
       |
       | HTTP / HTTPS
       v
+-----------------------+
|      Express API      |
+-----------------------+
       |
       +-------------------+
       |                   |
       v                   v
   JWT Auth            Route Handlers
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
          Models        Services       Utilities
             |
             v
        MongoDB
             
Additional integrations:

Express
   |
   +---- AWS S3
   |
   +---- DuckDB
   |
   +---- Resend / Nodemailer
   |
   +---- SSE
   |
   +---- ExcelJS / XLSX
```

---

# Project Structure

```text
Assign-Meter-Backend/
│
├── config/
│   ├── mongoose.js
│   ├── nodemailer.js
│   └── sse.config.js
│
├── doc/
│   └── plan.md
│
├── models/
│   ├── bleDevices.js
│   ├── meter.js
│   ├── meterLocation.js
│   ├── meterSeal.js
│   ├── nicDevice.js
│   ├── simCard.js
│   └── user.js
│
├── public/
│   └── web/
│
├── routes/
│   ├── assign/
│   │   ├── meter/
│   │   │   ├── deleteMeters.js
│   │   │   ├── download.js
│   │   │   ├── getMeterDetails.js
│   │   │   ├── meterAssign.js
│   │   │   ├── searchMeter.js
│   │   │   └── updateMeterStatus.js
│   │   │
│   │   ├── nicAssign.js
│   │   ├── sealAssign.js
│   │   └── simAssign.js
│   │
│   ├── auth/
│   │   ├── signin.js
│   │   └── signup.js
│   │
│   ├── others/
│   │   ├── bleDevices.js
│   │   ├── getInvalidMeters.js
│   │   ├── meterLocation.js
│   │   └── notification.js
│   │
│   ├── reports/
│   │   ├── generate_pivot_table.js
│   │   ├── generate_unmapped_report.js
│   │   ├── generate_unmapped_report_for_supervisor.js
│   │   └── get_last_unmapp_report.js
│   │
│   ├── sse/
│   │   └── sse.js
│   │
│   └── workforce/
│       ├── createUser.js
│       ├── deleteUser.js
│       ├── readUser.js
│       └── updateUser.js
│
├── utils/
│
├── .env.example
├── .gitignore
├── index.js
├── meters.csv
├── migrate.js
├── package.json
├── package-lock.json
└── README.md
```

The repository currently contains separate route groups for authentication, assignments, reports, workforce management, other utilities, and SSE.

---

# Installation

## Prerequisites

Install:

* Node.js
* npm
* MongoDB
* Git

Optional infrastructure required for specific features:

* AWS S3 account/bucket
* AWS credentials
* Resend account/API key
* Gmail account/app password if Nodemailer is used

---

## Clone the repository

```bash
git clone https://github.com/Codewithajoydas/Assign-Meter-Backend.git
```

Move into the project:

```bash
cd Assign-Meter-Backend
```

Install dependencies:

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root.

The repository provides `.env.example` with the currently expected variables.

Example:

```env
PORT=9000

MONGOOSE_URL=mongodb://localhost:27017/mydatabase

JWT_SECRET=your-super-secret-jwt-key

EMAIL=your-email@gmail.com
PASSWORD=your-email-password

RESEND_API_KEY=your-resend-api-key

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET_NAME=your-s3-bucket
```

## Environment variable reference

| Variable                | Description                           |
| ----------------------- | ------------------------------------- |
| `PORT`                  | Port on which the Express server runs |
| `MONGOOSE_URL`          | MongoDB connection URI                |
| `JWT_SECRET`            | Secret used to sign and verify JWTs   |
| `EMAIL`                 | Gmail address used by Nodemailer      |
| `PASSWORD`              | Gmail credential/app password         |
| `RESEND_API_KEY`        | Resend API key                        |
| `AWS_ACCESS_KEY_ID`     | AWS access key                        |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key                        |
| `AWS_REGION`            | AWS region                            |
| `AWS_S3_BUCKET_NAME`    | S3 bucket used for reports            |

Never commit `.env` or real credentials to Git.

---

# Running the Server

## Development

```bash
npm run dev
```

The development script uses Nodemon and ignores:

```text
temp/uploads/
reports/
```

according to the project's `package.json`.

## Production

```bash
npm start
```

This executes:

```bash
node index.js
```

The application listens on the port defined by `process.env.PORT`.

---

# Health Check

## GET `/`

Checks whether the backend is running.

### Response

```json
{
  "message": "Server is running"
}
```

---

# Authentication APIs

## POST `/api/signup`

Creates a user account.

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "isAdmin": false
}
```

The password is hashed using bcrypt before being stored.

### Important

The current `User` model requires `pkg`, but the signup route does not currently include `pkg` when creating the user.

Therefore, depending on the current MongoDB/Mongoose validation behavior, this route can fail unless the implementation is updated.

A production-ready version should explicitly handle:

```json
{
  "pkg": "ASS1"
}
```

or assign a default package server-side.

---

## POST `/api/signin`

Authenticates a user.

### Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Successful response

```json
{
  "status": "success",
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": "USER_ID",
      "name": "John Doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  }
}
```

The generated JWT currently expires after seven days.

---

# Authentication Header

Protected APIs expect:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Example:

```bash
curl http://localhost:9000/api/getmeterdetails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

# Meter APIs

## POST `/api/meterassign`

Assigns one or more meters to the authenticated supervisor.

### Required fields

```json
{
  "meterNumber": [
    "1234567",
    "7654321"
  ],
  "equipCategory": "METER",
  "meterType": "1P,2W,5-30A",
  "installationType": "LTWC",
  "storeLocation": "Nagaon",
  "agency": "Example Agency",
  "installerId": "INSTALLER001"
}
```

The endpoint:

1. Validates the JWT.
2. Finds the authenticated user.
3. Validates required fields.
4. Requires `meterNumber` to be an array.
5. Removes whitespace/newline/tab characters.
6. Validates meter numbers as seven-digit numbers.
7. Removes duplicates from the request.
8. Checks for already submitted meters for the same agency/installer.
9. Creates meter records.
10. Associates the authenticated user as supervisor.
11. Associates the supervisor's package.
12. Broadcasts a `meter-added` SSE event.

### Example response

```json
{
  "status": "success",
  "message": "Meters sent to MIS successfully, Kindly wait for approval.",
  "insertedCount": 2,
  "data": []
}
```

---

## GET `/api/getmeterdetails`

Returns meters with filtering and pagination.

### Query parameters

```text
status
agency
store
meterType
installationType
startDate
endDate
pageNumber
limit
sort
```

Example:

```text
/api/getmeterdetails?status=pending&pageNumber=1&limit=20&sort=desc
```

Supported status values:

```text
active
pending
installed
rejected
```

The endpoint also automatically filters meters according to the authenticated user's `pkg`.

### Response

```json
{
  "status": "success",
  "count": 10,
  "data": [],
  "totalPages": 5,
  "currentPage": 1,
  "totalData": 42
}
```

---

## GET `/api/getmeterdetails/supervisor`

Returns meters belonging to the authenticated supervisor.

### Query parameters

```text
sort
search
status
agency
store
meterType
installationType
```

Supported sort values include:

```text
newold
oldnew
meterid
status
```

The endpoint searches meter numbers using a case-insensitive regular expression and restricts results to the authenticated supervisor.

---

## GET `/api/searchmeter`

Searches for a specific meter number.

### Query

```text
/api/searchmeter?meterNumber=1234567
```

### Response

```json
{
  "status": "success",
  "data": {
    "meters": []
  }
}
```

---

## DELETE `/api/deletemeter`

Deletes selected meters.

### Request

```json
{
  "meters": [
    "MONGO_OBJECT_ID_1",
    "MONGO_OBJECT_ID_2"
  ]
}
```

The endpoint requires a valid Bearer token and expects a non-empty array.

---

# Equipment Assignment APIs

## POST `/api/nicassign`

Assigns a NIC device.

### Request

```json
{
  "equipmentNumber": "NIC001",
  "agency": "Example Agency",
  "type": "3 Phase",
  "nicCommType": "Cellular",
  "installerNumber": "INSTALLER001"
}
```

Supported communication types:

```text
RF
Cellular
```

The equipment number must be unique.

---

## POST `/api/simassign`

Assigns a SIM card.

### Request

```json
{
  "equipmentNumber": "SIM001",
  "agency": "Example Agency",
  "nsp": "Airtel",
  "installerNumber": "INSTALLER001"
}
```

Supported network providers:

```text
Airtel
Jio
```

The equipment number must be unique.

---

## POST `/api/sealassign`

Assigns a meter seal.

### Request

```json
{
  "equipmentNumber": "SEAL001",
  "agency": "Example Agency",
  "sealType": "Box Seal",
  "installerNumber": "INSTALLER001"
}
```

Supported seal types:

```text
Box Seal
GTW Seal
Left Seal
NIC Seal
Right Seal
Terminal Seal
```

---

# Workforce APIs

Workforce APIs are intended for administrative user management.

All four workforce endpoints verify JWT authentication and enforce admin privileges where appropriate.

## POST `/api/createuser`

Creates a new workforce user.

Admin authentication is required.

### Request

```json
{
  "name": "Field Engineer",
  "email": "engineer@example.com",
  "password": "password123",
  "isAdmin": false
}
```

The new user's `pkg` is inherited from the authenticated administrator.

---

## GET `/api/getusers`

Returns all users.

Admin authentication is required.

### Response

```json
{
  "status": "success",
  "count": 3,
  "users": []
}
```

---

## PATCH `/api/updateuser`

Updates user information.

### Request

```json
{
  "email": "engineer@example.com",
  "name": "Updated Name",
  "password": "newpassword",
  "isAdmin": false
}
```

Supported updates:

* Name
* Password
* Admin status

Passwords must contain at least six characters when changed.

---

## DELETE `/api/deleteuser`

Deletes a user by email.

### Request

```json
{
  "email": "engineer@example.com"
}
```

The current administrator cannot delete their own account.

---

# Meter Status APIs

## POST `/api/statusupdate`

Bulk-updates meter status using an uploaded spreadsheet.

The endpoint accepts a multipart form-data upload with:

```text
file
```

Maximum file size:

```text
5 MB
```

The spreadsheet must contain:

```text
Equipment Number
Field Engineer
Status
Remarks
```

Headers are matched case-insensitively.

### Supported statuses

```text
active
pending
installed
rejected
```

Aliases include:

```text
success
successful
approved
failed
failure
reject
```

The endpoint:

1. Authenticates the user.
2. Reads the XLSX/CSV file.
3. Validates required headers.
4. Normalizes status values.
5. Removes duplicate meter/engineer entries.
6. Finds existing meters.
7. Performs bulk database updates.
8. Marks conflicting assignments as rejected.
9. Returns processing results.
10. Sends supervisor notification emails asynchronously.

---

# Export APIs

## GET `/api/download`

Generates downloadable meter reports.

The endpoint supports filtering by:

```text
startDate
endDate
agency
store
meterType
installationType
status
```

The current implementation generates three Excel workbooks:

```text
store-data-<timestamp>.xlsx
agency-data-<timestamp>.xlsx
dispatch-data-<timestamp>.xlsx
```

These are packaged into:

```text
meters-<timestamp>.zip
```

---

## GET `/api/download/whole`

Streams a complete meter Excel report.

The workbook contains:

```text
Equip Category
Equip Number
Material Type
Store Name
Asset Received Date
Agency Name
Field Engineer
Installation Type
Supervisor Name
Dispatch Date
Status
```

The implementation uses ExcelJS's streaming workbook writer so large datasets can be written directly to the HTTP response.

---

# Report APIs

## POST `/api/generateReport`

Generates the unmapped-meter report.

Three files are required:

```text
comm
issue
mi
```

The backend processes these CSV files using DuckDB.

The generated report calculates:

* Mapping status
* Last communication date
* Issue age
* Meter/subcontractor information
* Store information
* Installer information
* Subdivision information

### Mapping statuses

The SQL logic determines:

```text
Mapped
Never Comm.
Pending
Unmapped
```

### Issue-age categories

```text
Below 30 Days
30-60 Days
60-90 Days
90-180 Days
180 Days Above
Unknown
```

The resulting CSV is uploaded to:

```text
reports/unmapped-report.csv
```

in the configured S3 bucket and is also returned as a downloadable file.

---

## GET `/api/last-unmapped-report`

Downloads the most recently generated unmapped report from S3.

The endpoint also sends:

```http
X-Report-Last-Modified
```

containing the S3 object's last-modified timestamp.

---

## GET `/api/last-unmapped-report/last-modified`

Returns the timestamp of the latest report.

### Example

```json
{
  "lastModified": "2026-08-25T12:00:00.000Z"
}
```

---

## GET `/api/generate_unmapped_report_for_supervisor`

Returns only the portion of the latest unmapped report associated with meters belonging to the authenticated supervisor.

Flow:

```text
JWT
 ↓
Find supervisor
 ↓
Find supervisor's meters
 ↓
Download latest S3 report
 ↓
DuckDB filtering
 ↓
Return matching records
```

---

## GET `/api/pivottabls/getallinstallername`

Accesses the latest generated report stored in S3.

The current implementation retrieves the `reports/unmapped-report.csv` object and returns the S3 SDK result.

---

# Meter Location API

## POST `/api/assign-location`

Stores or updates the geographical location of a meter.

### Request

```json
{
  "meterNumber": "1234567",
  "consumerNumber": "CONSUMER001",
  "location": {
    "latitude": 26.12345,
    "longitude": 92.12345
  }
}
```

The endpoint:

* Validates the JWT
* Validates latitude/longitude types
* Associates the record with the authenticated supervisor
* Uses an upsert operation

Therefore, if the meter location doesn't exist, it is created; otherwise it is updated.

---

# Notification API

## POST `/api/notification/add`

Stores an Expo push-notification token against the authenticated user.

### Request

```json
{
  "expoNotificationToken": "ExponentPushToken[...]"
}
```

The token is stored in the user's `expoNotificationToken` field.

---

# BLE Device APIs

## POST `/api/bledevices`

Stores a scanned BLE device.

### Request

```json
{
  "deviceId": "BLE-001",
  "name": "Meter Device",
  "localName": "Meter",
  "rssi": -55,
  "location": {
    "latitude": 26.12345,
    "longitude": 92.12345,
    "accuracy": 10
  },
  "scannedAt": "2026-08-25T12:00:00.000Z"
}
```

The endpoint associates the device with the authenticated user and prevents duplicate device names.

---

## GET `/api/bledevices`

Returns stored BLE devices.

The current implementation populates the associated supervisor field.

---

## GET `/api/bledevices/download`

Downloads BLE device data as an XLSX file.

The exported columns include:

```text
Device ID
Name
Local Name
RSSI
Location
Scanned At
```

---

# Server-Sent Events

## GET `/events`

The backend exposes an SSE endpoint for real-time browser updates.

Connect using JavaScript:

```javascript
const eventSource = new EventSource(
  "http://localhost:9000/events"
);

eventSource.addEventListener("meter-added", (event) => {
  const data = JSON.parse(event.data);

  console.log("New meters:", data);
});
```

The SSE implementation:

* Sets `text/event-stream`
* Keeps the connection alive
* Registers connected clients
* Removes clients when connections close
* Supports broadcasting named events

---

## `meter-added` Event

When meters are successfully assigned, the backend broadcasts:

```text
meter-added
```

with:

```json
{
  "insertedCount": 2,
  "meters": []
}
```

This allows the frontend to update the UI without polling the backend.

---

# Invalid Meter API

## GET `/api/wrongmeter`

Returns meter records whose meter number contains non-numeric characters.

This can be useful for detecting malformed/imported meter numbers.

---

# Database Models

## User

The `User` model contains:

```text
name
email
password
isAdmin
pkg
expoNotificationToken
createdAt
updatedAt
```

The password field is configured with `select: false`, meaning it isn't selected by default.

### Package values

```text
ASS1
ASS2
ASS3
ASS4
ASS5
ASS6
ASS7
ASS8
ASS9
ASS10
```

---

# Meter

The Meter model contains:

```text
meterNumber
pkg
supervisor
equipCategory
meterType
installationType
storeLocation
agency
installerId
status
remarks
createdAt
updatedAt
```

### Equipment categories

```text
CT
METER
NIC
PT
SEAL
SIM
```

### Installation types

```text
DTMeter
FeederMeter
HTCT
LTCT
LTWC
```

### Meter statuses

```text
active
pending
installed
rejected
```

---

# NIC

The NIC model contains:

```text
equipmentNumber
supervisor
equipCategory
meterType
storeLocation
agency
installerId
nicCommType
status
createdAt
updatedAt
```

Communication types:

```text
RF
Cellular
```

---

# SIM

The SIM model contains:

```text
equipmentNumber
supervisor
equipCategory
storeLocation
agency
installerId
nsp
status
createdAt
updatedAt
```

Supported network providers:

```text
Airtel
Jio
```

---

# Meter Seal

The seal model contains:

```text
equipmentNumber
supervisor
equipCategory
storeLocation
agency
installerId
sealType
status
createdAt
updatedAt
```

Supported seal types:

```text
Box Seal
GTW Seal
Left Seal
NIC Seal
Right Seal
Terminal Seal
```

---

# Meter Location

The MeterLocation model contains:

```text
meterNumber
consumerNumber
location.latitude
location.longitude
supervisor
```

---

# BLE Device

The BLE device model contains:

```text
deviceId
name
localName
rssi
location.latitude
location.longitude
location.accuracy
supervisor
scannedAt
createdAt
updatedAt
```

---

# Meter Lifecycle

A typical meter workflow looks like this:

```text
Meter received
      |
      v
Meter assigned to supervisor
      |
      v
Meter assigned to field engineer
      |
      v
Installation / field update
      |
      v
Status uploaded
      |
      +-------------------+
      |                   |
      v                   v
   Active              Rejected
      |
      v
  Installed
```

The status-update endpoint normalizes spreadsheet values before writing them to MongoDB.

---

# Report Generation Architecture

The unmapped report pipeline is one of the more advanced parts of the backend.

```text
        COMM CSV
           |
           |
        ISSUE CSV ----+
           |          |
           |          v
        MI CSV ---> DuckDB
                       |
                       v
              Mapping Analysis
                       |
                       v
             Unmapped Report CSV
                       |
                       v
                    AWS S3
                       |
             +---------+---------+
             |                   |
             v                   v
       Admin Download      Supervisor Report
```

DuckDB performs the CSV joins and calculations before the final report is uploaded to S3.

---

# File Processing

The backend processes several types of files:

### CSV

Used primarily for:

* Communication data
* Issue data
* Meter installation/import data
* Unmapped report generation

### XLSX

Used primarily for:

* Meter status updates
* Excel report generation
* BLE device exports

### ZIP

Used for:

* Packaging store data
* Agency data
* Dispatch data

The project uses:

```text
Multer
XLSX
ExcelJS
Archiver
DuckDB
```

for these workflows.

---

# AWS S3 Integration

Generated unmapped reports are stored in:

```text
reports/unmapped-report.csv
```

The same S3 key is reused, meaning a newly generated report replaces the previous report.

S3 is used as persistent report storage rather than keeping generated reports only on the application server.

This is particularly useful for deployments where the backend filesystem may be temporary.

---

# Email Notifications

The project contains two email mechanisms:

## Nodemailer

The configured Nodemailer transport uses Gmail:

```javascript
nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});
```

## Resend

The meter status update workflow uses Resend to send supervisor notifications after spreadsheet processing.

The notification work is intentionally performed asynchronously after the HTTP response is sent so email failures don't block the API response.

---

# Security

The backend currently implements several security mechanisms.

## JWT authentication

Protected routes verify:

```http
Authorization: Bearer <token>
```

JWTs are signed using:

```env
JWT_SECRET
```

---

## Password hashing

Passwords are hashed using bcrypt.

Example:

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

---

## Admin authorization

Workforce operations check:

```javascript
currentUser.isAdmin
```

Non-admin users receive:

```text
403 Forbidden
```

for protected administrative operations.

---

## CORS

The current server configuration allows:

```text
https://assign-meter-web.vercel.app
http://localhost:3000
```

and enables credentials.

---

## Upload limits

The meter-status upload endpoint limits uploads to:

```text
5 MB
```

and one file per request.

---

# Error Handling

The API generally follows a consistent JSON structure.

### Success

```json
{
  "status": "success",
  "data": {}
}
```

### Error

```json
{
  "status": "error",
  "message": "Something went wrong"
}
```

Typical HTTP status codes include:

| Status | Meaning                        |
| ------ | ------------------------------ |
| `200`  | Successful request             |
| `201`  | Resource created               |
| `400`  | Invalid request                |
| `401`  | Authentication failure         |
| `403`  | Insufficient permissions       |
| `404`  | Resource not found             |
| `409`  | Duplicate/conflicting resource |
| `500`  | Server/database error          |

---

# Development

## Development server

```bash
npm run dev
```

## Production server

```bash
npm start
```

## Check API health

Open:

```text
http://localhost:9000/
```

Expected:

```json
{
  "message": "Server is running"
}
```

---

# Example API Workflow

A typical frontend workflow can look like this:

## 1. Sign in

```http
POST /api/signin
```

Receive:

```text
JWT
```

---

## 2. Store JWT

The frontend stores the JWT according to its authentication strategy.

---

## 3. Assign meters

```http
POST /api/meterassign
Authorization: Bearer <JWT>
```

---

## 4. Listen for live updates

```javascript
const events = new EventSource(
  `${BACKEND_URL}/events`
);

events.addEventListener("meter-added", event => {
  const payload = JSON.parse(event.data);

  console.log(payload);
});
```

---

## 5. Retrieve meters

```http
GET /api/getmeterdetails
Authorization: Bearer <JWT>
```

---

## 6. Filter meters

```text
GET /api/getmeterdetails
  ?status=pending
  &store=Nagaon
  &pageNumber=1
  &limit=20
```

---

## 7. Update meter statuses

Upload an XLSX/CSV file:

```http
POST /api/statusupdate
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
```

with:

```text
file=<spreadsheet>
```

---

## 8. Generate operational report

```http
POST /api/generateReport
```

with:

```text
comm=<communication.csv>
issue=<issue.csv>
mi=<meter-installation.csv>
```

---

## 9. Store report

The generated report is uploaded to:

```text
AWS S3
```

---

## 10. Retrieve report

```http
GET /api/last-unmapped-report
```

---

# Current API Route Map

| Method | Endpoint                                       | Purpose                      |
| ------ | ---------------------------------------------- | ---------------------------- |
| GET    | `/`                                            | Health check                 |
| POST   | `/api/signin`                                  | Sign in                      |
| POST   | `/api/signup`                                  | Sign up                      |
| POST   | `/api/meterassign`                             | Assign meters                |
| DELETE | `/api/deletemeter`                             | Delete meters                |
| GET    | `/api/getmeterdetails`                         | Get/filter meters            |
| GET    | `/api/getmeterdetails/supervisor`              | Get supervisor meters        |
| POST   | `/api/nicassign`                               | Assign NIC                   |
| POST   | `/api/simassign`                               | Assign SIM                   |
| POST   | `/api/sealassign`                              | Assign seal                  |
| GET    | `/api/download`                                | Download meter ZIP           |
| GET    | `/api/download/whole`                          | Download complete meter XLSX |
| GET    | `/api/searchmeter`                             | Search meter                 |
| POST   | `/api/createuser`                              | Create workforce user        |
| DELETE | `/api/deleteuser`                              | Delete workforce user        |
| GET    | `/api/getusers`                                | Get workforce users          |
| PATCH  | `/api/updateuser`                              | Update workforce user        |
| POST   | `/api/statusupdate`                            | Bulk meter status update     |
| GET    | `/api/wrongmeter`                              | Find invalid meter numbers   |
| POST   | `/api/assign-location`                         | Save meter location          |
| POST   | `/api/notification/add`                        | Save Expo notification token |
| POST   | `/api/generateReport`                          | Generate unmapped report     |
| GET    | `/api/last-unmapped-report`                    | Download latest report       |
| GET    | `/api/last-unmapped-report/last-modified`      | Get report timestamp         |
| GET    | `/api/generate_unmapped_report_for_supervisor` | Supervisor report            |
| GET    | `/api/pivottabls/getallinstallername`          | Retrieve report/S3 data      |
| GET    | `/api/bledevices`                              | Get BLE devices              |
| POST   | `/api/bledevices`                              | Add BLE device               |
| GET    | `/api/bledevices/download`                     | Export BLE devices           |
| GET    | `/events`                                      | SSE connection               |

The route registrations are defined centrally in `index.js`.

---

# Known Implementation Notes

This section intentionally documents things that should be understood by anyone maintaining the project.

## 1. Signup and `pkg`

The `User` model requires:

```text
pkg
```

but `/api/signup` currently doesn't pass it into `UserDB.create()`.

This should be fixed before relying on public signup in production.

---

## 2. Admin signup

The signup endpoint accepts:

```text
isAdmin
```

directly from the request body.

That means a public caller may potentially request an administrator account.

For production, administrator creation should be restricted to an existing administrator or an explicit bootstrap process.

---

## 3. JWT secret

JWT security depends entirely on:

```env
JWT_SECRET
```

Use a strong, random secret in production.

---

## 4. CORS

The current allowed-origin list is hard-coded in `index.js`.

For different environments, consider moving allowed origins to environment variables.

---

## 5. Authentication consistency

The project uses Bearer JWT authentication extensively, while `cookie-parser` is also installed and enabled.

The current protected API implementations primarily read the JWT from the `Authorization` header.

---

## 6. SSE client storage

SSE clients are stored in an in-memory array.

Therefore:

* It works well for a single server instance.
* Multiple backend instances would require shared event infrastructure.
* Restarting the server removes all connected clients.

---

## 7. Report storage

The unmapped report uses a fixed S3 object key:

```text
reports/unmapped-report.csv
```

Generating a new report replaces the previous report.

---

## 8. Status aliases

The status update workflow maps spreadsheet values into the database's canonical enum values.

For example:

```text
success -> active
approved -> active
failed -> rejected
failure -> rejected
```

These mappings represent business logic and should be reviewed whenever the field workflow changes.

---

# Production Considerations

Before deploying this backend to production, the following areas should be reviewed.

## Recommended improvements

### Authentication

* Add refresh tokens.
* Consider shorter access-token lifetimes.
* Add logout/token revocation if required.
* Move admin creation behind a privileged workflow.

### Validation

Add dedicated validation middleware using a schema validation library such as:

```text
Zod
Joi
express-validator
```

### Error handling

Introduce centralized Express error middleware instead of repeating:

```javascript
try {
  ...
} catch (error) {
  ...
}
```

inside every route.

### Logging

Consider structured logging with:

```text
Pino
Winston
```

rather than relying primarily on `console.log`.

### Rate limiting

Add rate limiting to:

```text
signin
signup
file upload
report generation
```

endpoints.

### API versioning

Consider:

```text
/api/v1/...
```

instead of permanently keeping APIs under `/api`.

### Database indexes

Add appropriate MongoDB indexes for frequently queried fields such as:

```text
meterNumber
agency
installerId
supervisor
status
pkg
createdAt
```

### Background jobs

Report generation and email notifications can eventually move into background workers.

Possible technologies:

```text
BullMQ
Redis
AWS SQS
```

### SSE scaling

For multiple backend instances, use a shared pub/sub layer:

```text
Redis Pub/Sub
AWS SNS
AWS EventBridge
```

rather than an in-memory client array.

---

# Future Improvements

Potential next steps for the project include:

* API documentation with OpenAPI/Swagger
* Automated API tests
* Unit tests
* Integration tests
* Request validation
* Centralized authentication middleware
* Centralized authorization middleware
* Service layer
* Repository/data-access layer
* Structured logging
* Rate limiting
* Helmet security headers
* API versioning
* Database indexes
* Background report generation
* Job queues
* Redis caching
* S3 signed URLs
* Refresh-token authentication
* Audit logs
* Role-based access control
* CI/CD using GitHub Actions
* Docker support
* Automated database backups
* Production monitoring
* Error tracking

---

# Development Roadmap

A practical evolution of the backend could be:

```text
Current
  |
  +-- Express REST APIs
  +-- MongoDB
  +-- JWT
  +-- S3
  +-- DuckDB
  +-- SSE
  +-- Excel/CSV processing
  |
  v
Phase 1
  |
  +-- Validation layer
  +-- Centralized errors
  +-- API documentation
  +-- Automated tests
  |
  v
Phase 2
  |
  +-- Service layer
  +-- Middleware architecture
  +-- Role-based authorization
  +-- Audit logging
  |
  v
Phase 3
  |
  +-- Redis
  +-- Background workers
  +-- Queue-based reports
  +-- Scalable SSE/event system
  |
  v
Phase 4
  |
  +-- Docker
  +-- CI/CD
  +-- Monitoring
  +-- Production observability
```

---

# Repository

Source code:

https://github.com/Codewithajoydas/Assign-Meter-Backend

---

# License

The repository currently declares the **ISC** license in `package.json`.

---

# Author

**Codewithajoydas**

GitHub:

https://github.com/Codewithajoydas

---

# Summary

Assign Meter Backend is a Node.js/Express backend focused on field workforce and electrical-meter management.

Its core responsibilities are:

```text
Authentication
     +
Workforce Management
     +
Meter Management
     +
Equipment Assignment
     +
Status Processing
     +
Location Tracking
     +
BLE Device Tracking
     +
CSV/XLSX Processing
     +
DuckDB Analytics
     +
AWS S3 Reports
     +
Excel/ZIP Exports
     +
Email Notifications
     +
Real-Time SSE Events
```

The backend provides the infrastructure required for an operational meter-assignment workflow, from equipment allocation through field installation/status updates and reporting.
