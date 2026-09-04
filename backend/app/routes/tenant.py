from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_tenant
from ..models import Invoice, Lease, Payment, Tenant, User


router = APIRouter(
    prefix="/tenant",
    tags=["Tenant Portal"],
)


@router.get("/dashboard")
def get_tenant_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant),
):
    # ---------------------------------------------------------
    # Find the tenant record using the authenticated user's email
    # ---------------------------------------------------------
    tenant = (
        db.query(Tenant)
        .filter(Tenant.email == current_user.email)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant profile not found",
        )

    # ---------------------------------------------------------
    # Get this tenant's leases
    # ---------------------------------------------------------
    leases = (
        db.query(Lease)
        .filter(Lease.tenant_id == tenant.id)
        .order_by(Lease.start_date.desc())
        .all()
    )

    # ---------------------------------------------------------
    # Summary counters
    # ---------------------------------------------------------
    total_leases = len(leases)

    active_leases = sum(
        1 for lease in leases
        if lease.status == "ACTIVE"
    )

    expiring_leases = sum(
        1 for lease in leases
        if lease.status == "EXPIRING_SOON"
    )

    expired_leases = sum(
        1 for lease in leases
        if lease.status == "EXPIRED"
    )

    terminated_leases = sum(
        1 for lease in leases
        if lease.status == "TERMINATED"
    )

    # ---------------------------------------------------------
    # Build lease information
    # ---------------------------------------------------------
    lease_data = []

    lease_ids = []

    for lease in leases:
        lease_ids.append(lease.id)

        shop = lease.shop

        lease_data.append({
            "lease_id": lease.id,
            "lease_number": lease.lease_number,
            "status": lease.status,

            "start_date": lease.start_date,
            "end_date": lease.end_date,

            "monthly_rent": float(
                lease.monthly_rent or Decimal("0")
            ),

            "maintenance_charge": float(
                lease.maintenance_charge or Decimal("0")
            ),

            "security_deposit": float(
                lease.security_deposit or Decimal("0")
            ),

            "shop": {
                "id": shop.id,
                "shop_code": shop.shop_code,
                "name": shop.name,
                "floor": shop.floor,
                "area_sqft": float(
                    shop.area_sqft or Decimal("0")
                ),
            },
        })

    # ---------------------------------------------------------
    # Get invoices belonging to this tenant
    # ---------------------------------------------------------
    invoices = []

    if lease_ids:
        invoices = (
            db.query(Invoice)
            .filter(Invoice.lease_id.in_(lease_ids))
            .order_by(Invoice.billing_month.desc())
            .all()
        )

    # ---------------------------------------------------------
    # Invoice summary
    # ---------------------------------------------------------
    total_invoices = len(invoices)

    pending_invoices = sum(
        1 for invoice in invoices
        if invoice.status == "PENDING"
    )

    partially_paid_invoices = sum(
        1 for invoice in invoices
        if invoice.status == "PARTIALLY_PAID"
    )

    paid_invoices = sum(
        1 for invoice in invoices
        if invoice.status == "PAID"
    )

    overdue_invoices = sum(
        1 for invoice in invoices
        if invoice.status == "OVERDUE"
    )

    total_invoiced = sum(
        (invoice.total_amount or Decimal("0"))
        for invoice in invoices
    )

    # ---------------------------------------------------------
    # Payment information
    # ---------------------------------------------------------
    invoice_ids = [invoice.id for invoice in invoices]

    payments = []

    if invoice_ids:
        payments = (
            db.query(Payment)
            .filter(Payment.invoice_id.in_(invoice_ids))
            .order_by(Payment.payment_date.desc())
            .all()
        )

    successful_payments = [
        payment
        for payment in payments
        if payment.status == "SUCCESS"
    ]

    total_paid = sum(
        (payment.amount or Decimal("0"))
        for payment in successful_payments
    )

    outstanding = max(
        Decimal("0"),
        total_invoiced - total_paid
    )

    # ---------------------------------------------------------
    # Format invoice data
    # ---------------------------------------------------------
    invoice_data = []

    for invoice in invoices:
        lease = invoice.lease
        shop = lease.shop

        invoice_payments = [
            payment
            for payment in payments
            if payment.invoice_id == invoice.id
        ]

        payment_data = []

        for payment in invoice_payments:
            payment_data.append({
                "payment_id": payment.id,
                "amount": float(
                    payment.amount or Decimal("0")
                ),
                "payment_date": payment.payment_date,
                "payment_method": payment.payment_method,
                "transaction_reference": payment.transaction_reference,
                "status": payment.status,
            })

        invoice_data.append({
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,

            "billing_month": invoice.billing_month,

            "rent_amount": float(
                invoice.rent_amount or Decimal("0")
            ),

            "maintenance_amount": float(
                invoice.maintenance_amount or Decimal("0")
            ),

            "utility_amount": float(
                invoice.utility_amount or Decimal("0")
            ),

            "subtotal": float(
                invoice.subtotal or Decimal("0")
            ),

            "tax_amount": float(
                invoice.tax_amount or Decimal("0")
            ),

            "total_amount": float(
                invoice.total_amount or Decimal("0")
            ),

            "due_date": invoice.due_date,
            "status": invoice.status,

            "shop": {
                "shop_code": shop.shop_code,
                "name": shop.name,
                "floor": shop.floor,
            },

            "payments": payment_data,
        })

    # ---------------------------------------------------------
    # Payment history
    # ---------------------------------------------------------
    payment_history = []

    for payment in payments:
        invoice = payment.invoice
        lease = invoice.lease
        shop = lease.shop

        payment_history.append({
            "payment_id": payment.id,
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,

            "shop_code": shop.shop_code,
            "shop_name": shop.name,

            "amount": float(
                payment.amount or Decimal("0")
            ),

            "payment_date": payment.payment_date,
            "payment_method": payment.payment_method,
            "transaction_reference": payment.transaction_reference,
            "status": payment.status,
        })

    # ---------------------------------------------------------
    # Return tenant dashboard
    # ---------------------------------------------------------
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },

        "profile": {
            "tenant_id": tenant.id,
            "name": tenant.name,
            "email": tenant.email,
            "phone": tenant.phone,
            "company_name": tenant.company_name,
            "gst_number": tenant.gst_number,
        },

        "overview": {
            "total_leases": total_leases,
            "active_leases": active_leases,
            "expiring_leases": expiring_leases,
            "expired_leases": expired_leases,
            "terminated_leases": terminated_leases,
        },

        "financial": {
            "total_invoiced": float(total_invoiced),
            "total_paid": float(total_paid),
            "outstanding": float(outstanding),
        },

        "invoice_summary": {
            "total": total_invoices,
            "pending": pending_invoices,
            "partially_paid": partially_paid_invoices,
            "paid": paid_invoices,
            "overdue": overdue_invoices,
        },

        "leases": lease_data,

        "invoices": invoice_data,

        "payments": payment_history,
    }