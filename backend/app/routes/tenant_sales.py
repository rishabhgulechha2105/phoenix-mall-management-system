from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_tenant
from ..models import Lease, Sale, Tenant, User


router = APIRouter(
    prefix="/tenant/sales",
    tags=["Tenant Retail Sales"],
)


# =========================================================
# REQUEST SCHEMA
# =========================================================

class SaleCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=150)
    customer_phone: str | None = Field(
        default=None,
        max_length=20,
    )

    product_name: str = Field(..., min_length=1, max_length=200)
    product_category: str | None = Field(
        default=None,
        max_length=100,
    )

    quantity: int = Field(
        default=1,
        ge=1,
    )

    unit_price: Decimal = Field(
        ...,
        gt=0,
    )

    payment_method: str

    transaction_reference: str | None = Field(
        default=None,
        max_length=100,
    )


# =========================================================
# HELPER — GET LOGGED-IN TENANT
# =========================================================

def get_tenant_for_user(
    current_user: User,
    db: Session,
):
    tenant = (
        db.query(Tenant)
        .filter(Tenant.email == current_user.email)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found",
        )

    return tenant


# =========================================================
# HELPER — GENERATE SALE NUMBER
# =========================================================

def generate_sale_number(db: Session) -> str:
    last_sale = (
        db.query(Sale)
        .order_by(Sale.id.desc())
        .first()
    )

    if last_sale:
        next_id = last_sale.id + 1
    else:
        next_id = 1

    return f"SALE-2026-{next_id:04d}"


# =========================================================
# CREATE RETAIL SALE
# =========================================================

@router.post("/")
def create_sale(
    sale_data: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant),
):
    # -----------------------------------------------------
    # Get authenticated tenant
    # -----------------------------------------------------

    tenant = get_tenant_for_user(
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Get tenant's active lease
    #
    # IMPORTANT:
    # We DO NOT accept tenant_id or shop_id
    # from the frontend.
    # -----------------------------------------------------

    lease = (
        db.query(Lease)
        .filter(
            Lease.tenant_id == tenant.id,
            Lease.status.in_(
                ["ACTIVE", "EXPIRING_SOON"]
            ),
        )
        .order_by(Lease.start_date.desc())
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active shop assignment found for this tenant",
        )

    shop = lease.shop

    # -----------------------------------------------------
    # Validate payment method
    # -----------------------------------------------------

    allowed_methods = {
        "CASH",
        "CARD",
        "UPI",
        "BANK_TRANSFER",
    }

    if sale_data.payment_method not in allowed_methods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid payment method. "
                "Allowed values: CASH, CARD, UPI, BANK_TRANSFER"
            ),
        )

    # -----------------------------------------------------
    # Calculate total on the SERVER
    # -----------------------------------------------------

    total_amount = (
        sale_data.unit_price
        * sale_data.quantity
    )

    # -----------------------------------------------------
    # Generate sale number
    # -----------------------------------------------------

    sale_number = generate_sale_number(db)

    # -----------------------------------------------------
    # Create sale
    # -----------------------------------------------------

    sale = Sale(
        sale_number=sale_number,

        # These come from the authenticated tenant,
        # NOT from the frontend.
        tenant_id=tenant.id,
        shop_id=shop.id,

        customer_name=sale_data.customer_name,
        customer_phone=sale_data.customer_phone,

        product_name=sale_data.product_name,
        product_category=sale_data.product_category,

        quantity=sale_data.quantity,
        unit_price=sale_data.unit_price,
        total_amount=total_amount,

        payment_method=sale_data.payment_method,
        transaction_reference=sale_data.transaction_reference,
    )

    db.add(sale)
    db.commit()
    db.refresh(sale)

    return {
        "message": "Retail sale recorded successfully",

        "sale": {
            "id": sale.id,
            "sale_number": sale.sale_number,

            "tenant_id": sale.tenant_id,

            "shop": {
                "id": shop.id,
                "shop_code": shop.shop_code,
                "name": shop.name,
            },

            "customer_name": sale.customer_name,
            "customer_phone": sale.customer_phone,

            "product_name": sale.product_name,
            "product_category": sale.product_category,

            "quantity": sale.quantity,
            "unit_price": float(sale.unit_price),
            "total_amount": float(sale.total_amount),

            "payment_method": sale.payment_method,
            "transaction_reference": sale.transaction_reference,

            "sale_date": sale.sale_date,
        },
    }


