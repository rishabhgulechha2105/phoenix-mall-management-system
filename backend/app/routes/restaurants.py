from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Restaurant, Shop


router = APIRouter(
    prefix="/restaurants",
    tags=["Restaurants"],
)


# ============================================================
# PUBLIC RESTAURANT RESPONSE
# ============================================================

class PublicRestaurantResponse(BaseModel):
    id: int
    shop_id: int
    name: str
    shop_code: str
    floor: str
    cuisine: str
    price_range: str
    opening_time: str
    closing_time: str
    description: str | None = None


# ============================================================
# PUBLIC DINING DIRECTORY
# ============================================================

@router.get(
    "/public",
    response_model=list[PublicRestaurantResponse],
)
def get_public_restaurants(
    db: Session = Depends(get_db),
):
    """
    Public dining directory for the PHOENIX website.

    Returns only customer-safe restaurant information.
    """

    restaurants = (
        db.query(Restaurant, Shop)
        .join(Shop, Restaurant.shop_id == Shop.id)
        .order_by(Restaurant.id)
        .all()
    )

    result = []

    for restaurant, shop in restaurants:
        result.append(
            {
                "id": restaurant.id,
                "shop_id": restaurant.shop_id,
                "name": shop.name,
                "shop_code": shop.shop_code,
                "floor": shop.floor,
                "cuisine": restaurant.cuisine,
                "price_range": restaurant.price_range,
                "opening_time": restaurant.opening_time.strftime("%H:%M"),
                "closing_time": restaurant.closing_time.strftime("%H:%M"),
                "description": restaurant.description,
            }
        )

    return result