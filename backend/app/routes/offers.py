from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Offer, Restaurant, Shop


router = APIRouter(
    prefix="/offers",
    tags=["Offers"],
)


# ============================================================
# PUBLIC OFFER RESPONSE
# ============================================================

class PublicOfferResponse(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: str
    shop_code: str
    floor: str
    title: str
    description: str | None = None
    discount_percentage: float | None = None
    valid_from: date
    valid_until: date
    status: str


# ============================================================
# PUBLIC OFFERS
# ============================================================

@router.get(
    "/public",
    response_model=list[PublicOfferResponse],
)
def get_public_offers(
    db: Session = Depends(get_db),
):
    """
    Public offers for the PHOENIX website.

    Only customer-safe offer information is returned.
    """

    offers = (
        db.query(Offer, Restaurant, Shop)
        .join(
            Restaurant,
            Offer.restaurant_id == Restaurant.id,
        )
        .join(
            Shop,
            Restaurant.shop_id == Shop.id,
        )
        .filter(
            Offer.status == "ACTIVE",
            Offer.valid_from <= date.today(),
            Offer.valid_until >= date.today(),
        )
        .order_by(Offer.valid_until.asc(), Offer.id.asc())
        .all()
    )

    result = []

    for offer, restaurant, shop in offers:
        result.append(
            {
                "id": offer.id,
                "restaurant_id": offer.restaurant_id,
                "restaurant_name": shop.name,
                "shop_code": shop.shop_code,
                "floor": shop.floor,
                "title": offer.title,
                "description": offer.description,
                "discount_percentage": (
                    float(offer.discount_percentage)
                    if offer.discount_percentage is not None
                    else None
                ),
                "valid_from": offer.valid_from,
                "valid_until": offer.valid_until,
                "status": offer.status,
            }
        )

    return result