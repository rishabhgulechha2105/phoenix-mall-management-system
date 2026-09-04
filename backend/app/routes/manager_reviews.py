from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Review, Restaurant, Shop, User


router = APIRouter(
    prefix="/manager/reviews",
    tags=["Manager Reviews"],
)


# ============================================================
# SCHEMAS
# ============================================================

class ReviewCreate(BaseModel):
    restaurant_id: int
    customer_name: str = Field(..., min_length=1, max_length=150)
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewUpdate(BaseModel):
    restaurant_id: int
    customer_name: str = Field(..., min_length=1, max_length=150)
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


# ============================================================
# HELPER
# ============================================================

def review_to_dict(review: Review):
    restaurant = review.restaurant
    shop = restaurant.shop

    return {
        "id": review.id,
        "restaurant_id": review.restaurant_id,
        "restaurant_name": shop.name,
        "shop_code": shop.shop_code,
        "floor": shop.floor,
        "customer_name": review.customer_name,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }


# ============================================================
# GET ALL REVIEWS
# ============================================================

@router.get("/")
def get_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    reviews = (
        db.query(Review)
        .join(Restaurant, Review.restaurant_id == Restaurant.id)
        .join(Shop, Restaurant.shop_id == Shop.id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return [review_to_dict(review) for review in reviews]


# ============================================================
# GET SINGLE REVIEW
# ============================================================

@router.get("/{review_id}")
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    return review_to_dict(review)


# ============================================================
# CREATE REVIEW
# ============================================================

@router.post("/")
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == data.restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found",
        )

    customer_name = data.customer_name.strip()

    if not customer_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name cannot be empty",
        )

    review = Review(
        restaurant_id=data.restaurant_id,
        customer_name=customer_name,
        rating=data.rating,
        comment=data.comment.strip() if data.comment else None,
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return review_to_dict(review)


# ============================================================
# UPDATE REVIEW
# ============================================================

@router.put("/{review_id}")
def update_review(
    review_id: int,
    data: ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.id == data.restaurant_id)
        .first()
    )

    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail="Restaurant not found",
        )

    customer_name = data.customer_name.strip()

    if not customer_name:
        raise HTTPException(
            status_code=400,
            detail="Customer name cannot be empty",
        )

    review.restaurant_id = data.restaurant_id
    review.customer_name = customer_name
    review.rating = data.rating
    review.comment = data.comment.strip() if data.comment else None

    db.commit()
    db.refresh(review)

    return review_to_dict(review)


# ============================================================
# DELETE REVIEW
# ============================================================

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found",
        )

    db.delete(review)
    db.commit()

    return {
        "message": "Review deleted successfully"
    }