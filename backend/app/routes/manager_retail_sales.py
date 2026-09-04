from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Sale, Shop, Tenant, User


router = APIRouter(
    prefix="/manager/retail-sales",
    tags=["Manager Retail Sales"],
)


# =========================================================
# GET ALL RETAIL SALES
# =========================================================

@router.get("/")
def get_all_retail_sales(
    search: str | None = None,
    payment_method: str | None = None,
    shop_id: int | None = None,
    tenant_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    query = (
        db.query(Sale)
        .join(Shop, Sale.shop_id == Shop.id)
        .join(Tenant, Sale.tenant_id == Tenant.id)
    )

    # -----------------------------------------------------
    # SEARCH
    # -----------------------------------------------------

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Sale.sale_number.ilike(search_value),
                Sale.customer_name.ilike(search_value),
                Sale.customer_phone.ilike(search_value),
                Sale.product_name.ilike(search_value),
                Sale.product_category.ilike(search_value),
                Shop.shop_code.ilike(search_value),
                Shop.name.ilike(search_value),
                Tenant.name.ilike(search_value),
                Tenant.company_name.ilike(search_value),
            )
        )

    # -----------------------------------------------------
    # PAYMENT METHOD FILTER
    # -----------------------------------------------------

    if payment_method:
        query = query.filter(
            Sale.payment_method == payment_method
        )

    # -----------------------------------------------------
    # SHOP FILTER
    # -----------------------------------------------------

    if shop_id:
        query = query.filter(
            Sale.shop_id == shop_id
        )

    # -----------------------------------------------------
    # TENANT FILTER
    # -----------------------------------------------------

    if tenant_id:
        query = query.filter(
            Sale.tenant_id == tenant_id
        )

    # -----------------------------------------------------
    # ORDER
    # -----------------------------------------------------

    sales = (
        query
        .order_by(Sale.sale_date.desc())
        .all()
    )

    # -----------------------------------------------------
    # FORMAT RESPONSE
    # -----------------------------------------------------

    result = []

    for sale in sales:
        result.append({
            "id": sale.id,
            "sale_number": sale.sale_number,

            "shop": {
                "id": sale.shop.id,
                "shop_code": sale.shop.shop_code,
                "name": sale.shop.name,
                "floor": sale.shop.floor,
            },

            "tenant": {
                "id": sale.tenant.id,
                "name": sale.tenant.name,
                "company_name": sale.tenant.company_name,
            },

            "customer": {
                "name": sale.customer_name,
                "phone": sale.customer_phone,
            },

            "product": {
                "name": sale.product_name,
                "category": sale.product_category,
            },

            "quantity": sale.quantity,
            "unit_price": float(sale.unit_price),
            "total_amount": float(sale.total_amount),

            "payment_method": sale.payment_method,
            "transaction_reference": sale.transaction_reference,

            "sale_date": sale.sale_date,
            "created_at": sale.created_at,
        })

    # -----------------------------------------------------
    # SUMMARY FOR CURRENT FILTER
    # -----------------------------------------------------

    filtered_count = len(result)

    filtered_revenue = sum(
        Decimal(str(item["total_amount"]))
        for item in result
    )

    filtered_items = sum(
        item["quantity"]
        for item in result
    )

    average_sale = (
        filtered_revenue / filtered_count
        if filtered_count
        else Decimal("0")
    )

    # -----------------------------------------------------
    # PAYMENT BREAKDOWN
    # -----------------------------------------------------

    payment_breakdown = {}

    for item in result:
        method = item["payment_method"]

        if method not in payment_breakdown:
            payment_breakdown[method] = {
                "method": method,
                "transactions": 0,
                "amount": Decimal("0"),
            }

        payment_breakdown[method]["transactions"] += 1
        payment_breakdown[method]["amount"] += Decimal(
            str(item["total_amount"])
        )

    payment_methods = []

    for item in payment_breakdown.values():
        payment_methods.append({
            "method": item["method"],
            "transactions": item["transactions"],
            "amount": float(item["amount"]),
        })

    payment_methods.sort(
        key=lambda x: x["amount"],
        reverse=True,
    )

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },

        "summary": {
            "total_transactions": filtered_count,
            "total_revenue": float(filtered_revenue),
            "total_items": filtered_items,
            "average_sale": float(average_sale),
        },

        "payment_methods": payment_methods,

        "sales": result,
    }


# =========================================================
# GET SHOPS FOR FILTER
# =========================================================

@router.get("/shops")
def get_retail_sales_shops(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    shops = (
        db.query(Shop)
        .join(Sale, Sale.shop_id == Shop.id)
        .distinct()
        .order_by(Shop.shop_code.asc())
        .all()
    )

    return [
        {
            "id": shop.id,
            "shop_code": shop.shop_code,
            "name": shop.name,
            "floor": shop.floor,
        }
        for shop in shops
    ]


# =========================================================
# GET TENANTS FOR FILTER
# =========================================================

@router.get("/tenants")
def get_retail_sales_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    tenants = (
        db.query(Tenant)
        .join(Sale, Sale.tenant_id == Tenant.id)
        .distinct()
        .order_by(Tenant.name.asc())
        .all()
    )

    return [
        {
            "id": tenant.id,
            "name": tenant.name,
            "company_name": tenant.company_name,
        }
        for tenant in tenants
    ]