from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Category, Shop, User


router = APIRouter(
    prefix="/manager/shops",
    tags=["Manager - Shops"],
)


# =========================
# RESPONSE MODEL
# =========================

class ManagerShopResponse(BaseModel):
    id: int
    shop_code: str
    name: str
    category_id: int
    category_name: Optional[str] = None
    floor: str
    area_sqft: float
    monthly_rent: float
    status: str

    model_config = ConfigDict(from_attributes=True)


# =========================
# CREATE MODEL
# =========================

class ManagerShopCreate(BaseModel):
    shop_code: str
    name: str
    category_id: int
    floor: str
    area_sqft: float
    monthly_rent: float
    status: str = "VACANT"


# =========================
# UPDATE MODEL
# =========================

class ManagerShopUpdate(BaseModel):
    shop_code: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[int] = None
    floor: Optional[str] = None
    area_sqft: Optional[float] = None
    monthly_rent: Optional[float] = None
    status: Optional[str] = None


# =========================
# VALID SHOP STATUSES
# =========================

VALID_STATUSES = {
    "OCCUPIED",
    "VACANT",
    "MAINTENANCE",
}


# =========================
# HELPER
# =========================

def shop_to_response(shop: Shop):
    return {
        "id": shop.id,
        "shop_code": shop.shop_code,
        "name": shop.name,
        "category_id": shop.category_id,
        "category_name": (
            shop.category.name
            if shop.category
            else None
        ),
        "floor": shop.floor,
        "area_sqft": float(shop.area_sqft or 0),
        "monthly_rent": float(shop.monthly_rent or 0),
        "status": shop.status,
    }


# =========================
# GET ALL SHOPS
# =========================

@router.get(
    "/",
    response_model=list[ManagerShopResponse],
)
def get_manager_shops(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    query = db.query(Shop)

    if status_filter:
        status_filter = status_filter.upper()

        if status_filter not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. Use OCCUPIED, "
                    "VACANT or MAINTENANCE."
                ),
            )

        query = query.filter(
            Shop.status == status_filter
        )

    shops = (
        query
        .order_by(Shop.id.asc())
        .all()
    )

    return [
        shop_to_response(shop)
        for shop in shops
    ]


# =========================
# GET ALL CATEGORIES
# =========================
# IMPORTANT:
# This route comes BEFORE /{shop_id}
# so "categories" is not treated as a shop ID.

@router.get("/categories/")
def get_manager_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    categories = (
        db.query(Category)
        .order_by(Category.name.asc())
        .all()
    )

    return [
        {
            "id": category.id,
            "name": category.name,
        }
        for category in categories
    ]


# =========================
# GET SINGLE SHOP
# =========================

@router.get(
    "/{shop_id}",
    response_model=ManagerShopResponse,
)
def get_manager_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
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

    return shop_to_response(shop)


# =========================
# CREATE SHOP
# =========================

@router.post(
    "/",
    response_model=ManagerShopResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_manager_shop(
    shop_data: ManagerShopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    # -------------------------
    # Check shop code
    # -------------------------

    existing_shop = (
        db.query(Shop)
        .filter(
            Shop.shop_code
            == shop_data.shop_code.strip()
        )
        .first()
    )

    if existing_shop:
        raise HTTPException(
            status_code=400,
            detail="Shop code already exists.",
        )

    # -------------------------
    # Validate status
    # -------------------------

    shop_status = shop_data.status.upper()

    if shop_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Use OCCUPIED, "
                "VACANT or MAINTENANCE."
            ),
        )

    # -------------------------
    # Check category
    # -------------------------

    category = (
        db.query(Category)
        .filter(
            Category.id
            == shop_data.category_id
        )
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=404,
            detail="Category not found.",
        )

    # -------------------------
    # Validate area
    # -------------------------

    if shop_data.area_sqft <= 0:
        raise HTTPException(
            status_code=400,
            detail="Area must be greater than zero.",
        )

    # -------------------------
    # Validate rent
    # -------------------------

    if shop_data.monthly_rent < 0:
        raise HTTPException(
            status_code=400,
            detail="Monthly rent cannot be negative.",
        )

    # -------------------------
    # Create shop
    # -------------------------

    shop = Shop(
        shop_code=shop_data.shop_code.strip(),
        name=shop_data.name.strip(),
        category_id=shop_data.category_id,
        floor=shop_data.floor.strip(),
        area_sqft=shop_data.area_sqft,
        monthly_rent=shop_data.monthly_rent,
        status=shop_status,
    )

    db.add(shop)
    db.commit()
    db.refresh(shop)

    return shop_to_response(shop)


# =========================
# UPDATE SHOP
# =========================

@router.put(
    "/{shop_id}",
    response_model=ManagerShopResponse,
)
def update_manager_shop(
    shop_id: int,
    shop_data: ManagerShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    shop = (
        db.query(Shop)
        .filter(Shop.id == shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=404,
            detail="Shop not found.",
        )

    update_data = shop_data.model_dump(
        exclude_unset=True
    )

    # -------------------------
    # Shop code
    # -------------------------

    if "shop_code" in update_data:
        new_code = update_data[
            "shop_code"
        ].strip()

        existing_shop = (
            db.query(Shop)
            .filter(
                Shop.shop_code == new_code,
                Shop.id != shop_id,
            )
            .first()
        )

        if existing_shop:
            raise HTTPException(
                status_code=400,
                detail="Shop code already exists.",
            )

        shop.shop_code = new_code

    # -------------------------
    # Name
    # -------------------------

    if "name" in update_data:
        shop.name = update_data[
            "name"
        ].strip()

    # -------------------------
    # Category
    # -------------------------

    if "category_id" in update_data:
        category = (
            db.query(Category)
            .filter(
                Category.id
                == update_data["category_id"]
            )
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=404,
                detail="Category not found.",
            )

        shop.category_id = update_data[
            "category_id"
        ]

    # -------------------------
    # Floor
    # -------------------------

    if "floor" in update_data:
        shop.floor = update_data[
            "floor"
        ].strip()

    # -------------------------
    # Area
    # -------------------------

    if "area_sqft" in update_data:

        if update_data["area_sqft"] <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Area must be greater than zero."
                ),
            )

        shop.area_sqft = update_data[
            "area_sqft"
        ]

    # -------------------------
    # Rent
    # -------------------------

    if "monthly_rent" in update_data:

        if update_data["monthly_rent"] < 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Monthly rent cannot be negative."
                ),
            )

        shop.monthly_rent = update_data[
            "monthly_rent"
        ]

    # -------------------------
    # Status
    # -------------------------

    if "status" in update_data:

        new_status = update_data[
            "status"
        ].upper()

        if new_status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. Use OCCUPIED, "
                    "VACANT or MAINTENANCE."
                ),
            )

        shop.status = new_status

    # -------------------------
    # Save changes
    # -------------------------

    db.commit()
    db.refresh(shop)

    return shop_to_response(shop)


# =========================
# DELETE SHOP
# =========================

@router.delete("/{shop_id}")
def delete_manager_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    shop = (
        db.query(Shop)
        .filter(Shop.id == shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=404,
            detail="Shop not found.",
        )

    try:
        db.delete(shop)
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This shop cannot be deleted because "
                "it is linked to existing leases, "
                "restaurants or other records."
            ),
        )

    return {
        "message": "Shop deleted successfully.",
        "shop_id": shop_id,
    }