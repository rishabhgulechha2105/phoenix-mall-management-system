from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.shops import router as shops_router
from app.routes.restaurants import router as restaurants_router
from app.routes.offers import router as offers_router
from app.routes.reviews import router as reviews_router
from app.routes.auth import router as auth_router
from app.routes.manager import router as manager_router
from app.routes.manager_shops import router as manager_shops_router
from app.routes.manager_tenants import router as manager_tenants_router
from app.routes.manager_leases import router as manager_leases_router
from app.routes.manager_invoices import router as manager_invoices_router
from app.routes.manager_payments import router as manager_payments_router
from app.routes.manager_restaurants import router as manager_restaurants_router
from app.routes.manager_offers import router as manager_offers_router
from app.routes.manager_reviews import router as manager_reviews_router
from app.routes.manager_sales import router as manager_sales_router
from app.routes.manager_reports import router as manager_reports_router
from app.routes.tenant import router as tenant_router
from app.routes.tenant_sales import router as tenant_sales_router
from app.routes.manager_retail_sales import router as manager_retail_sales_router
from .routes import tenant_support
from .routes import manager_support
app = FastAPI(
    title="Mall Management API",
    description=(
        "REST API for mall operations, tenants, shops, leases, "
        "billing and restaurants."
    ),
    version="1.0.0",
)


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# API ROUTES
# =========================

app.include_router(shops_router)
app.include_router(restaurants_router)
app.include_router(offers_router)
app.include_router(reviews_router)
app.include_router(auth_router)
app.include_router(manager_router)
app.include_router(manager_shops_router)
app.include_router(manager_tenants_router)
app.include_router(manager_leases_router)
app.include_router(manager_invoices_router)
app.include_router(manager_payments_router)
app.include_router(manager_restaurants_router)
app.include_router(manager_offers_router)
app.include_router(manager_reviews_router)
app.include_router(manager_sales_router)
app.include_router(manager_reports_router)
app.include_router(tenant_router)
app.include_router(tenant_sales_router)
app.include_router(manager_retail_sales_router)
app.include_router(tenant_support.router)
app.include_router(manager_support.router)
# =========================
# ROOT ENDPOINT
# =========================

@app.get("/")
def root():
    return {
        "message": "Mall Management API is running",
        "version": "1.0.0",
    }


# =========================
# HEALTH CHECK
# =========================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }
