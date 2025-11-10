from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, SiteViewSet, debug_request

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'sites', SiteViewSet, basename='site')

urlpatterns = [
    path('debug/', debug_request, name='debug'),  # Add this temporarily
    path('', include(router.urls)),
]


# # API endpoints
#     path('projects/', views.project_list_api, name='project_list_api'),
#     path('projects/<int:pk>/', views.project_detail_api, name='project_detail_api'),

# # Web views
#     path('dashboard/', views.dashboard, name='dashboard'),
#     path('create/', views.create_project_view, name='create_project'),
