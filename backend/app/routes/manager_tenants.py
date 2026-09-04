from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_manager_or_admin
from ..models import Tenant, User


router = APIRouter(
    prefix="/manager/tenants",
    tags=["Manager - Tenants"],
)


# =========================
# RESPONSE MODEL
# =========================

class ManagerTenantResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    company_name: Optional[str] = None
    gst_number: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================
# CREATE MODEL
# =========================

class ManagerTenantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    company_name: Optional[str] = None
    gst_number: Optional[str] = None


# =========================
# UPDATE MODEL
# =========================

class ManagerTenantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    gst_number: Optional[str] = None


# =========================
# GET ALL TENANTS
# =========================

@router.get(
    "/",
    response_model=list[ManagerTenantResponse],
)
def get_manager_tenants(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    tenants = (
        db.query(Tenant)
        .order_by(Tenant.id.asc())
        .all()
    )

    return tenants


# =========================
# GET SINGLE TENANT
# =========================

@router.get(
    "/{tenant_id}",
    response_model=ManagerTenantResponse,
)
def get_manager_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found.",
        )

    return tenant


# =========================
# CREATE TENANT
# =========================

@router.post(
    "/",
    response_model=ManagerTenantResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_manager_tenant(
    tenant_data: ManagerTenantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    email = str(
        tenant_data.email
    ).strip().lower()

    # -------------------------
    # Check duplicate email
    # -------------------------

    existing_email = (
        db.query(Tenant)
        .filter(
            Tenant.email == email
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="A tenant with this email already exists.",
        )

    # -------------------------
    # Check duplicate GST
    # -------------------------

    gst_number = (
        tenant_data.gst_number.strip().upper()
        if tenant_data.gst_number
        and tenant_data.gst_number.strip()
        else None
    )

    if gst_number:
        existing_gst = (
            db.query(Tenant)
            .filter(
                Tenant.gst_number
                == gst_number
            )
            .first()
        )

        if existing_gst:
            raise HTTPException(
                status_code=400,
                detail="A tenant with this GST number already exists.",
            )

    # -------------------------
    # Validate required fields
    # -------------------------

    if not tenant_data.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Tenant name is required.",
        )

    if not tenant_data.phone.strip():
        raise HTTPException(
            status_code=400,
            detail="Phone number is required.",
        )

    # -------------------------
    # Create tenant
    # -------------------------

    tenant = Tenant(
        name=tenant_data.name.strip(),
        email=email,
        phone=tenant_data.phone.strip(),
        company_name=(
            tenant_data.company_name.strip()
            if tenant_data.company_name
            and tenant_data.company_name.strip()
            else None
        ),
        gst_number=gst_number,
    )

    db.add(tenant)

    try:
        db.commit()
        db.refresh(tenant)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to create tenant. Email or GST number may already exist.",
        )

    return tenant


# =========================
# UPDATE TENANT
# =========================

@router.put(
    "/{tenant_id}",
    response_model=ManagerTenantResponse,
)
def update_manager_tenant(
    tenant_id: int,
    tenant_data: ManagerTenantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.id == tenant_id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found.",
        )

    update_data = tenant_data.model_dump(
        exclude_unset=True
    )

    # -------------------------
    # Name
    # -------------------------

    if "name" in update_data:

        if not update_data["name"].strip():
            raise HTTPException(
                status_code=400,
                detail="Tenant name cannot be empty.",
            )

        tenant.name = (
            update_data["name"].strip()
        )

    # -------------------------
    # Email
    # -------------------------

    if "email" in update_data:

        new_email = str(
            update_data["email"]
        ).strip().lower()

        existing_email = (
            db.query(Tenant)
            .filter(
                Tenant.email == new_email,
                Tenant.id != tenant_id,
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="A tenant with this email already exists.",
            )

        tenant.email = new_email

    # -------------------------
    # Phone
    # -------------------------

    if "phone" in update_data:

        if not update_data["phone"].strip():
            raise HTTPException(
                status_code=400,
                detail="Phone number cannot be empty.",
            )

        tenant.phone = (
            update_data["phone"].strip()
        )

    # -------------------------
    # Company
    # -------------------------

    if "company_name" in update_data:

        tenant.company_name = (
            update_data["company_name"].strip()
            if update_data["company_name"]
            and update_data["company_name"].strip()
            else None
        )

    # -------------------------
    # GST
    # -------------------------

    if "gst_number" in update_data:

        new_gst = (
            update_data["gst_number"]
            .strip()
            .upper()
            if update_data["gst_number"]
            and update_data["gst_number"].strip()
            else None
        )

        if new_gst:

            existing_gst = (
                db.query(Tenant)
                .filter(
                    Tenant.gst_number
                    == new_gst,
                    Tenant.id != tenant_id,
                )
                .first()
            )

            if existing_gst:
                raise HTTPException(
                    status_code=400,
                    detail="A tenant with this GST number already exists.",
                )

        tenant.gst_number = new_gst

    # -------------------------
    # Save changes
    # -------------------------

    try:
        db.commit()
        db.refresh(tenant)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to update tenant. Email or GST number may already exist.",
        )

    return tenant


# =========================
# DELETE TENANT
# =========================

@router.delete(
    "/{tenant_id}"
)
def delete_manager_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_manager_or_admin
    ),
):
    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.id == tenant_id
        )
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found.",
        )

    try:
        db.delete(tenant)
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This tenant cannot be deleted "
                "because they are linked to an "
                "existing lease or other records."
            ),
        )

    return {
        "message": "Tenant deleted successfully.",
        "tenant_id": tenant_id,
    }