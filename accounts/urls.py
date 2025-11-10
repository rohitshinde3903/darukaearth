from django.urls import path
from . import views

urlpatterns = [
    path('api_register/', views.api_register, name='api_register'),
    path('api_login/', views.api_login, name='api_login'),
]