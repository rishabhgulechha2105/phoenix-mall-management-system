from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Restaurant, Shop, Category, User


router = APIRouter(
    prefix="/manager/restaurants",
    tags=["Manager - Restaurants"]
)


# =========================================================
# Pydantic Schemas
# =========================================================

class RestaurantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    cuisine: str = Field(..., min_length=1, max_length=100)
    price_range: str
    opening_time: str
    closing_time: str
    description: str | None = None

    shop_code: str = Field(..., min_length=1, max_length=30)
    floor: str = Field(..., min_length=1, max_length=50)
    area_sqft: float = Field(..., gt=0)
    monthly_rent: float = Field(..., ge=0)
    shop_status: str = "OCCUPIED"


class RestaurantUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    cuisine: str = Field(..., min_length=1, max_length=100)
    price_range: str
    opening_time: str
    closing_time: str
    description: str | None = None

    shop_code: str = Field(..., min_length=1, max_length=30)
    floor: str = Field(..., min_length=1, max_length=50)
    area_sqft: float = Field(..., gt=0)
    monthly_rent: float = Field(..., ge=0)
    shop_status: str = "OCCUPIED"


# =========================================================
# Valid Values
# =========================================================

VALID_PRICE_RANGES = {
    "BUDGET",
    "MODERATE",
    "PREMIUM",
}

VALID_SHOP_STATUSES = {
    "OCCUPIED",
    "VACANT",
    "MAINTENANCE",
}


# =========================================================
# Helpers
# =========================================================

def parse_time(value: str, field_name: str) -> time:
    try:
        if len(value) == 5:
            return time.fromisoformat(value + ":00")

        return time.fromisoformat(value)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be in HH:MM or HH:MM:SS format"
        )


def restaurant_to_dict(
    restaurant: Restaurant,
    shop: Shop
):
    return {
        "id": restaurant.id,

        "shop_id": restaurant.shop_id,
        "shop_code": shop.shop_code,
        "shop_name": shop.name,
        "floor": shop.floor,
        "area_sqft": shop.area_sqft,
        "monthly_rent": shop.monthly_rent,
        "shop_status": shop.status,

        "restaurant_name": shop.name,

        "cuisine": restaurant.cuisine,
        "price_range": restaurant.price_range,

        "opening_time": (
            restaurant.opening_time.strftime("%H:%M")
            if restaurant.opening_time
            else None
        ),

        "closing_time": (
            restaurant.closing_time.strftime("%H:%M")
            if restaurant.closing_time
            else None
        ),

        "description": restaurant.description,

        "created_at": restaurant.created_at,
    }


# =========================================================
# GET ALL RESTAURANTS
# =========================================================

@router.get("/")
def get_restaurants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    rows = (
        db.query(Restaurant, Shop)
        .join(
            Shop,
            Restaurant.shop_id == Shop.id
        )
        .order_by(Restaurant.id.asc())
        .all()
    )

    return [
        restaurant_to_dict(
            restaurant,
            shop
        )
        for restaurant, shop in rows
    ]


# =========================================================
# GET SINGLE RESTAURANT
# =========================================================

@router.get("/{restaurant_id}")
def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    row = (
        db.query(Restaurant, Shop)
        .join(
            Shop,
            Restaurant.shop_id == Shop.id
        )
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    restaurant, shop = row

    return restaurant_to_dict(
        restaurant,
        shop
    )


# =========================================================
# CREATE RESTAURANT + SHOP
# =========================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_restaurant(
    restaurant_data: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):

    # -----------------------------------------------------
    # Validate price
    # -----------------------------------------------------

    if restaurant_data.price_range not in VALID_PRICE_RANGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid price range. Must be one of: "
                "BUDGET, MODERATE, PREMIUM"
            )
        )

    # -----------------------------------------------------
    # Validate shop status
    # -----------------------------------------------------

    if restaurant_data.shop_status not in VALID_SHOP_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid shop status. Must be one of: "
                "OCCUPIED, VACANT, MAINTENANCE"
            )
        )

    # -----------------------------------------------------
    # Validate times
    # -----------------------------------------------------

    opening_time = parse_time(
        restaurant_data.opening_time,
        "Opening time"
    )

    closing_time = parse_time(
        restaurant_data.closing_time,
        "Closing time"
    )

    shop_code = restaurant_data.shop_code.strip()

    # -----------------------------------------------------
    # Check duplicate shop code
    # -----------------------------------------------------

    existing_shop = (
        db.query(Shop)
        .filter(Shop.shop_code == shop_code)
        .first()
    )

    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shop code already exists"
        )

    try:

        # -------------------------------------------------
        # Find or create category
        # -------------------------------------------------

        category = (
            db.query(Category)
            .filter(Category.name == "Food & Dining")
            .first()
        )

        if not category:
            category = Category(
                name="Food & Dining",
                description="Restaurants, cafes and dining outlets"
            )

            db.add(category)
            db.flush()

        # -------------------------------------------------
        # Create Shop
        # -------------------------------------------------

        shop = Shop(
            shop_code=shop_code,
            name=restaurant_data.name.strip(),
            category_id=category.id,
            floor=restaurant_data.floor.strip(),
            area_sqft=restaurant_data.area_sqft,
            monthly_rent=restaurant_data.monthly_rent,
            status=restaurant_data.shop_status,
        )

        db.add(shop)
        db.flush()

        # -------------------------------------------------
        # Create Restaurant
        # -------------------------------------------------

        restaurant = Restaurant(
            shop_id=shop.id,
            cuisine=restaurant_data.cuisine.strip(),
            price_range=restaurant_data.price_range,
            opening_time=opening_time,
            closing_time=closing_time,
            description=(
                restaurant_data.description.strip()
                if restaurant_data.description
                else None
            ),
        )

        db.add(restaurant)

        db.commit()

        db.refresh(shop)
        db.refresh(restaurant)

        return restaurant_to_dict(
            restaurant,
            shop
        )

    except Exception:
        db.rollback()
        raise


