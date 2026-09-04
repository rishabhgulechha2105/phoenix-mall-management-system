from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant, Lease, Shop, SupportRequest
from ..dependencies import require_tenant


router = APIRouter(
    prefix="/tenant/support",
    tags=["Tenant Support"],
)


# =========================================================
# PYDANTIC SCHEMAS
# =========================================================

class SupportRequestCreate(BaseModel):
    request_type: str = "MAINTENANCE"

    subject: str = Field(
        ...,
        min_length=3,
        max_length=200,
    )

    description: str = Field(
        ...,
        min_length=5,
    )

    priority: str = "MEDIUM"


# =========================================================
# CONSTANTS
# =========================================================

ALLOWED_REQUEST_TYPES = {
    "MAINTENANCE",
    "ELECTRICAL",
    "PLUMBING",
    "CLEANING",
    "SECURITY",
    "HVAC",
    "IT",
    "OTHER",
}

ALLOWED_PRIORITIES = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
}


# =========================================================
# HELPER — GET LOGGED-IN TENANT
# =========================================================

def get_logged_in_tenant(
    current_user,
    db: Session,
):
    """
    Find the tenant using the email associated
    with the currently authenticated account.

    The frontend never sends tenant_id.
    """

    tenant = (
        db.query(Tenant)
        .filter(Tenant.email == current_user.email)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant profile not found.",
        )

    return tenant


# =========================================================
# HELPER — GET TENANT'S ACTIVE SHOP
# =========================================================

def get_tenant_active_lease(
    tenant_id: int,
    db: Session,
):
    """
    Find the tenant's active/expiring lease.

    This prevents the tenant from choosing an arbitrary shop.
    """

    lease = (
        db.query(Lease)
        .filter(
            Lease.tenant_id == tenant_id,
            Lease.status.in_(["ACTIVE", "EXPIRING_SOON"]),
        )
        .order_by(Lease.end_date.desc())
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=400,
            detail="You do not have an active lease.",
        )

    return lease


# =========================================================
# GENERATE REQUEST NUMBER
# =========================================================

def generate_request_number(db: Session):
    """
    Generate a request number such as:

    SR-2026-0001
    SR-2026-0002
    """

    year = datetime.now().year

    latest = (
        db.query(SupportRequest)
        .filter(
            SupportRequest.request_number.like(
                f"SR-{year}-%"
            )
        )
        .order_by(SupportRequest.id.desc())
        .first()
    )

    if latest:
        try:
            last_number = int(
                latest.request_number.split("-")[-1]
            )
        except (ValueError, IndexError):
            last_number = 0
    else:
        last_number = 0

    return f"SR-{year}-{last_number + 1:04d}"


# =========================================================
# CREATE SUPPORT REQUEST
# =========================================================

@router.post("/")
def create_support_request(
    request: SupportRequestCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_tenant),
):
    """
    Tenant creates a support / maintenance request.

    Tenant ID and Shop ID are NEVER accepted from
    the frontend.

    They are derived from the authenticated tenant's
    active lease.
    """

    tenant = get_logged_in_tenant(
        current_user,
        db,
    )

    lease = get_tenant_active_lease(
        tenant.id,
        db,
    )

    shop = (
        db.query(Shop)
        .filter(Shop.id == lease.shop_id)
        .first()
    )

    if not shop:
        raise HTTPException(
            status_code=404,
            detail="Your leased shop could not be found.",
        )

    request_type = request.request_type.upper().strip()
    priority = request.priority.upper().strip()

    if request_type not in ALLOWED_REQUEST_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid request type. "
                f"Allowed values: {', '.join(sorted(ALLOWED_REQUEST_TYPES))}"
            ),
        )

    if priority not in ALLOWED_PRIORITIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid priority. "
                f"Allowed values: {', '.join(sorted(ALLOWED_PRIORITIES))}"
            ),
        )

    request_number = generate_request_number(
        db
    )

    support_request = SupportRequest(
        request_number=request_number,
        shop_id=shop.id,
        tenant_id=tenant.id,
        request_type=request_type,
        subject=request.subject.strip(),
        description=request.description.strip(),
        priority=priority,
        status="OPEN",
    )

    db.add(support_request)
    db.commit()
    db.refresh(support_request)

    return {
        "message": "Support request created successfully.",
        "request": {
            "id": support_request.id,
            "request_number": support_request.request_number,
            "request_type": support_request.request_type,
            "subject": support_request.subject,
            "description": support_request.description,
            "priority": support_request.priority,
            "status": support_request.status,
            "manager_response": support_request.manager_response,
            "created_at": support_request.created_at,
            "updated_at": support_request.updated_at,
            "shop": {
                "id": shop.id,
                "shop_code": shop.shop_code,
                "name": shop.name,
                "floor": shop.floor,
            },
        },
    }


