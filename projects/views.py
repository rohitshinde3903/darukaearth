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
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

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

@require_http_methods(["GET"])
def debug_request(request):
    """Temporary debug endpoint"""
    return JsonResponse({
        'query_params': dict(request.GET),
        'headers': dict(request.headers),
        'method': request.method,
        'path': request.path,
        'full_path': request.get_full_path(),
    })

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
    permission_classes = [permissions.AllowAny]
    
    def perform_create(self, serializer):
        created_by_email = self.request.data.get('created_by')
        
        print(f"DEBUG: Received data: {self.request.data}")
        print(f"DEBUG: created_by_email: {created_by_email}")
        
        if created_by_email:
            try:
                user = User.objects.get(email=created_by_email)
                print(f"DEBUG: Found user: {user}")
                serializer.save(created_by=user)
            except User.DoesNotExist:
                print(f"DEBUG: User not found with email: {created_by_email}")
                raise ValidationError({'created_by': f'User with email {created_by_email} does not exist'})
        else:
            print("DEBUG: No created_by email provided")
            if self.request.user.is_authenticated:
                serializer.save(created_by=self.request.user)
            else:
                raise ValidationError({'created_by': 'User email is required'})
    
    def get_queryset(self):
        created_by_email = self.request.query_params.get('user_email')
        
        print(f"DEBUG ProjectViewSet GET: Query params: {dict(self.request.query_params)}")
        print(f"DEBUG ProjectViewSet GET: user_email from params: {created_by_email}")
        print(f"DEBUG ProjectViewSet GET: Full URL path: {self.request.get_full_path()}")
        
        if created_by_email:
            queryset = Project.objects.filter(created_by__email=created_by_email).order_by('-created_at')
            print(f"DEBUG ProjectViewSet GET: Filtered projects count: {queryset.count()}")
            for proj in queryset:
                print(f"DEBUG ProjectViewSet GET: Project: {proj.id} - {proj.name} by {proj.created_by.email}")
            return queryset
        
        # FALLBACK: Return all projects for debugging (remove this in production after fixing)
        print("DEBUG ProjectViewSet GET: No user_email provided, returning ALL projects for debugging")
        all_projects = Project.objects.all().order_by('-created_at')
        print(f"DEBUG ProjectViewSet GET: Total projects in database: {all_projects.count()}")
        return all_projects
    
    def destroy(self, request, *args, **kwargs):
        """Handle project deletion"""
        try:
            instance = self.get_object()
            print(f"DEBUG: Attempting to delete project {instance.id} - {instance.name}")
            print(f"DEBUG: Created by: {instance.created_by.email}")
            
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            print(f"DEBUG: Delete error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Site.objects.all()
        project_id = self.request.query_params.get('project', None)
        user_email = self.request.query_params.get('user_email', None)
        
        print(f"DEBUG SiteViewSet: Query params: {self.request.query_params}")
        print(f"DEBUG SiteViewSet: project_id: {project_id}, user_email: {user_email}")
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        if user_email:
            try:
                user = User.objects.get(email=user_email)
                user_projects = Project.objects.filter(created_by=user)
                queryset = queryset.filter(project__in=user_projects)
                print(f"DEBUG SiteViewSet: Filtered sites count: {queryset.count()}")
            except User.DoesNotExist:
                print(f"DEBUG SiteViewSet: User not found: {user_email}")
                return Site.objects.none()
        else:
            print("DEBUG SiteViewSet: No user_email provided, returning empty queryset")
            return Site.objects.none()
        
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
        project_id = self.request.data.get('project')
        
        if project_id and created_by_email:
            try:
                user = User.objects.get(email=created_by_email)
                project = Project.objects.get(id=project_id, created_by=user)
                serializer.save(created_by=user)
            except User.DoesNotExist:
                raise ValidationError({'created_by': 'User with this email does not exist'})
            except Project.DoesNotExist:
                raise ValidationError({'project': 'Project not found or you do not have permission to add sites to it'})
        elif created_by_email:
            try:
                user = User.objects.get(email=created_by_email)
                serializer.save(created_by=user)
            except User.DoesNotExist:
                raise ValidationError({'created_by': 'User with this email does not exist'})
        else:
            if self.request.user.is_authenticated:
                serializer.save(created_by=self.request.user)
            else:
                raise ValidationError({'created_by': 'User email is required'})
