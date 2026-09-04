from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Invoice, Lease, Payment, User


router = APIRouter(
    prefix="/manager/invoices",
    tags=["Manager - Invoices"],
)


# ============================================================
# SCHEMAS
# ============================================================

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str

    lease_id: int
    lease_number: str

    shop_id: int
    shop_code: str
    shop_name: str

    tenant_id: int
    tenant_name: str
    tenant_company: str | None

    billing_month: date

    rent_amount: Decimal
    maintenance_amount: Decimal
    utility_amount: Decimal
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal

    due_date: date
    status: str


class InvoiceCreate(BaseModel):
    invoice_number: str
    lease_id: int

    billing_month: date

    rent_amount: Decimal
    maintenance_amount: Decimal = Decimal("0")
    utility_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")

    due_date: date
    status: str = "PENDING"


class InvoiceUpdate(BaseModel):
    invoice_number: str | None = None
    lease_id: int | None = None

    billing_month: date | None = None

    rent_amount: Decimal | None = None
    maintenance_amount: Decimal | None = None
    utility_amount: Decimal | None = None
    tax_amount: Decimal | None = None

    due_date: date | None = None
    status: str | None = None


# ============================================================
# HELPER
# ============================================================

VALID_STATUSES = {
    "PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
}


def build_invoice_response(invoice: Invoice):
    lease = invoice.lease
    shop = lease.shop
    tenant = lease.tenant

    return {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,

        "lease_id": lease.id,
        "lease_number": lease.lease_number,

        "shop_id": shop.id,
        "shop_code": shop.shop_code,
        "shop_name": shop.name,

        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "tenant_company": tenant.company_name,

        "billing_month": invoice.billing_month,

        "rent_amount": invoice.rent_amount,
        "maintenance_amount": invoice.maintenance_amount,
        "utility_amount": invoice.utility_amount,
        "subtotal": invoice.subtotal,
        "tax_amount": invoice.tax_amount,
        "total_amount": invoice.total_amount,

        "due_date": invoice.due_date,
        "status": invoice.status,
    }


def calculate_invoice_totals(
    rent_amount: Decimal,
    maintenance_amount: Decimal,
    utility_amount: Decimal,
    tax_amount: Decimal,
):
    subtotal = (
        rent_amount
        + maintenance_amount
        + utility_amount
    )

    total_amount = subtotal + tax_amount

    return subtotal, total_amount


# ============================================================
# GET ALL INVOICES
# ============================================================

@router.get("/", response_model=list[InvoiceResponse])
def get_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    invoices = (
        db.query(Invoice)
        .join(Lease, Invoice.lease_id == Lease.id)
        .order_by(Invoice.id.desc())
        .all()
    )

    return [
        build_invoice_response(invoice)
        for invoice in invoices
    ]


# ============================================================
# GET SINGLE INVOICE
# ============================================================

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    return build_invoice_response(invoice)


# ============================================================
# CREATE INVOICE
# ============================================================

@router.post(
    "/",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    # --------------------------------------------------------
    # Validate invoice number
    # --------------------------------------------------------

    existing_invoice = (
        db.query(Invoice)
        .filter(
            Invoice.invoice_number == data.invoice_number
        )
        .first()
    )

    if existing_invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice number already exists",
        )

    # --------------------------------------------------------
    # Validate lease
    # --------------------------------------------------------

    lease = (
        db.query(Lease)
        .filter(Lease.id == data.lease_id)
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lease not found",
        )

    # --------------------------------------------------------
    # Validate status
    # --------------------------------------------------------

    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid invoice status. "
                "Use PENDING, PARTIALLY_PAID, PAID or OVERDUE."
            ),
        )

    # --------------------------------------------------------
    # Validate amounts
    # --------------------------------------------------------

    amounts = [
        data.rent_amount,
        data.maintenance_amount,
        data.utility_amount,
        data.tax_amount,
    ]

    if any(amount < 0 for amount in amounts):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice amounts cannot be negative",
        )

    # --------------------------------------------------------
    # Calculate totals
    # --------------------------------------------------------

    subtotal, total_amount = calculate_invoice_totals(
        data.rent_amount,
        data.maintenance_amount,
        data.utility_amount,
        data.tax_amount,
    )

    # --------------------------------------------------------
    # Create invoice
    # --------------------------------------------------------

    invoice = Invoice(
        invoice_number=data.invoice_number,
        lease_id=data.lease_id,
        billing_month=data.billing_month,

        rent_amount=data.rent_amount,
        maintenance_amount=data.maintenance_amount,
        utility_amount=data.utility_amount,

        subtotal=subtotal,
        tax_amount=data.tax_amount,
        total_amount=total_amount,

        due_date=data.due_date,
        status=data.status,
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return build_invoice_response(invoice)


# ============================================================
# UPDATE INVOICE
# ============================================================

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    # --------------------------------------------------------
    # Invoice number
    # --------------------------------------------------------

    if data.invoice_number is not None:

        existing_invoice = (
            db.query(Invoice)
            .filter(
                Invoice.invoice_number == data.invoice_number,
                Invoice.id != invoice_id,
            )
            .first()
        )

        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice number already exists",
            )

        invoice.invoice_number = data.invoice_number

    # --------------------------------------------------------
    # Lease
    # --------------------------------------------------------

    if data.lease_id is not None:

        lease = (
            db.query(Lease)
            .filter(Lease.id == data.lease_id)
            .first()
        )

        if not lease:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lease not found",
            )

        invoice.lease_id = data.lease_id

    # --------------------------------------------------------
    # Billing month
    # --------------------------------------------------------

    if data.billing_month is not None:
        invoice.billing_month = data.billing_month

    # --------------------------------------------------------
    # Amounts
    # --------------------------------------------------------

    if data.rent_amount is not None:

        if data.rent_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rent amount cannot be negative",
            )

        invoice.rent_amount = data.rent_amount

    if data.maintenance_amount is not None:

        if data.maintenance_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maintenance amount cannot be negative",
            )

        invoice.maintenance_amount = data.maintenance_amount

    if data.utility_amount is not None:

        if data.utility_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Utility amount cannot be negative",
            )

        invoice.utility_amount = data.utility_amount

    if data.tax_amount is not None:

        if data.tax_amount < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tax amount cannot be negative",
            )

        invoice.tax_amount = data.tax_amount

    # --------------------------------------------------------
    # Recalculate totals
    # --------------------------------------------------------

    subtotal, total_amount = calculate_invoice_totals(
        invoice.rent_amount,
        invoice.maintenance_amount,
        invoice.utility_amount,
        invoice.tax_amount,
    )

    invoice.subtotal = subtotal
    invoice.total_amount = total_amount

    # --------------------------------------------------------
    # Due date
    # --------------------------------------------------------

    if data.due_date is not None:
        invoice.due_date = data.due_date

    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    if data.status is not None:

        if data.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid invoice status. "
                    "Use PENDING, PARTIALLY_PAID, PAID or OVERDUE."
                ),
            )

        invoice.status = data.status

    db.commit()
    db.refresh(invoice)

    return build_invoice_response(invoice)


# ============================================================
# DELETE INVOICE
# ============================================================

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    # --------------------------------------------------------
    # Prevent deleting invoices with payments
    # --------------------------------------------------------

    payment_exists = (
        db.query(Payment)
        .filter(Payment.invoice_id == invoice_id)
        .first()
    )

    if payment_exists:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This invoice cannot be deleted because "
                "payment records are linked to it."
            ),
        )

    db.delete(invoice)
    db.commit()

    return {
        "message": "Invoice deleted successfully",
        "invoice_id": invoice_id,
    }