# =========================================================
# UPDATE RESTAURANT
# =========================================================

@router.put("/{restaurant_id}")
def update_restaurant(
    restaurant_id: int,
    restaurant_data: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):

    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    shop = (
        db.query(Shop)
        .filter(Shop.id == restaurant.shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated shop not found"
        )

    # -----------------------------------------------------
    # Validate price
    # -----------------------------------------------------

    if restaurant_data.price_range not in VALID_PRICE_RANGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid price range. Must be one of: "
                "BUDGET, MODERATE, PREMIUM"
            )
        )

    # -----------------------------------------------------
    # Validate status
    # -----------------------------------------------------

    if restaurant_data.shop_status not in VALID_SHOP_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid shop status. Must be one of: "
                "OCCUPIED, VACANT, MAINTENANCE"
            )
        )

    # -----------------------------------------------------
    # Check duplicate shop code
    # -----------------------------------------------------

    shop_code = restaurant_data.shop_code.strip()

    existing_shop = (
        db.query(Shop)
        .filter(
            Shop.shop_code == shop_code,
            Shop.id != shop.id
        )
        .first()
    )

    if existing_shop:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Shop code already exists"
        )

    # -----------------------------------------------------
    # Validate times
    # -----------------------------------------------------

    opening_time = parse_time(
        restaurant_data.opening_time,
        "Opening time"
    )

    closing_time = parse_time(
        restaurant_data.closing_time,
        "Closing time"
    )

    try:

        # -------------------------------------------------
        # Update Shop
        # -------------------------------------------------

        shop.shop_code = shop_code
        shop.name = restaurant_data.name.strip()
        shop.floor = restaurant_data.floor.strip()
        shop.area_sqft = restaurant_data.area_sqft
        shop.monthly_rent = restaurant_data.monthly_rent
        shop.status = restaurant_data.shop_status

        # -------------------------------------------------
        # Update Restaurant
        # -------------------------------------------------

        restaurant.cuisine = restaurant_data.cuisine.strip()
        restaurant.price_range = restaurant_data.price_range
        restaurant.opening_time = opening_time
        restaurant.closing_time = closing_time
        restaurant.description = (
            restaurant_data.description.strip()
            if restaurant_data.description
            else None
        )

        db.commit()

        db.refresh(shop)
        db.refresh(restaurant)

        return restaurant_to_dict(
            restaurant,
            shop
        )

    except Exception:
        db.rollback()
        raise


# =========================================================
# DELETE RESTAURANT
# =========================================================

@router.delete("/{restaurant_id}")
def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):

    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )

    try:

        # -------------------------------------------------
        # Delete related offers
        # -------------------------------------------------

        if hasattr(restaurant, "offers"):

            for offer in list(restaurant.offers):
                db.delete(offer)

        # -------------------------------------------------
        # Delete related reviews
        # -------------------------------------------------

        if hasattr(restaurant, "reviews"):

            for review in list(restaurant.reviews):
                db.delete(review)

        # -------------------------------------------------
        # IMPORTANT:
        #
        # DO NOT DELETE THE SHOP.
        #
        # The Shop is an independent master record and may
        # have leases, invoices, payments, sales, etc.
        # -------------------------------------------------

        db.delete(restaurant)

        db.commit()

        return {
            "message": "Restaurant deleted successfully. Associated shop remains available.",
            "id": restaurant_id
        }

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete restaurant: {str(exc)}"
        )