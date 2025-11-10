from django.urls import path
from .views import login_view, register_view

urlpatterns = [
    path('api_login/', login_view, name='login'),
    path('api_register/', register_view, name='register'), 
]