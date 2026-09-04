from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Lease, Shop, Tenant, User


router = APIRouter(
    prefix="/manager/leases",
    tags=["Manager - Leases"],
)


# =========================================================
# RESPONSE MODEL
# =========================================================

class ManagerLeaseResponse(BaseModel):
    id: int
    lease_number: str

    shop_id: int
    shop_code: str
    shop_name: str

    tenant_id: int
    tenant_name: str
    tenant_company: Optional[str] = None

    start_date: date
    end_date: date

    monthly_rent: Decimal
    maintenance_charge: Decimal
    security_deposit: Decimal

    lease_status: str

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# CREATE MODEL
# =========================================================

class ManagerLeaseCreate(BaseModel):
    lease_number: str

    shop_id: int
    tenant_id: int

    start_date: date
    end_date: date

    monthly_rent: Decimal
    maintenance_charge: Decimal = Decimal("0")
    security_deposit: Decimal = Decimal("0")

    status: str = "ACTIVE"


# =========================================================
# UPDATE MODEL
# =========================================================

class ManagerLeaseUpdate(BaseModel):
    lease_number: Optional[str] = None

    shop_id: Optional[int] = None
    tenant_id: Optional[int] = None

    start_date: Optional[date] = None
    end_date: Optional[date] = None

    monthly_rent: Optional[Decimal] = None
    maintenance_charge: Optional[Decimal] = None
    security_deposit: Optional[Decimal] = None

    status: Optional[str] = None


# =========================================================
# HELPER
# =========================================================

VALID_STATUSES = {
    "ACTIVE",
    "EXPIRING_SOON",
    "EXPIRED",
    "TERMINATED",
}


def build_lease_response(lease: Lease):
    shop = lease.shop
    tenant = lease.tenant

    return {
        "id": lease.id,
        "lease_number": lease.lease_number,

        "shop_id": shop.id,
        "shop_code": shop.shop_code,
        "shop_name": shop.name,

        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "tenant_company": tenant.company_name,

        "start_date": lease.start_date,
        "end_date": lease.end_date,

        "monthly_rent": lease.monthly_rent,
        "maintenance_charge": lease.maintenance_charge,
        "security_deposit": lease.security_deposit,

        "lease_status": lease.status,
    }


# =========================================================
# GET ALL LEASES
# =========================================================

@router.get(
    "/",
    response_model=list[ManagerLeaseResponse],
)
def get_manager_leases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    leases = (
        db.query(Lease)
        .join(Shop, Lease.shop_id == Shop.id)
        .join(Tenant, Lease.tenant_id == Tenant.id)
        .order_by(Lease.id)
        .all()
    )

    return [
        build_lease_response(lease)
        for lease in leases
    ]


# =========================================================
# GET SINGLE LEASE
# =========================================================

@router.get(
    "/{lease_id}",
    response_model=ManagerLeaseResponse,
)
def get_manager_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    lease = (
        db.query(Lease)
        .filter(Lease.id == lease_id)
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=404,
            detail="Lease not found",
        )

    return build_lease_response(lease)


# =========================================================
# CREATE LEASE
# =========================================================

@router.post(
    "/",
    response_model=ManagerLeaseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_manager_lease(
    lease_data: ManagerLeaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    # -------------------------
    # BASIC VALIDATION
    # -------------------------

    lease_number = lease_data.lease_number.strip()

    if not lease_number:
        raise HTTPException(
            status_code=400,
            detail="Lease number is required",
        )

    if lease_data.start_date >= lease_data.end_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    if lease_data.monthly_rent < 0:
        raise HTTPException(
            status_code=400,
            detail="Monthly rent cannot be negative",
        )

    if lease_data.maintenance_charge < 0:
        raise HTTPException(
            status_code=400,
            detail="Maintenance charge cannot be negative",
        )

    if lease_data.security_deposit < 0:
        raise HTTPException(
            status_code=400,
            detail="Security deposit cannot be negative",
        )

    if lease_data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid lease status. "
                "Use ACTIVE, EXPIRING_SOON, EXPIRED, or TERMINATED."
            ),
        )

    # -------------------------
    # CHECK LEASE NUMBER
    # -------------------------

    existing_lease = (
        db.query(Lease)
        .filter(
            Lease.lease_number == lease_number
        )
        .first()
    )

    if existing_lease:
        raise HTTPException(
            status_code=400,
            detail="Lease number already exists",
        )

    # -------------------------
    # CHECK SHOP
    # -------------------------

    shop = (
        db.query(Shop)
        .filter(Shop.id == lease_data.shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=404,
            detail="Shop not found",
        )

    # -------------------------
    # CHECK TENANT
    # -------------------------

    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == lease_data.tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found",
        )

    # -------------------------
    # CREATE
    # -------------------------

    lease = Lease(
        lease_number=lease_number,
        shop_id=lease_data.shop_id,
        tenant_id=lease_data.tenant_id,
        start_date=lease_data.start_date,
        end_date=lease_data.end_date,
        monthly_rent=lease_data.monthly_rent,
        maintenance_charge=lease_data.maintenance_charge,
        security_deposit=lease_data.security_deposit,
        status=lease_data.status,
    )

    try:
        db.add(lease)
        db.commit()
        db.refresh(lease)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to create lease. Check the provided information.",
        )

    return build_lease_response(lease)


