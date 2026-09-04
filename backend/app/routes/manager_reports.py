from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
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
    prefix="/manager/reports",
    tags=["Manager Reports"],
)


@router.get("/")
def get_manager_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    # =========================================================
    # BASIC COUNTS
    # =========================================================

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

    total_tenants = db.query(Tenant).count()

    total_leases = db.query(Lease).count()

    active_leases = (
        db.query(Lease)
        .filter(Lease.status == "ACTIVE")
        .count()
    )

    expiring_leases = (
        db.query(Lease)
        .filter(Lease.status == "EXPIRING_SOON")
        .count()
    )

    expired_leases = (
        db.query(Lease)
        .filter(Lease.status == "EXPIRED")
        .count()
    )

    terminated_leases = (
        db.query(Lease)
        .filter(Lease.status == "TERMINATED")
        .count()
    )

    total_restaurants = (
        db.query(Restaurant).count()
    )

    # =========================================================
    # OCCUPANCY
    # =========================================================

    occupancy_percentage = (
        round(
            (occupied_shops / total_shops) * 100,
            2,
        )
        if total_shops
        else 0
    )

    # =========================================================
    # INVOICE SUMMARY
    # =========================================================

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

    total_invoiced = (
        db.query(
            func.coalesce(
                func.sum(Invoice.total_amount),
                0,
            )
        )
        .scalar()
    )

    # =========================================================
    # PAYMENT / COLLECTION SUMMARY
    # =========================================================

    successful_transactions = (
        db.query(Payment)
        .filter(Payment.status == "SUCCESS")
        .count()
    )

    failed_transactions = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .count()
    )

    refunded_transactions = (
        db.query(Payment)
        .filter(Payment.status == "REFUNDED")
        .count()
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

    average_transaction = (
        db.query(
            func.coalesce(
                func.avg(Payment.amount),
                0,
            )
        )
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )

    total_invoiced_decimal = Decimal(
        str(total_invoiced or 0)
    )

    total_collected_decimal = Decimal(
        str(total_collected or 0)
    )

    outstanding = max(
        Decimal("0"),
        total_invoiced_decimal
        - total_collected_decimal,
    )

    collection_percentage = (
        round(
            (
                total_collected_decimal
                / total_invoiced_decimal
            )
            * 100,
            2,
        )
        if total_invoiced_decimal
        else 0
    )

    # =========================================================
    # INVOICE STATUS REPORT
    # =========================================================

    invoice_status_report = [
        {
            "status": "PENDING",
            "count": pending_invoices,
        },
        {
            "status": "PARTIALLY_PAID",
            "count": partially_paid_invoices,
        },
        {
            "status": "PAID",
            "count": paid_invoices,
        },
        {
            "status": "OVERDUE",
            "count": overdue_invoices,
        },
    ]

    # =========================================================
    # MALL PAYMENT METHOD REPORT
    # =========================================================

    payment_method_rows = (
        db.query(
            Payment.payment_method,
            func.count(Payment.id),
            func.coalesce(
                func.sum(Payment.amount),
                0,
            ),
        )
        .filter(Payment.status == "SUCCESS")
        .group_by(Payment.payment_method)
        .all()
    )

    payment_methods = []

    for method, transaction_count, amount in payment_method_rows:

        amount_decimal = Decimal(
            str(amount or 0)
        )

        percentage = (
            round(
                (
                    amount_decimal
                    / total_collected_decimal
                )
                * 100,
                2,
            )
            if total_collected_decimal
            else 0
        )

        payment_methods.append(
            {
                "method": method,
                "transactions": transaction_count,
                "amount": float(
                    amount_decimal
                ),
                "percentage": percentage,
            }
        )

    # =========================================================
    # MONTHLY MALL COLLECTION REPORT
    # =========================================================

    monthly_rows = (
        db.query(
            func.date_format(
                Payment.payment_date,
                "%Y-%m",
            ).label("month"),
            func.count(Payment.id).label(
                "transactions"
            ),
            func.coalesce(
                func.sum(Payment.amount),
                0,
            ).label("amount"),
        )
        .filter(Payment.status == "SUCCESS")
        .group_by(
            func.date_format(
                Payment.payment_date,
                "%Y-%m",
            )
        )
        .order_by(
            func.date_format(
                Payment.payment_date,
                "%Y-%m",
            )
        )
        .all()
    )

    monthly_collections = []

    for row in monthly_rows:

        monthly_collections.append(
            {
                "month": row.month,
                "transactions": row.transactions,
                "amount": float(
                    row.amount or 0
                ),
            }
        )

    # =========================================================
    # MALL SHOP PERFORMANCE
    # =========================================================

    shop_rows = (
        db.query(
            Shop.id,
            Shop.shop_code,
            Shop.name,
            Shop.floor,
            func.count(
                Payment.id
            ).label("transactions"),
            func.coalesce(
                func.sum(Payment.amount),
                0,
            ).label("collected"),
        )
        .join(
            Lease,
            Lease.shop_id == Shop.id,
        )
        .join(
            Invoice,
            Invoice.lease_id == Lease.id,
        )
        .join(
            Payment,
            Payment.invoice_id == Invoice.id,
        )
        .filter(
            Payment.status == "SUCCESS"
        )
        .group_by(
            Shop.id,
            Shop.shop_code,
            Shop.name,
            Shop.floor,
        )
        .order_by(
            func.sum(
                Payment.amount
            ).desc()
        )
        .limit(10)
        .all()
    )

    shop_performance = []

    for row in shop_rows:

        collected = Decimal(
            str(row.collected or 0)
        )

        shop_performance.append(
            {
                "shop_id": row.id,
                "shop_code": row.shop_code,
                "shop_name": row.name,
                "floor": row.floor,
                "transactions": row.transactions,
                "collected": float(
                    collected
                ),
            }
        )

    # =========================================================
    # LEASE STATUS REPORT
    # =========================================================

    lease_status_report = [
        {
            "status": "ACTIVE",
            "count": active_leases,
        },
        {
            "status": "EXPIRING_SOON",
            "count": expiring_leases,
        },
        {
            "status": "EXPIRED",
            "count": expired_leases,
        },
        {
            "status": "TERMINATED",
            "count": terminated_leases,
        },
    ]

    # =========================================================
    # =========================================================
    # RETAIL SALES ANALYTICS
    # =========================================================
    # =========================================================

    # ---------------------------------------------------------
    # RETAIL OVERVIEW
    # ---------------------------------------------------------

    retail_transactions = (
        db.query(Sale).count()
    )

    retail_revenue = (
        db.query(
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            )
        )
        .scalar()
    )

    retail_items_sold = (
        db.query(
            func.coalesce(
                func.sum(Sale.quantity),
                0,
            )
        )
        .scalar()
    )

    retail_average_sale = (
        db.query(
            func.coalesce(
                func.avg(Sale.total_amount),
                0,
            )
        )
        .scalar()
    )

    retail_revenue_decimal = Decimal(
        str(retail_revenue or 0)
    )

    retail_average_decimal = Decimal(
        str(retail_average_sale or 0)
    )

    # ---------------------------------------------------------
    # RETAIL PAYMENT METHODS
    # ---------------------------------------------------------

    retail_payment_rows = (
        db.query(
            Sale.payment_method,
            func.count(Sale.id).label(
                "transactions"
            ),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("revenue"),
        )
        .group_by(
            Sale.payment_method
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
        .all()
    )

    retail_payment_methods = []

    for row in retail_payment_rows:

        revenue = Decimal(
            str(row.revenue or 0)
        )

        percentage = (
            round(
                (
                    revenue
                    / retail_revenue_decimal
                )
                * 100,
                2,
            )
            if retail_revenue_decimal
            else 0
        )

        retail_payment_methods.append(
            {
                "method": row.payment_method,
                "transactions": row.transactions,
                "revenue": float(revenue),
                "percentage": percentage,
            }
        )

    # ---------------------------------------------------------
    # RETAIL PRODUCT CATEGORIES
    # ---------------------------------------------------------

    retail_category_rows = (
        db.query(
            Sale.product_category,
            func.count(Sale.id).label(
                "transactions"
            ),
            func.coalesce(
                func.sum(Sale.quantity),
                0,
            ).label("items"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("revenue"),
        )
        .group_by(
            Sale.product_category
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
        .all()
    )

    retail_categories = []

    for row in retail_category_rows:

        revenue = Decimal(
            str(row.revenue or 0)
        )

        percentage = (
            round(
                (
                    revenue
                    / retail_revenue_decimal
                )
                * 100,
                2,
            )
            if retail_revenue_decimal
            else 0
        )

        retail_categories.append(
            {
                "category": (
                    row.product_category
                    or "Uncategorized"
                ),
                "transactions": row.transactions,
                "items": int(
                    row.items or 0
                ),
                "revenue": float(
                    revenue
                ),
                "percentage": percentage,
            }
        )

    # ---------------------------------------------------------
    # MONTHLY RETAIL SALES
    # ---------------------------------------------------------

    retail_monthly_rows = (
        db.query(
            func.date_format(
                Sale.sale_date,
                "%Y-%m",
            ).label("month"),
            func.count(Sale.id).label(
                "transactions"
            ),
            func.coalesce(
                func.sum(Sale.quantity),
                0,
            ).label("items"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("revenue"),
        )
        .group_by(
            func.date_format(
                Sale.sale_date,
                "%Y-%m",
            )
        )
        .order_by(
            func.date_format(
                Sale.sale_date,
                "%Y-%m",
            )
        )
        .all()
    )

    retail_monthly_sales = []

    for row in retail_monthly_rows:

        retail_monthly_sales.append(
            {
                "month": row.month,
                "transactions": row.transactions,
                "items": int(
                    row.items or 0
                ),
                "revenue": float(
                    row.revenue or 0
                ),
            }
        )

    # ---------------------------------------------------------
    # RETAIL SHOP PERFORMANCE
    # ---------------------------------------------------------

    retail_shop_rows = (
        db.query(
            Shop.id,
            Shop.shop_code,
            Shop.name,
            Shop.floor,
            Tenant.id.label("tenant_id"),
            Tenant.name.label("tenant_name"),
            func.count(Sale.id).label(
                "transactions"
            ),
            func.coalesce(
                func.sum(Sale.quantity),
                0,
            ).label("items"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("revenue"),
        )
        .join(
            Sale,
            Sale.shop_id == Shop.id,
        )
        .join(
            Tenant,
            Tenant.id == Sale.tenant_id,
        )
        .group_by(
            Shop.id,
            Shop.shop_code,
            Shop.name,
            Shop.floor,
            Tenant.id,
            Tenant.name,
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
        .limit(10)
        .all()
    )

    retail_shop_performance = []

    for row in retail_shop_rows:

        revenue = Decimal(
            str(row.revenue or 0)
        )

        retail_shop_performance.append(
            {
                "shop_id": row.id,
                "shop_code": row.shop_code,
                "shop_name": row.name,
                "floor": row.floor,
                "tenant_id": row.tenant_id,
                "tenant_name": row.tenant_name,
                "transactions": row.transactions,
                "items": int(
                    row.items or 0
                ),
                "revenue": float(
                    revenue
                ),
            }
        )

    # ---------------------------------------------------------
    # RETAIL TENANT PERFORMANCE
    # ---------------------------------------------------------

    retail_tenant_rows = (
        db.query(
            Tenant.id,
            Tenant.name,
            Tenant.company_name,
            func.count(Sale.id).label(
                "transactions"
            ),
            func.coalesce(
                func.sum(Sale.quantity),
                0,
            ).label("items"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("revenue"),
        )
        .join(
            Sale,
            Sale.tenant_id == Tenant.id,
        )
        .group_by(
            Tenant.id,
            Tenant.name,
            Tenant.company_name,
        )
        .order_by(
            func.sum(
                Sale.total_amount
            ).desc()
        )
        .limit(10)
        .all()
    )

    retail_tenant_performance = []

    for row in retail_tenant_rows:

        revenue = Decimal(
            str(row.revenue or 0)
        )

        retail_tenant_performance.append(
            {
                "tenant_id": row.id,
                "tenant_name": row.name,
                "company_name": (
                    row.company_name
                    or ""
                ),
                "transactions": row.transactions,
                "items": int(
                    row.items or 0
                ),
                "revenue": float(
                    revenue
                ),
            }
        )

    # =========================================================
    # FINAL RESPONSE
    # =========================================================

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },

        # -----------------------------------------------------
        # EXISTING REPORT DATA
        # -----------------------------------------------------

        "overview": {
            "total_shops": total_shops,
            "occupied_shops": occupied_shops,
            "vacant_shops": vacant_shops,
            "maintenance_shops": maintenance_shops,
            "occupancy_percentage": occupancy_percentage,
            "total_tenants": total_tenants,
            "total_leases": total_leases,
            "total_restaurants": total_restaurants,
        },

        "financial": {
            "total_invoiced": float(
                total_invoiced_decimal
            ),
            "total_collected": float(
                total_collected_decimal
            ),
            "outstanding": float(
                outstanding
            ),
            "collection_percentage": collection_percentage,
        },

        "transactions": {
            "successful": successful_transactions,
            "failed": failed_transactions,
            "refunded": refunded_transactions,
            "average_transaction": float(
                average_transaction or 0
            ),
        },

        "invoices": {
            "total": total_invoices,
            "pending": pending_invoices,
            "partially_paid": partially_paid_invoices,
            "paid": paid_invoices,
            "overdue": overdue_invoices,
        },

        "invoice_status": invoice_status_report,

        "payment_methods": payment_methods,

        "monthly_collections": monthly_collections,

        "shop_performance": shop_performance,

        "lease_status": lease_status_report,

        # -----------------------------------------------------
        # NEW RETAIL SALES REPORT DATA
        # -----------------------------------------------------

        "retail_sales": {
            "total_transactions": retail_transactions,

            "total_revenue": float(
                retail_revenue_decimal
            ),

            "total_items": int(
                retail_items_sold or 0
            ),

            "average_sale": float(
                retail_average_decimal
            ),

            "payment_methods": retail_payment_methods,

            "categories": retail_categories,

            "monthly_sales": retail_monthly_sales,

            "shop_performance": retail_shop_performance,

            "tenant_performance": retail_tenant_performance,
        },
    }