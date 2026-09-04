from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Invoice, Payment, User


router = APIRouter(
    prefix="/manager/payments",
    tags=["Manager - Payments"],
)


# ============================================================
# SCHEMAS
# ============================================================

class PaymentResponse(BaseModel):
    id: int

    invoice_id: int
    invoice_number: str

    shop_code: str
    shop_name: str

    tenant_id: int
    tenant_name: str
    tenant_company: str | None

    amount: Decimal
    payment_date: date
    payment_method: str
    transaction_reference: str | None
    status: str


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: Decimal
    payment_date: date
    payment_method: str
    transaction_reference: str | None = None
    status: str = "SUCCESS"


class PaymentUpdate(BaseModel):
    invoice_id: int | None = None
    amount: Decimal | None = None
    payment_date: date | None = None
    payment_method: str | None = None
    transaction_reference: str | None = None
    status: str | None = None


# ============================================================
# VALID VALUES
# ============================================================

VALID_PAYMENT_METHODS = {
    "CASH",
    "CARD",
    "UPI",
    "BANK_TRANSFER",
}

VALID_PAYMENT_STATUSES = {
    "SUCCESS",
    "FAILED",
    "REFUNDED",
}


# ============================================================
# HELPER — UPDATE INVOICE STATUS
# ============================================================

def update_invoice_status(
    invoice: Invoice,
    db: Session,
):
    """
    Recalculate invoice status based on successful payments.

    Rules:

    No successful payment
        + due date passed       -> OVERDUE
        + due date not passed   -> PENDING

    Successful payments < invoice total
        -> PARTIALLY_PAID

    Successful payments >= invoice total
        -> PAID
    """

    successful_paid = (
        db.query(Payment)
        .filter(
            Payment.invoice_id == invoice.id,
            Payment.status == "SUCCESS",
        )
        .with_entities(Payment.amount)
        .all()
    )

    total_paid = sum(
        (amount for (amount,) in successful_paid),
        Decimal("0"),
    )

    invoice_total = Decimal(invoice.total_amount or 0)

    if total_paid >= invoice_total and invoice_total > 0:
        invoice.status = "PAID"

    elif total_paid > 0:
        invoice.status = "PARTIALLY_PAID"

    else:
        if invoice.due_date and invoice.due_date < date.today():
            invoice.status = "OVERDUE"
        else:
            invoice.status = "PENDING"


# ============================================================
# HELPER — BUILD RESPONSE
# ============================================================

def build_payment_response(payment: Payment):
    invoice = payment.invoice
    lease = invoice.lease
    shop = lease.shop
    tenant = lease.tenant

    return {
        "id": payment.id,

        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,

        "shop_code": shop.shop_code,
        "shop_name": shop.name,

        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "tenant_company": tenant.company_name,

        "amount": payment.amount,
        "payment_date": payment.payment_date,
        "payment_method": payment.payment_method,
        "transaction_reference": payment.transaction_reference,
        "status": payment.status,
    }


# ============================================================
# GET ALL PAYMENTS
# ============================================================

@router.get("/", response_model=list[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    payments = (
        db.query(Payment)
        .join(
            Invoice,
            Payment.invoice_id == Invoice.id,
        )
        .order_by(Payment.id.desc())
        .all()
    )

    return [
        build_payment_response(payment)
        for payment in payments
    ]


# ============================================================
# GET SINGLE PAYMENT
# ============================================================

@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    return build_payment_response(payment)


# ============================================================
# CREATE PAYMENT
# ============================================================

@router.post(
    "/",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    # --------------------------------------------------------
    # Validate invoice
    # --------------------------------------------------------

    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == data.invoice_id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found",
        )

    # --------------------------------------------------------
    # Validate amount
    # --------------------------------------------------------

    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than zero",
        )

    # --------------------------------------------------------
    # Validate payment method
    # --------------------------------------------------------

    if data.payment_method not in VALID_PAYMENT_METHODS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid payment method. "
                "Use CASH, CARD, UPI or BANK_TRANSFER."
            ),
        )

    # --------------------------------------------------------
    # Validate payment status
    # --------------------------------------------------------

    if data.status not in VALID_PAYMENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid payment status. "
                "Use SUCCESS, FAILED or REFUNDED."
            ),
        )

    # --------------------------------------------------------
    # Create payment
    # --------------------------------------------------------

    payment = Payment(
        invoice_id=data.invoice_id,
        amount=data.amount,
        payment_date=data.payment_date,
        payment_method=data.payment_method,
        transaction_reference=data.transaction_reference,
        status=data.status,
    )

    db.add(payment)

    # Flush first so the new payment is included
    # when calculating the invoice status.
    db.flush()

    # --------------------------------------------------------
    # Recalculate invoice status
    # --------------------------------------------------------

    update_invoice_status(
        invoice=invoice,
        db=db,
    )

    db.commit()
    db.refresh(payment)

    return build_payment_response(payment)


# ============================================================
# UPDATE PAYMENT
# ============================================================

@router.put(
    "/{payment_id}",
    response_model=PaymentResponse,
)
def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    # Keep track of the original invoice.
    # This matters if the payment is moved to another invoice.
    old_invoice = payment.invoice

    # --------------------------------------------------------
    # Invoice
    # --------------------------------------------------------

    if data.invoice_id is not None:

        invoice = (
            db.query(Invoice)
            .filter(Invoice.id == data.invoice_id)
            .first()
        )

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        payment.invoice_id = data.invoice_id

    # --------------------------------------------------------
    # Amount
    # --------------------------------------------------------

    if data.amount is not None:

        if data.amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment amount must be greater than zero",
            )

        payment.amount = data.amount

    # --------------------------------------------------------
    # Payment date
    # --------------------------------------------------------

    if data.payment_date is not None:
        payment.payment_date = data.payment_date

    # --------------------------------------------------------
    # Payment method
    # --------------------------------------------------------

    if data.payment_method is not None:

        if data.payment_method not in VALID_PAYMENT_METHODS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid payment method. "
                    "Use CASH, CARD, UPI or BANK_TRANSFER."
                ),
            )

        payment.payment_method = data.payment_method

    # --------------------------------------------------------
    # Transaction reference
    # --------------------------------------------------------

    if data.transaction_reference is not None:
        payment.transaction_reference = (
            data.transaction_reference
        )

    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    if data.status is not None:

        if data.status not in VALID_PAYMENT_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid payment status. "
                    "Use SUCCESS, FAILED or REFUNDED."
                ),
            )

        payment.status = data.status

    # --------------------------------------------------------
    # Recalculate affected invoice(s)
    # --------------------------------------------------------

    # If payment was moved to another invoice,
    # recalculate both the old and new invoices.
    if data.invoice_id is not None:

        new_invoice = payment.invoice

        update_invoice_status(
            invoice=old_invoice,
            db=db,
        )

        if new_invoice.id != old_invoice.id:
            update_invoice_status(
                invoice=new_invoice,
                db=db,
            )

    else:

        update_invoice_status(
            invoice=payment.invoice,
            db=db,
        )

    db.commit()
    db.refresh(payment)

    return build_payment_response(payment)


# ============================================================
# DELETE PAYMENT
# ============================================================

@router.delete("/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    # Remember invoice before deleting payment.
    invoice = payment.invoice

    db.delete(payment)

    # Flush so deleted payment is no longer counted.
    db.flush()

    # Recalculate invoice status.
    update_invoice_status(
        invoice=invoice,
        db=db,
    )

    db.commit()

    return {
        "message": "Payment deleted successfully",
        "payment_id": payment_id,
    }