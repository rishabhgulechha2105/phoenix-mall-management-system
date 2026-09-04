from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..dependencies import require_manager_or_admin
from ..database import get_db
from ..models import (
    Invoice,
    Lease,
    Payment,
    Restaurant,
    Sale,
    Shop,
    Tenant,
    User,
)


router = APIRouter(
    prefix="/manager",
    tags=["Manager"],
)


# ============================================================
# DASHBOARD SUMMARY
# ============================================================

@router.get("/dashboard")
def get_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    """
    Management dashboard statistics.

    Accessible only to ADMIN and MANAGER users.
    """

    # --------------------------------------------------------
    # SHOPS
    # --------------------------------------------------------

    total_shops = db.query(Shop).count()

    occupied_shops = (
        db.query(Shop)
        .filter(Shop.status == "OCCUPIED")
        .count()
    )

    vacant_shops = (
        db.query(Shop)
        .filter(Shop.status == "VACANT")
        .count()
    )

    maintenance_shops = (
        db.query(Shop)
        .filter(Shop.status == "MAINTENANCE")
        .count()
    )

    occupancy_percentage = (
        round((occupied_shops / total_shops) * 100, 2)
        if total_shops
        else 0
    )

    # --------------------------------------------------------
    # TENANTS / LEASES
    # --------------------------------------------------------

    total_tenants = db.query(Tenant).count()

    active_leases = (
        db.query(Lease)
        .filter(
            Lease.status.in_(
                ["ACTIVE", "EXPIRING_SOON"]
            )
        )
        .count()
    )

    # --------------------------------------------------------
    # INVOICES
    # --------------------------------------------------------

    total_invoices = db.query(Invoice).count()

    pending_invoices = (
        db.query(Invoice)
        .filter(Invoice.status == "PENDING")
        .count()
    )

    partially_paid_invoices = (
        db.query(Invoice)
        .filter(
            Invoice.status == "PARTIALLY_PAID"
        )
        .count()
    )

    paid_invoices = (
        db.query(Invoice)
        .filter(Invoice.status == "PAID")
        .count()
    )

    overdue_invoices = (
        db.query(Invoice)
        .filter(Invoice.status == "OVERDUE")
        .count()
    )

    # --------------------------------------------------------
    # BILLING
    # --------------------------------------------------------

    total_billed = (
        db.query(
            func.coalesce(
                func.sum(Invoice.total_amount),
                0,
            )
        )
        .scalar()
    )

    total_collected = (
        db.query(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        )
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )

    # --------------------------------------------------------
    # RESTAURANTS
    # --------------------------------------------------------

    total_restaurants = db.query(Restaurant).count()

    # --------------------------------------------------------
    # PAYMENTS
    # --------------------------------------------------------

    total_payments = db.query(Payment).count()

    # --------------------------------------------------------
    # RETAIL SALES
    # --------------------------------------------------------

    total_retail_transactions = (
        db.query(Sale)
        .count()
    )

    total_retail_revenue = (
        db.query(
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            )
        )
        .scalar()
    )

    total_retail_items = (
        db.query(
            func.coalesce(
                func.sum(Sale.quantity),
                0,
            )
        )
        .scalar()
    )

    average_retail_sale = (
        db.query(
            func.coalesce(
                func.avg(Sale.total_amount),
                0,
            )
        )
        .scalar()
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },

        "shops": {
            "total": total_shops,
            "occupied": occupied_shops,
            "vacant": vacant_shops,
            "maintenance": maintenance_shops,
            "occupancy_percentage": occupancy_percentage,
        },

        "tenants": {
            "total": total_tenants,
        },

        "leases": {
            "active": active_leases,
        },

        "invoices": {
            "total": total_invoices,
            "pending": pending_invoices,
            "partially_paid": partially_paid_invoices,
            "paid": paid_invoices,
            "overdue": overdue_invoices,
        },

        "billing": {
            "total_billed": float(
                total_billed or Decimal("0")
            ),
            "total_collected": float(
                total_collected or Decimal("0")
            ),
        },

        "restaurants": {
            "total": total_restaurants,
        },

        "payments": {
            "total": total_payments,
        },

        # ----------------------------------------------------
        # RETAIL SALES
        # ----------------------------------------------------

        "retail_sales": {
            "total_transactions": total_retail_transactions,

            "total_revenue": float(
                total_retail_revenue or Decimal("0")
            ),

            "total_items": int(
                total_retail_items or 0
            ),

            "average_sale": float(
                average_retail_sale or Decimal("0")
            ),
        },
    }