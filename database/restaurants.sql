USE mall_management;

INSERT INTO restaurants
(
    shop_id,
    cuisine,
    price_range,
    opening_time,
    closing_time,
    description
)
VALUES
(
    11,
    'Cafe & Beverages',
    'MODERATE',
    '09:00:00',
    '22:30:00',
    'Coffee, tea, pastries and quick bites.'
),
(
    12,
    'Fast Food',
    'BUDGET',
    '10:00:00',
    '23:00:00',
    'Burgers, fries, beverages and quick meals.'
),
(
    13,
    'Pizza & Italian',
    'MODERATE',
    '11:00:00',
    '23:00:00',
    'Pizzas, pasta, sides and beverages.'
),
(
    14,
    'Indian & Grill',
    'PREMIUM',
    '12:00:00',
    '23:30:00',
    'Live grill dining with Indian and international dishes.'
);