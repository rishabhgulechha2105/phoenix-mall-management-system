from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Review, Restaurant, Shop


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


# ============================================================
# PUBLIC REVIEW RESPONSE
# ============================================================

class PublicReviewResponse(BaseModel):
    id: int
    restaurant_id: int
    restaurant_name: str
    customer_name: str
    rating: int
    comment: str | None = None
    created_at: str


# ============================================================
# PUBLIC REVIEWS
# ============================================================

@router.get(
    "/public",
    response_model=list[PublicReviewResponse],
)
def get_public_reviews(
    db: Session = Depends(get_db),
):
    """
    Public restaurant reviews for the PHOENIX website.
    """

    reviews = (
        db.query(Review, Restaurant, Shop)
        .join(
            Restaurant,
            Review.restaurant_id == Restaurant.id,
        )
        .join(
            Shop,
            Restaurant.shop_id == Shop.id,
        )
        .order_by(Review.created_at.desc())
        .all()
    )

    result = []

    for review, restaurant, shop in reviews:
        result.append(
            {
                "id": review.id,
                "restaurant_id": review.restaurant_id,
                "restaurant_name": shop.name,
                "customer_name": review.customer_name,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": (
                    review.created_at.isoformat()
                    if review.created_at
                    else ""
                ),
            }
        )

    return result