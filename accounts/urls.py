from django.urls import path
from . import views

urlpatterns = [
    path('api_register/', views.api_register, name='api_register'),  # POST
    path('api_login/', views.api_login, name='api_login'),  # POST - not GET
    path('login/', views.api_login, name='api_login_v2'),  # New endpoint - bypasses cache
]