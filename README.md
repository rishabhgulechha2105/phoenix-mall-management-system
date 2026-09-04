# PHOENIX Mall Management System

A full-stack mall management platform designed to manage mall operations, tenants, leases, billing, retail sales, restaurants, offers, reviews, support requests, and business analytics through dedicated Manager and Tenant portals.

---

## 📌 Overview

PHOENIX is a role-based Mall Management System built as a full-stack web application.

The system provides:

- A public-facing PHOENIX mall website
- A secure Manager/Admin management portal
- A dedicated Tenant portal
- Tenant retail sales management
- Mall billing and payment management
- Restaurant and offer management
- Customer review management
- Maintenance/support request management
- Business reports and analytics

The application separates internal mall operations from customer-facing information while maintaining relationships between shops, tenants, leases, invoices, payments, and retail transactions.

---

## ✨ Key Features

### 🌐 Public Website

Customers can access:

- PHOENIX homepage
- Stores directory
- Dining directory
- Restaurant information
- Active offers
- Customer reviews and ratings
- Mall events
- Mall information

Internal information such as tenant contact details, rent amounts, leases, invoices, payments, and internal shop status is not exposed through public endpoints.

---

### 👨‍💼 Manager/Admin Portal

Managers and administrators can manage:

#### Shop Management
- Create shops
- Update shops
- Delete shops
- Manage shop categories
- Track shop status
- View shop information

#### Tenant Management
- Create tenants
- Update tenant details
- Delete tenants
- Manage tenant information

#### Lease Management
- Create leases
- Update leases
- Manage lease periods
- Track lease status
- Manage rent, maintenance charges, and security deposits

#### Invoice Management
- Create invoices
- Update invoices
- Track billing status
- Monitor outstanding amounts
- Manage invoice information

#### Payment Management
- Record payments
- Update payment records
- Track payment methods
- Automatically recalculate invoice payment status

Invoice status supports:

- PENDING
- PARTIALLY_PAID
- PAID
- OVERDUE

---

### 💰 Mall Collections

The system separately tracks mall-level financial collections from tenant invoices.

Managers can view:

- Total collections
- Successful transactions
- Average transaction value
- Total invoiced amount
- Total paid amount
- Outstanding amount
- Payment-method breakdown

Supported payment methods:

- Cash
- Card
- UPI
- Bank Transfer

---

### 🛍️ Retail Sales Management

Retail sales represent actual customer purchases made at tenant shops.

The system maintains a separate retail sales workflow:

```text
Customer
   ↓
Tenant Portal
   ↓
Record Purchase
   ↓
Retail Sales Database
   ↓
Manager Dashboard
   ↓
Reports & Analytics
