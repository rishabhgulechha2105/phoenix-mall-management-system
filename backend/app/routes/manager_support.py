from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SupportRequest, Tenant, Shop
from ..dependencies import require_manager_or_admin


router = APIRouter(
    prefix="/manager/support",
    tags=["Manager Support"],
)


# =========================================================
# CONSTANTS
# =========================================================

ALLOWED_STATUSES = {
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED",
}

ALLOWED_PRIORITIES = {
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
}

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


# =========================================================
# PYDANTIC SCHEMA
# =========================================================

class SupportRequestUpdate(BaseModel):
    status: Optional[str] = None
    manager_response: Optional[str] = None


# =========================================================
# FORMAT REQUEST
# =========================================================

def format_request(
    request: SupportRequest,
    tenant: Optional[Tenant],
    shop: Optional[Shop],
):
    return {
        "id": request.id,
        "request_number": request.request_number,
        "request_type": request.request_type,
        "subject": request.subject,
        "description": request.description,
        "priority": request.priority,
        "status": request.status,
        "manager_response": request.manager_response,
        "created_at": request.created_at,
        "updated_at": request.updated_at,

        "tenant": (
            {
                "id": tenant.id,
                "name": tenant.name,
                "email": tenant.email,
                "phone": tenant.phone,
                "company_name": tenant.company_name,
            }
            if tenant
            else None
        ),

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


# =========================================================
# GET ALL SUPPORT REQUESTS
# =========================================================

@router.get("/")
def get_all_support_requests(
    search: Optional[str] = Query(
        None,
        description="Search request, tenant, shop, subject or description",
    ),
    status: Optional[str] = Query(
        None,
        description="Filter by request status",
    ),
    priority: Optional[str] = Query(
        None,
        description="Filter by priority",
    ),
    request_type: Optional[str] = Query(
        None,
        description="Filter by request type",
    ),
    shop_id: Optional[int] = Query(
        None,
        description="Filter by shop",
    ),
    tenant_id: Optional[int] = Query(
        None,
        description="Filter by tenant",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """
    Manager/Admin can view all support requests.
    """

    query = db.query(SupportRequest)

    # -------------------------
    # Status
    # -------------------------

    if status:
        status = status.upper().strip()

        if status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. "
                    f"Allowed values: {', '.join(sorted(ALLOWED_STATUSES))}"
                ),
            )

        query = query.filter(
            SupportRequest.status == status
        )

    # -------------------------
    # Priority
    # -------------------------

    if priority:
        priority = priority.upper().strip()

        if priority not in ALLOWED_PRIORITIES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid priority. "
                    f"Allowed values: {', '.join(sorted(ALLOWED_PRIORITIES))}"
                ),
            )

        query = query.filter(
            SupportRequest.priority == priority
        )

    # -------------------------
    # Request Type
    # -------------------------

    if request_type:
        request_type = request_type.upper().strip()

        if request_type not in ALLOWED_REQUEST_TYPES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid request type. "
                    f"Allowed values: {', '.join(sorted(ALLOWED_REQUEST_TYPES))}"
                ),
            )

        query = query.filter(
            SupportRequest.request_type == request_type
        )

    # -------------------------
    # Shop
    # -------------------------

    if shop_id:
        query = query.filter(
            SupportRequest.shop_id == shop_id
        )

    # -------------------------
    # Tenant
    # -------------------------

    if tenant_id:
        query = query.filter(
            SupportRequest.tenant_id == tenant_id
        )

    requests = (
        query
        .order_by(
            SupportRequest.created_at.desc()
        )
        .all()
    )

    # -------------------------
    # Search
    # -------------------------

    if search:
        search_lower = search.lower().strip()

        filtered_requests = []

        for request in requests:

            tenant = (
                db.query(Tenant)
                .filter(
                    Tenant.id == request.tenant_id
                )
                .first()
            )

            shop = (
                db.query(Shop)
                .filter(
                    Shop.id == request.shop_id
                )
                .first()
            )

            searchable_text = " ".join(
                [
                    request.request_number or "",
                    request.subject or "",
                    request.description or "",
                    request.request_type or "",
                    request.priority or "",
                    request.status or "",
                    tenant.name if tenant else "",
                    tenant.email if tenant else "",
                    tenant.company_name if tenant and tenant.company_name else "",
                    shop.name if shop else "",
                    shop.shop_code if shop else "",
                ]
            ).lower()

            if search_lower in searchable_text:
                filtered_requests.append(
                    format_request(
                        request,
                        tenant,
                        shop,
                    )
                )

    else:

        filtered_requests = []

        for request in requests:

            tenant = (
                db.query(Tenant)
                .filter(
                    Tenant.id == request.tenant_id
                )
                .first()
            )

            shop = (
                db.query(Shop)
                .filter(
                    Shop.id == request.shop_id
                )
                .first()
            )

            filtered_requests.append(
                format_request(
                    request,
                    tenant,
                    shop,
                )
            )

    # =====================================================
    # SUMMARY
    # =====================================================

    summary = {
        "total": len(filtered_requests),

        "open": sum(
            1
            for item in filtered_requests
            if item["status"] == "OPEN"
        ),

        "in_progress": sum(
            1
            for item in filtered_requests
            if item["status"] == "IN_PROGRESS"
        ),

        "resolved": sum(
            1
            for item in filtered_requests
            if item["status"] == "RESOLVED"
        ),

        "closed": sum(
            1
            for item in filtered_requests
            if item["status"] == "CLOSED"
        ),

        "urgent": sum(
            1
            for item in filtered_requests
            if item["priority"] == "URGENT"
        ),

        "high_priority": sum(
            1
            for item in filtered_requests
            if item["priority"] == "HIGH"
        ),
    }

    return {
        "summary": summary,
        "requests": filtered_requests,
    }


# =========================================================
# GET SINGLE REQUEST
# =========================================================

@router.get("/{request_id}")
def get_support_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """
    Manager/Admin can view any support request.
    """

    request = (
        db.query(SupportRequest)
        .filter(
            SupportRequest.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Support request not found.",
        )

    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.id == request.tenant_id
        )
        .first()
    )

    shop = (
        db.query(Shop)
        .filter(
            Shop.id == request.shop_id
        )
        .first()
    )

    return format_request(
        request,
        tenant,
        shop,
    )


# =========================================================
# UPDATE REQUEST
# =========================================================

@router.put("/{request_id}")
def update_support_request(
    request_id: int,
    payload: SupportRequestUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_manager_or_admin),
):
    """
    Manager/Admin can update:

    - status
    - manager response

    Tenant/shop ownership cannot be changed here.
    """

    request = (
        db.query(SupportRequest)
        .filter(
            SupportRequest.id == request_id
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=404,
            detail="Support request not found.",
        )

    # -------------------------
    # Status
    # -------------------------

    if payload.status is not None:

        new_status = payload.status.upper().strip()

        if new_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status. "
                    f"Allowed values: {', '.join(sorted(ALLOWED_STATUSES))}"
                ),
            )

        request.status = new_status

    # -------------------------
    # Manager Response
    # -------------------------

    if payload.manager_response is not None:

        response = payload.manager_response.strip()

        request.manager_response = (
            response if response else None
        )

    db.commit()
    db.refresh(request)

    tenant = (
        db.query(Tenant)
        .filter(
            Tenant.id == request.tenant_id
        )
        .first()
    )

    shop = (
        db.query(Shop)
        .filter(
            Shop.id == request.shop_id
        )
        .first()
    )

    return {
        "message": "Support request updated successfully.",

        "request": format_request(
            request,
            tenant,
            shop,
        ),
    }