# =========================================================
# UPDATE LEASE
# =========================================================

@router.put(
    "/{lease_id}",
    response_model=ManagerLeaseResponse,
)
def update_manager_lease(
    lease_id: int,
    lease_data: ManagerLeaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    lease = (
        db.query(Lease)
        .filter(Lease.id == lease_id)
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=404,
            detail="Lease not found",
        )

    # -------------------------
    # LEASE NUMBER
    # -------------------------

    if lease_data.lease_number is not None:
        lease_number = lease_data.lease_number.strip()

        if not lease_number:
            raise HTTPException(
                status_code=400,
                detail="Lease number cannot be empty",
            )

        existing_lease = (
            db.query(Lease)
            .filter(
                Lease.lease_number == lease_number,
                Lease.id != lease_id,
            )
            .first()
        )

        if existing_lease:
            raise HTTPException(
                status_code=400,
                detail="Lease number already exists",
            )

        lease.lease_number = lease_number

    # -------------------------
    # SHOP
    # -------------------------

    if lease_data.shop_id is not None:

        shop = (
            db.query(Shop)
            .filter(Shop.id == lease_data.shop_id)
            .first()
        )

        if not shop:
            raise HTTPException(
                status_code=404,
                detail="Shop not found",
            )

        lease.shop_id = lease_data.shop_id

    # -------------------------
    # TENANT
    # -------------------------

    if lease_data.tenant_id is not None:

        tenant = (
            db.query(Tenant)
            .filter(Tenant.id == lease_data.tenant_id)
            .first()
        )

        if not tenant:
            raise HTTPException(
                status_code=404,
                detail="Tenant not found",
            )

        lease.tenant_id = lease_data.tenant_id

    # -------------------------
    # DATES
    # -------------------------

    new_start_date = (
        lease_data.start_date
        if lease_data.start_date is not None
        else lease.start_date
    )

    new_end_date = (
        lease_data.end_date
        if lease_data.end_date is not None
        else lease.end_date
    )

    if new_start_date >= new_end_date:
        raise HTTPException(
            status_code=400,
            detail="End date must be after start date",
        )

    lease.start_date = new_start_date
    lease.end_date = new_end_date

    # -------------------------
    # FINANCIAL VALUES
    # -------------------------

    if lease_data.monthly_rent is not None:

        if lease_data.monthly_rent < 0:
            raise HTTPException(
                status_code=400,
                detail="Monthly rent cannot be negative",
            )

        lease.monthly_rent = lease_data.monthly_rent

    if lease_data.maintenance_charge is not None:

        if lease_data.maintenance_charge < 0:
            raise HTTPException(
                status_code=400,
                detail="Maintenance charge cannot be negative",
            )

        lease.maintenance_charge = (
            lease_data.maintenance_charge
        )

    if lease_data.security_deposit is not None:

        if lease_data.security_deposit < 0:
            raise HTTPException(
                status_code=400,
                detail="Security deposit cannot be negative",
            )

        lease.security_deposit = (
            lease_data.security_deposit
        )

    # -------------------------
    # STATUS
    # -------------------------

    if lease_data.status is not None:

        if lease_data.status not in VALID_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid lease status. "
                    "Use ACTIVE, EXPIRING_SOON, EXPIRED, or TERMINATED."
                ),
            )

        lease.status = lease_data.status

    # -------------------------
    # SAVE
    # -------------------------

    try:
        db.commit()
        db.refresh(lease)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to update lease.",
        )

    return build_lease_response(lease)


# =========================================================
# DELETE LEASE
# =========================================================

@router.delete(
    "/{lease_id}",
)
def delete_manager_lease(
    lease_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_admin),
):
    lease = (
        db.query(Lease)
        .filter(Lease.id == lease_id)
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=404,
            detail="Lease not found",
        )

    try:
        db.delete(lease)
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This lease cannot be deleted because "
                "it has related invoices or other records."
            ),
        )

    return {
        "message": "Lease deleted successfully"
    }