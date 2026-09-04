from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Shop


router = APIRouter(
    prefix="/shops",
    tags=["Shops"],
)


# ============================================================
# MANAGER / ADMIN RESPONSE
# ============================================================

class ShopResponse(BaseModel):
    id: int
    shop_code: str
    name: str
    category_id: int
    floor: str
    area_sqft: float
    monthly_rent: float
    status: str

    model_config = ConfigDict(from_attributes=True)


# ============================================================
# PUBLIC RESPONSE
# ============================================================
# This response is intentionally limited.
# The public website must NOT receive:
# - monthly rent
# - area_sqft
# - tenant information
# - lease information
# - invoice information
# - payment information
# - internal occupancy status
# ============================================================

class PublicShopResponse(BaseModel):
    id: int
    shop_code: str
    name: str
    category_id: int
    floor: str


# ============================================================
# CREATE SHOP
# ============================================================

class ShopCreate(BaseModel):
    shop_code: str
    name: str
    category_id: int
    floor: str
    area_sqft: float
    monthly_rent: float
    status: str = "VACANT"


# ============================================================
# PUBLIC STORES
# ============================================================

@router.get(
    "/public",
    response_model=list[PublicShopResponse],
)
def get_public_stores(
    db: Session = Depends(get_db),
):
    """
    Public endpoint for the PHOENIX mall website.

    Only customer-safe shop information is returned.
    Internal management information is deliberately excluded.
    """

    shops = (
        db.query(Shop)
        .order_by(Shop.id)
        .all()
    )

    return [
        {
            "id": shop.id,
            "shop_code": shop.shop_code,
            "name": shop.name,
            "category_id": shop.category_id,
            "floor": shop.floor,
        }
        for shop in shops
    ]


# ============================================================
# GET ALL SHOPS - MANAGER / ADMIN
# ============================================================

@router.get(
    "/",
    response_model=list[ShopResponse],
)
def get_shops(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Internal shop listing.

    This endpoint returns complete shop information and is intended
    for the management portal.
    """

    query = db.query(Shop)

    if status:
        query = query.filter(Shop.status == status)

    return query.order_by(Shop.id).all()


# ============================================================
# GET SINGLE SHOP - MANAGER / ADMIN
# ============================================================

@router.get(
    "/{shop_id}",
    response_model=ShopResponse,
)
def get_shop(
    shop_id: int,
    db: Session = Depends(get_db),
):
    shop = (
        db.query(Shop)
        .filter(Shop.id == shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=404,
            detail="Shop not found",
        )

    return shop


# ============================================================
# CREATE SHOP - MANAGER / ADMIN
# ============================================================

@router.post(
    "/",
    response_model=ShopResponse,
)
def create_shop(
    shop_data: ShopCreate,
    db: Session = Depends(get_db),
):
    existing_shop = (
        db.query(Shop)
        .filter(Shop.shop_code == shop_data.shop_code)
        .first()
    )

    if existing_shop:
        raise HTTPException(
            status_code=400,
            detail="Shop code already exists",
        )

    shop = Shop(
        shop_code=shop_data.shop_code,
        name=shop_data.name,
        category_id=shop_data.category_id,
        floor=shop_data.floor,
        area_sqft=shop_data.area_sqft,
        monthly_rent=shop_data.monthly_rent,
        status=shop_data.status,
    )

    db.add(shop)
    db.commit()
    db.refresh(shop)

    return shop