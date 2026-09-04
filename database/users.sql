USE mall_management;

INSERT INTO users
(
    name,
    email,
    password_hash,
    role
)
VALUES

(
    'Mall Administrator',
    'admin@mallmanagement.com',
    '$2b$10$mBXoU2v3sWpYOESdJ76SB.TSqJdhrZFjrmljxUqmlHIVtuHXEz8ta',
    'ADMIN'
),

(
    'Rahul Manager',
    'rahul.manager@mallmanagement.com',
    '$2b$10$GfvrPmJ6sLJ8Mn8Afz3Rieakz7lbVcewj.HDtKINWLl5Iy3j0NYw2',
    'MANAGER'
),

(
    'Priya Manager',
    'priya.manager@mallmanagement.com',
    '$2b$10$TSb047LLPdQo.1ojpDkaF.GBKXPh3CocIUnoG/vyfQFZ3mN4gD7Sa',
    'MANAGER'
),

(
    'Aarav Mehta',
    'aarav.mehta@example.com',
    '$2b$10$2DbIW02B0yuC9kLKNNWdCu5HCe..oAGyg/t2I1TiWV9S7sPG6MCuO',
    'TENANT'
),

(
    'Diya Shah',
    'diya.shah@example.com',
    '$2b$10$2DbIW02B0yuC9kLKNNWdCu5HCe..oAGyg/t2I1TiWV9S7sPG6MCuO',
    'TENANT'
),

(
    'Rohan Kapoor',
    'rohan.kapoor@example.com',
    '$2b$10$2DbIW02B0yuC9kLKNNWdCu5HCe..oAGyg/t2I1TiWV9S7sPG6MCuO',
    'TENANT'
),

(
    'Ananya Rao',
    'ananya.rao@example.com',
    '$2b$10$2DbIW02B0yuC9kLKNNWdCu5HCe..oAGyg/t2I1TiWV9S7sPG6MCuO',
    'TENANT'
);