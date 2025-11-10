from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser as User
from .models import CustomUser
from .serializers import CustomUserSerializer

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


@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    """API endpoint for user registration"""
    email = request.data.get('email')
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not email or not username or not password:
        return Response(
            {'error': 'All fields are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'email': ['User with this email already exists']}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'username': ['User with this username already exists']}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.create_user(
            email=email,
            username=username,
            password=password
        )
        return Response({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """API endpoint for login with password verification"""
    email = request.data.get('email')
    password = request.data.get('password')
    
    print(f"DEBUG Login: Attempting login for email: {email}")
    
    if not email or not password:
        print("DEBUG Login: Missing email or password")
        return Response(
            {'error': 'Email and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get user by email
        user = User.objects.get(email=email)
        print(f"DEBUG Login: Found user: {user.username}")
        
        # Check password
        if user.check_password(password):
            print("DEBUG Login: Password is correct")
            return Response({
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            print("DEBUG Login: Password is incorrect")
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    except User.DoesNotExist:
        print(f"DEBUG Login: User not found with email: {email}")
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        print(f"DEBUG Login: Unexpected error: {str(e)}")
        return Response(
            {'error': 'An error occurred'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )