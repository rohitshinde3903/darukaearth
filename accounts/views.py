from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from .models import CustomUser
from .serializers import CustomUserSerializer
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
# Create your views here.

@api_view(['GET'])
def login_view(request):
    users = CustomUser.objects.all()
    serializer = CustomUserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def register_view(request):
    serializer = CustomUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


def normal_login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')  # Redirect to dashboard
        return render(request, 'login.html', {'error': 'Invalid credentials'})
    return render(request, 'login.html')


def normal_register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = CustomUser.objects.create_user(email=email, username=username, password=password)
        user.save()
        return redirect('login')  # or your desired URL name
    return render(request, 'register.html')

