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
    Shop,
    Tenant,
    User,
)


router = APIRouter(
    prefix="/manager/sales",
    tags=["Manager Sales"],
)


# ============================================================
# SALES DASHBOARD
# ============================================================

@router.get("/")
def get_sales_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    # --------------------------------------------------------
    # SUCCESSFUL PAYMENT TRANSACTIONS
    # --------------------------------------------------------

    successful_payments = (
        db.query(Payment)
        .filter(Payment.status == "SUCCESS")
        .count()
    )

    # --------------------------------------------------------
    # TOTAL SALES
    # --------------------------------------------------------

    total_sales = (
        db.query(
            func.coalesce(
                func.sum(Payment.amount),
                0
            )
        )
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )

    # --------------------------------------------------------
    # FAILED PAYMENTS
    # --------------------------------------------------------

    failed_payments = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .count()
    )

    # --------------------------------------------------------
    # REFUNDED PAYMENTS
    # --------------------------------------------------------

    refunded_payments = (
        db.query(Payment)
        .filter(Payment.status == "REFUNDED")
        .count()
    )

    # --------------------------------------------------------
    # AVERAGE SUCCESSFUL TRANSACTION
    # --------------------------------------------------------

    average_transaction = (
        db.query(
            func.coalesce(
                func.avg(Payment.amount),
                0
            )
        )
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )

    # --------------------------------------------------------
    # INVOICE TOTALS
    # --------------------------------------------------------

    total_invoiced = (
        db.query(
            func.coalesce(
                func.sum(Invoice.total_amount),
                0
            )
        )
        .scalar()
    )

    # --------------------------------------------------------
    # OUTSTANDING INVOICE VALUE
    # --------------------------------------------------------

    total_paid = (
        db.query(
            func.coalesce(
                func.sum(Payment.amount),
                0
            )
        )
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )

    outstanding = max(
        Decimal("0"),
        Decimal(str(total_invoiced or 0))
        - Decimal(str(total_paid or 0))
    )

    # --------------------------------------------------------
    # PAYMENT METHOD BREAKDOWN
    # --------------------------------------------------------

    payment_methods = (
        db.query(
            Payment.payment_method,
            func.count(Payment.id),
            func.coalesce(func.sum(Payment.amount), 0),
        )
        .filter(Payment.status == "SUCCESS")
        .group_by(Payment.payment_method)
        .all()
    )

    payment_method_data = []

    for method, count, amount in payment_methods:
        payment_method_data.append({
            "method": method,
            "transactions": count,
            "amount": float(amount or 0),
        })

    # --------------------------------------------------------
    # RECENT SALES
    # --------------------------------------------------------

    recent_payments = (
        db.query(Payment)
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .join(Lease, Invoice.lease_id == Lease.id)
        .join(Shop, Lease.shop_id == Shop.id)
        .join(Tenant, Lease.tenant_id == Tenant.id)
        .filter(Payment.status == "SUCCESS")
        .order_by(Payment.payment_date.desc())
        .limit(20)
        .all()
    )

    recent_sales = []

    for payment in recent_payments:

        invoice = payment.invoice
        lease = invoice.lease
        shop = lease.shop
        tenant = lease.tenant

        recent_sales.append({
            "payment_id": payment.id,
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "shop_code": shop.shop_code,
            "shop_name": shop.name,
            "tenant_name": tenant.name,
            "amount": float(payment.amount or 0),
            "payment_date": payment.payment_date,
            "payment_method": payment.payment_method,
            "transaction_reference": payment.transaction_reference,
        })

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    return {
        # ----------------------------------------------------
        # CURRENT LOGGED-IN MANAGER / ADMIN
        # ----------------------------------------------------

        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },

        # ----------------------------------------------------
        # SALES
        # ----------------------------------------------------

        "sales": {
            "total_sales": float(
                total_sales or Decimal("0")
            ),
            "successful_transactions": successful_payments,
            "average_transaction": float(
                average_transaction or Decimal("0")
            ),
            "failed_transactions": failed_payments,
            "refunded_transactions": refunded_payments,
        },

        # ----------------------------------------------------
        # BILLING
        # ----------------------------------------------------

        "billing": {
            "total_invoiced": float(
                total_invoiced or Decimal("0")
            ),
            "total_paid": float(
                total_paid or Decimal("0")
            ),
            "outstanding": float(outstanding),
        },

        # ----------------------------------------------------
        # PAYMENT METHODS
        # ----------------------------------------------------

        "payment_methods": payment_method_data,

        # ----------------------------------------------------
        # RECENT SALES
        # ----------------------------------------------------

        "recent_sales": recent_sales,
    }