# =========================================================
# GET ALL SUPPORT REQUESTS FOR LOGGED-IN TENANT
# =========================================================

@router.get("/")
def get_my_support_requests(
    db: Session = Depends(get_db),
    current_user=Depends(require_tenant),
):
    """
    Return ONLY support requests belonging to
    the currently logged-in tenant.
    """

    tenant = get_logged_in_tenant(
        current_user,
        db,
    )

    requests = (
        db.query(SupportRequest)
        .filter(
            SupportRequest.tenant_id == tenant.id
        )
        .order_by(
            SupportRequest.created_at.desc()
        )
        .all()
    )

    result = []

    for item in requests:

        shop = (
            db.query(Shop)
            .filter(Shop.id == item.shop_id)
            .first()
        )

        result.append(
            {
                "id": item.id,
                "request_number": item.request_number,
                "request_type": item.request_type,
                "subject": item.subject,
                "description": item.description,
                "priority": item.priority,
                "status": item.status,
                "manager_response": item.manager_response,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
                "shop": (
                    {
                        "id": shop.id,
                        "shop_code": shop.shop_code,
                        "name": shop.name,
                        "floor": shop.floor,
                    }
                    if shop
                    else None
                ),
            }
        )

    return {
        "tenant": {
            "id": tenant.id,
            "name": tenant.name,
            "email": tenant.email,
        },
        "summary": {
            "total": len(result),
            "open": sum(
                1
                for item in result
                if item["status"] == "OPEN"
            ),
            "in_progress": sum(
                1
                for item in result
                if item["status"] == "IN_PROGRESS"
            ),
            "resolved": sum(
                1
                for item in result
                if item["status"] == "RESOLVED"
            ),
            "closed": sum(
                1
                for item in result
                if item["status"] == "CLOSED"
            ),
        },
        "requests": result,
    }


# =========================================================
# GET SINGLE SUPPORT REQUEST
# =========================================================

@router.get("/{request_id}")
def get_support_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_tenant),
):
    """
    Get one request.

    A tenant can only access their own request.
    """

    tenant = get_logged_in_tenant(
        current_user,
        db,
    )

    support_request = (
        db.query(SupportRequest)
        .filter(
            SupportRequest.id == request_id,
            SupportRequest.tenant_id == tenant.id,
        )
        .first()
    )

    if not support_request:
        raise HTTPException(
            status_code=404,
            detail="Support request not found.",
        )

    shop = (
        db.query(Shop)
        .filter(
            Shop.id == support_request.shop_id
        )
        .first()
    )

    return {
        "id": support_request.id,
        "request_number": support_request.request_number,
        "request_type": support_request.request_type,
        "subject": support_request.subject,
        "description": support_request.description,
        "priority": support_request.priority,
        "status": support_request.status,
        "manager_response": support_request.manager_response,
        "created_at": support_request.created_at,
        "updated_at": support_request.updated_at,
        "shop": (
            {
                "id": shop.id,
                "shop_code": shop.shop_code,
                "name": shop.name,
                "floor": shop.floor,
            }
            if shop
            else None
        ),
    }