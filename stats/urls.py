from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteAnalyticsViewSet

router = DefaultRouter()
router.register(r'analytics', SiteAnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
