USE mall_management;

INSERT INTO reviews
(
    restaurant_id,
    customer_name,
    rating,
    comment
)
VALUES

-- Starbucks
(1, 'Aditi Sharma', 5,
 'Great coffee and quick service. The ambience is really nice.'),

(1, 'Kunal Mehta', 4,
 'Good coffee and friendly staff. Seating can get busy during evenings.'),

(1, 'Sneha Kapoor', 5,
 'Loved the pastries and the overall experience.'),

-- McDonald's
(2, 'Rahul Jain', 4,
 'Food was fresh and service was quick.'),

(2, 'Priya Shah', 3,
 'Food was decent but the restaurant was quite crowded.'),

(2, 'Arnav Singh', 5,
 'Great place for a quick meal with friends.'),

-- Pizza Hut
(3, 'Isha Malhotra', 5,
 'The pizza was fresh and served hot. Really enjoyed it.'),

(3, 'Dev Patel', 4,
 'Good food and comfortable seating.'),

(3, 'Riya Nair', 4,
 'Nice variety of pizzas and sides.'),

-- Barbeque Nation
(4, 'Vivek Rao', 5,
 'Excellent food selection and great live grill experience.'),

(4, 'Tanya Verma', 5,
 'Amazing variety of food and very good service.'),

(4, 'Mohit Agarwal', 4,
 'Great experience overall, although it can get crowded on weekends.');