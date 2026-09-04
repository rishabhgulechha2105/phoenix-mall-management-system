USE mall_management;

INSERT INTO shops
(shop_code, name, category_id, floor, area_sqft, monthly_rent, status)
VALUES
('F-101', 'Zara', 1, 'Ground', 2400.00, 185000.00, 'OCCUPIED'),
('F-102', 'H&M', 1, 'Ground', 2100.00, 165000.00, 'OCCUPIED'),
('F-103', 'Nike', 6, 'Ground', 1800.00, 145000.00, 'OCCUPIED'),
('F-104', 'Levi''s', 1, 'Ground', 1600.00, 125000.00, 'VACANT'),
('F-105', 'Tanishq', 9, 'Ground', 1400.00, 220000.00, 'OCCUPIED'),

('E-201', 'Croma', 2, '1', 3200.00, 240000.00, 'OCCUPIED'),
('E-202', 'Reliance Digital', 2, '1', 2800.00, 215000.00, 'OCCUPIED'),
('E-203', 'Apple Premium Store', 2, '1', 2200.00, 260000.00, 'OCCUPIED'),
('H-204', 'Home Centre', 5, '1', 3500.00, 195000.00, 'OCCUPIED'),
('S-205', 'Decathlon', 6, '1', 4000.00, 210000.00, 'VACANT'),

('FB-301', 'Starbucks', 3, '2', 1200.00, 95000.00, 'OCCUPIED'),
('FB-302', 'McDonald''s', 3, '2', 1500.00, 110000.00, 'OCCUPIED'),
('FB-303', 'Pizza Hut', 3, '2', 1800.00, 125000.00, 'OCCUPIED'),
('FB-304', 'Barbeque Nation', 3, '2', 2800.00, 175000.00, 'OCCUPIED'),
('FB-305', 'Theobroma', 3, '2', 1000.00, 80000.00, 'VACANT'),

('B-401', 'Lakme Salon', 4, '3', 1400.00, 90000.00, 'OCCUPIED'),
('B-402', 'Nykaa', 4, '3', 1600.00, 115000.00, 'OCCUPIED'),
('B-403', 'Cult Fit', 6, '3', 3000.00, 155000.00, 'OCCUPIED'),
('B-404', 'Miniso', 5, '3', 1800.00, 105000.00, 'MAINTENANCE'),
('B-405', 'Pepperfry', 5, '3', 2600.00, 135000.00, 'VACANT'),

('EN-501', 'PVR Cinemas', 7, '4', 12000.00, 450000.00, 'OCCUPIED'),
('EN-502', 'Timezone', 7, '4', 6000.00, 240000.00, 'OCCUPIED'),
('S-503', 'DMart', 8, '4', 15000.00, 520000.00, 'OCCUPIED'),
('SV-504', 'Apollo Pharmacy', 10, '4', 1200.00, 85000.00, 'OCCUPIED'),
('SV-505', 'HDFC Bank', 10, '4', 2200.00, 145000.00, 'MAINTENANCE');

INSERT INTO tenants
(name, email, phone, company_name, gst_number)
VALUES
('Aarav Mehta', 'aarav.mehta@example.com', '9876501001',
 'Mehta Retail Pvt Ltd', '27AABCM1234A1Z5'),

('Diya Shah', 'diya.shah@example.com', '9876501002',
 'Shah Lifestyle Pvt Ltd', '27AABCS2345B1Z6'),

('Rohan Kapoor', 'rohan.kapoor@example.com', '9876501003',
 'Kapoor Sports India', '27AABCK3456C1Z7'),

('Ananya Rao', 'ananya.rao@example.com', '9876501004',
 'Rao Jewellery House', '27AABCR4567D1Z8'),

('Vikram Malhotra', 'vikram.malhotra@example.com', '9876501005',
 'Malhotra Electronics', '27AABCM5678E1Z9'),

('Ishita Verma', 'ishita.verma@example.com', '9876501006',
 'Verma Retail Solutions', '27AABCV6789F1ZA'),

('Aditya Nair', 'aditya.nair@example.com', '9876501007',
 'Nair Food Ventures', '27AABCN7890G1ZB'),

('Meera Iyer', 'meera.iyer@example.com', '9876501008',
 'Iyer Hospitality Group', '27AABCI8901H1ZC'),

('Kabir Singh', 'kabir.singh@example.com', '9876501009',
 'Singh Entertainment Pvt Ltd', '27AABCS9012J1ZD'),

('Sneha Joshi', 'sneha.joshi@example.com', '9876501010',
 'Joshi Beauty & Wellness', '27AABCJ0123K1ZE'),

('Arjun Bhatia', 'arjun.bhatia@example.com', '9876501011',
 'Bhatia Home Concepts', '27AABCB1234L1ZF'),

('Neha Agarwal', 'neha.agarwal@example.com', '9876501012',
 'Agarwal Lifestyle Stores', '27AABCA2345M1ZG'),

('Karan Desai', 'karan.desai@example.com', '9876501013',
 'Desai Food Services', '27AABCD3456N1ZH'),

('Pooja Kulkarni', 'pooja.kulkarni@example.com', '9876501014',
 'Kulkarni Retail Ventures', '27AABCK4567P1ZI'),

('Rahul Sethi', 'rahul.sethi@example.com', '9876501015',
 'Sethi Consumer Services', '27AABCS5678Q1ZJ');