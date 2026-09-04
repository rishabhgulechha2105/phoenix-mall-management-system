USE mall_management;

INSERT INTO offers
(
    restaurant_id,
    title,
    description,
    discount_percentage,
    valid_from,
    valid_until,
    status
)
VALUES

(
    1,
    'Coffee & Pastry Combo',
    'Get 20% off on selected coffee and pastry combinations.',
    20.00,
    '2026-08-01',
    '2026-09-30',
    'ACTIVE'
),

(
    1,
    'Weekend Coffee Special',
    'Enjoy 15% off on selected beverages every Saturday and Sunday.',
    15.00,
    '2026-07-01',
    '2026-08-31',
    'EXPIRED'
),

(
    2,
    'McSaver Meal Deal',
    'Get 15% off on selected combo meals.',
    15.00,
    '2026-08-01',
    '2026-09-30',
    'ACTIVE'
),

(
    2,
    'Family Weekend Offer',
    'Save 20% when ordering selected family meal combinations.',
    20.00,
    '2026-06-01',
    '2026-07-31',
    'EXPIRED'
),

(
    3,
    'Pizza Night',
    'Get 25% off on selected large pizzas after 6 PM.',
    25.00,
    '2026-08-15',
    '2026-09-15',
    'ACTIVE'
),

(
    3,
    'Midweek Special',
    'Enjoy 15% off on selected pizzas every Wednesday.',
    15.00,
    '2026-07-01',
    '2026-07-31',
    'EXPIRED'
),

(
    4,
    'Unlimited Grill Experience',
    'Get 10% off on weekday lunch bookings.',
    10.00,
    '2026-08-01',
    '2026-10-31',
    'ACTIVE'
),

(
    4,
    'Family Dining Offer',
    'Save 15% on selected family dining packages.',
    15.00,
    '2026-06-01',
    '2026-07-31',
    'EXPIRED'
);