# =========================================================
# GET TENANT SALES
# =========================================================

@router.get("/")
def get_tenant_sales(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant),
):
    # -----------------------------------------------------
    # Get authenticated tenant
    # -----------------------------------------------------

    tenant = get_tenant_for_user(
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Get ONLY this tenant's sales
    # -----------------------------------------------------

    sales = (
        db.query(Sale)
        .filter(Sale.tenant_id == tenant.id)
        .order_by(Sale.sale_date.desc())
        .all()
    )

    result = []

    for sale in sales:
        result.append({
            "id": sale.id,
            "sale_number": sale.sale_number,

            "shop": {
                "id": sale.shop.id,
                "shop_code": sale.shop.shop_code,
                "name": sale.shop.name,
            },

            "customer_name": sale.customer_name,
            "customer_phone": sale.customer_phone,

            "product_name": sale.product_name,
            "product_category": sale.product_category,

            "quantity": sale.quantity,
            "unit_price": float(sale.unit_price),
            "total_amount": float(sale.total_amount),

            "payment_method": sale.payment_method,
            "transaction_reference": sale.transaction_reference,

            "sale_date": sale.sale_date,
        })

    return {
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "company_name": tenant.company_name,
        },

        "total_sales": len(result),

        "sales": result,
    }


# =========================================================
# SALES SUMMARY
# =========================================================

@router.get("/summary")
def get_tenant_sales_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_tenant),
):
    # -----------------------------------------------------
    # Get authenticated tenant
    # -----------------------------------------------------

    tenant = get_tenant_for_user(
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Basic sales statistics
    # -----------------------------------------------------

    total_transactions = (
        db.query(func.count(Sale.id))
        .filter(Sale.tenant_id == tenant.id)
        .scalar()
    ) or 0

    total_sales = (
        db.query(func.coalesce(func.sum(Sale.total_amount), 0))
        .filter(Sale.tenant_id == tenant.id)
        .scalar()
    )

    average_sale = (
        db.query(func.coalesce(func.avg(Sale.total_amount), 0))
        .filter(Sale.tenant_id == tenant.id)
        .scalar()
    )

    total_items = (
        db.query(func.coalesce(func.sum(Sale.quantity), 0))
        .filter(Sale.tenant_id == tenant.id)
        .scalar()
    )

    # -----------------------------------------------------
    # Payment method breakdown
    # -----------------------------------------------------

    payment_rows = (
        db.query(
            Sale.payment_method,
            func.count(Sale.id).label("transactions"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("amount"),
        )
        .filter(Sale.tenant_id == tenant.id)
        .group_by(Sale.payment_method)
        .all()
    )

    payment_methods = []

    for row in payment_rows:
        payment_methods.append({
            "method": row.payment_method,
            "transactions": row.transactions,
            "amount": float(row.amount or 0),
        })

    # -----------------------------------------------------
    # Product/category breakdown
    # -----------------------------------------------------

    category_rows = (
        db.query(
            Sale.product_category,
            func.count(Sale.id).label("transactions"),
            func.coalesce(
                func.sum(Sale.total_amount),
                0,
            ).label("amount"),
        )
        .filter(Sale.tenant_id == tenant.id)
        .group_by(Sale.product_category)
        .order_by(
            func.sum(Sale.total_amount).desc()
        )
        .all()
    )

    categories = []

    for row in category_rows:
        categories.append({
            "category": row.product_category or "Uncategorized",
            "transactions": row.transactions,
            "amount": float(row.amount or 0),
        })

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "company_name": tenant.company_name,
        },

        "summary": {
            "total_transactions": total_transactions,
            "total_sales": float(total_sales or 0),
            "average_sale": float(average_sale or 0),
            "total_items": int(total_items or 0),
        },

        "payment_methods": payment_methods,

        "categories": categories,
    }