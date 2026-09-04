USE mall_management;

INSERT INTO payments
(
    invoice_id,
    amount,
    payment_date,
    payment_method,
    transaction_reference,
    status
)
VALUES

-- =========================
-- JUNE 2026 — PAID INVOICES
-- =========================

(1, 244850.00, '2026-06-08',
 'UPI', 'TXN-UPI-260601', 'SUCCESS'),

(2, 218064.00, '2026-06-08',
 'BANK_TRANSFER', 'TXN-BANK-260602', 'SUCCESS'),

(4, 291696.00, '2026-06-07',
 'CARD', 'TXN-CARD-260604', 'SUCCESS'),

(5, 319190.00, '2026-06-09',
 'BANK_TRANSFER', 'TXN-BANK-260605', 'SUCCESS'),

-- Invoice 6 is PARTIALLY_PAID
(6, 150000.00, '2026-06-09',
 'BANK_TRANSFER', 'TXN-BANK-260606', 'SUCCESS'),

(7, 345976.00, '2026-06-08',
 'CARD', 'TXN-CARD-260607', 'SUCCESS'),

(8, 258774.00, '2026-06-08',
 'UPI', 'TXN-UPI-260608', 'SUCCESS'),

(10, 145730.00, '2026-06-09',
 'UPI', 'TXN-UPI-260610', 'SUCCESS'),

(12, 232106.00, '2026-06-09',
 'BANK_TRANSFER', 'TXN-BANK-260612', 'SUCCESS'),

(14, 152574.00, '2026-06-08',
 'CARD', 'TXN-CARD-260614', 'SUCCESS'),

-- Invoice 15 is PARTIALLY_PAID
(15, 100000.00, '2026-06-10',
 'UPI', 'TXN-UPI-260615', 'SUCCESS'),


-- =========================
-- JULY 2026 — PAID INVOICES
-- =========================

(16, 245086.00, '2026-07-08',
 'UPI', 'TXN-UPI-260716', 'SUCCESS'),

(17, 218182.00, '2026-07-08',
 'BANK_TRANSFER', 'TXN-BANK-260717', 'SUCCESS'),

(18, 191514.00, '2026-07-09',
 'CARD', 'TXN-CARD-260718', 'SUCCESS'),

(20, 319426.00, '2026-07-08',
 'BANK_TRANSFER', 'TXN-BANK-260720', 'SUCCESS'),

(21, 286032.00, '2026-07-09',
 'UPI', 'TXN-UPI-260721', 'SUCCESS'),

(22, 346094.00, '2026-07-08',
 'CARD', 'TXN-CARD-260722', 'SUCCESS'),

(24, 126024.00, '2026-07-09',
 'UPI', 'TXN-UPI-260724', 'SUCCESS'),

(25, 145848.00, '2026-07-09',
 'BANK_TRANSFER', 'TXN-BANK-260725', 'SUCCESS'),

(26, 165908.00, '2026-07-08',
 'CARD', 'TXN-CARD-260726', 'SUCCESS'),

(28, 119416.00, '2026-07-09',
 'UPI', 'TXN-UPI-260728', 'SUCCESS'),

(29, 152692.00, '2026-07-08',
 'BANK_TRANSFER', 'TXN-BANK-260729', 'SUCCESS'),


-- =========================
-- JULY PARTIAL PAYMENT
-- =========================

(27, 120000.00, '2026-07-10',
 'BANK_TRANSFER', 'TXN-BANK-260727', 'SUCCESS');


-- =========================
-- ADDITIONAL PAYMENT
-- =========================

INSERT INTO payments
(
    invoice_id,
    amount,
    payment_date,
    payment_method,
    transaction_reference,
    status
)
VALUES

-- Second payment toward invoice 6
(6, 100000.00, '2026-06-15',
 'UPI', 'TXN-UPI-260616', 'SUCCESS'),

-- Second payment toward invoice 15
(15, 50000.00, '2026-06-18',
 'CARD', 'TXN-CARD-260617', 'SUCCESS'),

-- Second payment toward invoice 27
(27, 50000.00, '2026-07-15',
 'UPI', 'TXN-UPI-260730', 'SUCCESS');