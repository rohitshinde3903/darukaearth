from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from .models import Project, Site
from .serializers import ProjectSerializer, SiteSerializer, SiteGeoJSONSerializer
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError

User = get_user_model()

@login_required
def dashboard(request):
    """Dashboard view showing user's projects"""
    projects = Project.objects.filter(created_by=request.user, is_active=True)
    return render(request, 'dashboard.html', {'projects': projects})

@login_required
def create_project_view(request):
    """View for creating a new project"""
    if request.method == 'POST':
        serializer = ProjectSerializer(data=request.POST, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return redirect('dashboard')
        return render(request, 'create_project.html', {'errors': serializer.errors})
    return render(request, 'create_project.html')

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def project_list_api(request):
    """API endpoint to list and create projects"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        projects = Project.objects.filter(created_by=request.user, is_active=True)
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ProjectSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
@csrf_exempt
def project_detail_api(request, pk):
    """API endpoint to retrieve, update, or delete a project"""
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        project = Project.objects.get(pk=pk, created_by=request.user)
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ProjectSerializer(project)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        project.is_active = False
        project.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.AllowAny]  # Changed to AllowAny for now
    
    def perform_create(self, serializer):
        # Get email from request data
        created_by_email = self.request.data.get('created_by')
        
        if created_by_email:
            try:
                user = User.objects.get(email=created_by_email)
                serializer.save(created_by=user)
            except User.DoesNotExist:
                # If user doesn't exist, raise a validation error
                raise ValidationError({'created_by': 'User with this email does not exist'})
        else:
            # If authenticated, use request.user, otherwise raise error
            if self.request.user.is_authenticated:
                serializer.save(created_by=self.request.user)
            else:
                raise ValidationError({'created_by': 'User email is required'})
    
    def get_queryset(self):
        return Project.objects.all().order_by('-created_at')

class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Site.objects.all()
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Return GeoJSON FeatureCollection format"""
        queryset = self.get_queryset()
        serializer = SiteGeoJSONSerializer(queryset, many=True)
        
        return Response({
            'type': 'FeatureCollection',
            'features': serializer.data
        })
    
    def perform_create(self, serializer):
        created_by_email = self.request.data.get('created_by_email')
        
        if created_by_email:
            try:
                user = User.objects.get(email=created_by_email)
                serializer.save(created_by=user)
            except User.DoesNotExist:
                # If user doesn't exist, raise a validation error
                raise ValidationError({'created_by': 'User with this email does not exist'})
        else:
            # If authenticated, use request.user, otherwise raise error
            if self.request.user.is_authenticated:
                serializer.save(created_by=self.request.user)
            else:
                raise ValidationError({'created_by': 'User email is required'})
