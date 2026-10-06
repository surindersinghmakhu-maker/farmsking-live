# FarmsKing Project Flow & Architecture

## 1. User Registration & Authentication Flow
* User opens the App/Website.
* Chooses to Login or Register.
* Enters Mobile Number -> OTP Verification (via Firebase/WhatsApp).
* Selects a Role (Farmer, Gardener, Advisor, Customer, Business Partner).
* Completes Profile Setup.
* Redirected to the respective Dashboard based on the Role.

## 2. Core Modules & Dashboards
* **Farmer Dashboard**: Manage Farms, Crops, Expenses, Market Rates, Ask Agri-AI.
* **Gardener Dashboard**: Manage Plants, Lawns, Watering schedules.
* **Advisor Dashboard**: Receive consultation requests, Video/Audio calls via Agora, Earn consultation fees.
* **Agri Store (Customer)**: Browse products (Seeds, Fertilizers), Add to Cart, Checkout via UPI, Track Orders.
* **Business Partner**: Refer users, Track referral income, Manage Wallet, Request Withdrawals.

## 3. Agri Store E-Commerce Flow
* User browses the store categories (Seeds, Machinery, etc.).
* Clicks on a product -> Views details and reviews.
* Adds product to Cart -> Proceeds to Checkout.
* Enters Delivery Address.
* Payment Gateway (UPI link generation).
* Payment Confirmed -> Order Placed.
* Admin Panel -> Order Processing -> Dispatch -> Delivered.

## 4. Agri-AI & Expert Consultation Flow
* User faces an issue (e.g., Yellow leaves on crop).
* **Option A (Agri-AI)**: Uploads photo -> Gemini AI analyzes -> Gives instant solution.
* **Option B (Expert Advisor)**: Books an appointment -> Pays fee -> Video call via Agora -> Receives prescription.

## 5. Wallet & Referral System Flow
* User signs up with a Referral Code (Business Partner).
* Business Partner gets referral commission credited to Wallet.
* Partner checks Wallet Balance in App.
* Requests Withdrawal (Minimum amount reached).
* Admin approves -> Money transferred to Partner's Bank/UPI.

## 6. Technical Execution Flow
* **Frontend (React Native / Expo)**: Renders UI, handles user clicks, sends API requests.
* **Backend (NestJS)**: Receives requests, applies business logic (auth, wallet rules).
* **Database (PostgreSQL via Prisma)**: Saves/Retrieves data (Users, Orders, Wallet).
* **Third-Party Services**: Firebase (Auth/Notifications), Agora (Video Calls), Gemini (AI), Open-Meteo (Weather).
