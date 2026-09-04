from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Offer, Restaurant, Shop, User


router = APIRouter(
    prefix="/manager/offers",
    tags=["Manager - Offers"]
)


# =========================================================
# Pydantic Schemas
# =========================================================

class OfferCreate(BaseModel):
    restaurant_id: int
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    discount_percentage: float = Field(..., ge=0, le=100)
    valid_from: date
    valid_until: date
    status: str = "ACTIVE"


class OfferUpdate(BaseModel):
    restaurant_id: int
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    discount_percentage: float = Field(..., ge=0, le=100)
    valid_from: date
    valid_until: date
    status: str


# =========================================================
# Constants
# =========================================================

VALID_STATUSES = {
    "ACTIVE",
    "EXPIRED",
    "INACTIVE",
}


# =========================================================
# Helper
# =========================================================

def validate_dates(valid_from: date, valid_until: date):
    if valid_until < valid_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid until date cannot be before valid from date"
        )


def get_restaurant(db: Session, restaurant_id: int):
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

    return restaurant


def offer_to_dict(
    offer: Offer,
    restaurant: Restaurant,
    shop: Shop,
):
    return {
        "id": offer.id,

        "restaurant_id": offer.restaurant_id,

        "restaurant_name": restaurant.name
        if hasattr(restaurant, "name")
        else shop.name,

        "shop_id": shop.id,
        "shop_code": shop.shop_code,
        "floor": shop.floor,

        "title": offer.title,
        "description": offer.description,
        "discount_percentage": float(
            offer.discount_percentage
        ) if offer.discount_percentage is not None else 0,

        "valid_from": offer.valid_from,
        "valid_until": offer.valid_until,
        "status": offer.status,

        "created_at": offer.created_at,
    }


# =========================================================
# GET ALL OFFERS
# =========================================================

@router.get("/")
def get_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    offers = (
        db.query(Offer)
        .order_by(Offer.id.asc())
        .all()
    )

    result = []

    for offer in offers:

        restaurant = (
            db.query(Restaurant)
            .filter(Restaurant.id == offer.restaurant_id)
            .first()
        )

        if not restaurant:
            continue

        shop = (
            db.query(Shop)
            .filter(Shop.id == restaurant.shop_id)
            .first()
        )

        if not shop:
            continue

        result.append(
            offer_to_dict(
                offer,
                restaurant,
                shop
            )
        )

    return result


# =========================================================
# GET SINGLE OFFER
# =========================================================

@router.get("/{offer_id}")
def get_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    offer = (
        db.query(Offer)
        .filter(Offer.id == offer_id)
        .first()
    )

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    restaurant = get_restaurant(
        db,
        offer.restaurant_id
    )

    shop = (
        db.query(Shop)
        .filter(Shop.id == restaurant.shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant's shop not found"
        )

    return offer_to_dict(
        offer,
        restaurant,
        shop
    )


# =========================================================
# CREATE OFFER
# =========================================================

@router.post(
    "/",
    status_code=status.HTTP_201_CREATED
)
def create_offer(
    offer_data: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):

    # -----------------------------------------------------
    # Validate status
    # -----------------------------------------------------

    if offer_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid status. Must be one of: "
                "ACTIVE, EXPIRED, INACTIVE"
            )
        )

    # -----------------------------------------------------
    # Validate dates
    # -----------------------------------------------------

    validate_dates(
        offer_data.valid_from,
        offer_data.valid_until
    )

    # -----------------------------------------------------
    # Validate restaurant
    # -----------------------------------------------------

    restaurant = get_restaurant(
        db,
        offer_data.restaurant_id
    )

    # -----------------------------------------------------
    # Validate associated shop
    # -----------------------------------------------------

    shop = (
        db.query(Shop)
        .filter(Shop.id == restaurant.shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant's shop not found"
        )

    # -----------------------------------------------------
    # Create offer
    # -----------------------------------------------------

    offer = Offer(
        restaurant_id=offer_data.restaurant_id,
        title=offer_data.title.strip(),
        description=(
            offer_data.description.strip()
            if offer_data.description
            else None
        ),
        discount_percentage=offer_data.discount_percentage,
        valid_from=offer_data.valid_from,
        valid_until=offer_data.valid_until,
        status=offer_data.status,
    )

    db.add(offer)
    db.commit()
    db.refresh(offer)

    return offer_to_dict(
        offer,
        restaurant,
        shop
    )


# =========================================================
# UPDATE OFFER
# =========================================================

@router.put("/{offer_id}")
def update_offer(
    offer_id: int,
    offer_data: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):

    # -----------------------------------------------------
    # Find offer
    # -----------------------------------------------------

    offer = (
        db.query(Offer)
        .filter(Offer.id == offer_id)
        .first()
    )

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    # -----------------------------------------------------
    # Validate status
    # -----------------------------------------------------

    if offer_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid status. Must be one of: "
                "ACTIVE, EXPIRED, INACTIVE"
            )
        )

    # -----------------------------------------------------
    # Validate dates
    # -----------------------------------------------------

    validate_dates(
        offer_data.valid_from,
        offer_data.valid_until
    )

    # -----------------------------------------------------
    # Validate restaurant
    # -----------------------------------------------------

    restaurant = get_restaurant(
        db,
        offer_data.restaurant_id
    )

    # -----------------------------------------------------
    # Validate shop
    # -----------------------------------------------------

    shop = (
        db.query(Shop)
        .filter(Shop.id == restaurant.shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant's shop not found"
        )

    # -----------------------------------------------------
    # Update
    # -----------------------------------------------------

    offer.restaurant_id = offer_data.restaurant_id
    offer.title = offer_data.title.strip()

    offer.description = (
        offer_data.description.strip()
        if offer_data.description
        else None
    )

    offer.discount_percentage = (
        offer_data.discount_percentage
    )

    offer.valid_from = offer_data.valid_from
    offer.valid_until = offer_data.valid_until
    offer.status = offer_data.status

    db.commit()
    db.refresh(offer)

    return offer_to_dict(
        offer,
        restaurant,
        shop
    )


# =========================================================
# DELETE OFFER
# =========================================================

@router.delete("/{offer_id}")
def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):

    offer = (
        db.query(Offer)
        .filter(Offer.id == offer_id)
        .first()
    )

    if not offer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Offer not found"
        )

    db.delete(offer)
    db.commit()

    return {
        "message": "Offer deleted successfully",
        "id": offer_id
    }