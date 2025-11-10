from rest_framework import serializers
from .models import Project, Site
from django.contrib.auth import get_user_model

User = get_user_model()

class ProjectSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_email = serializers.EmailField(write_only=True, required=False)
    created_by = serializers.CharField(source='created_by.email', read_only=True)
    site_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'created_by', 'created_by_email', 'created_by_username', 'created_at', 'updated_at', 'site_count']
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_site_count(self, obj):
        return obj.sites.count()

class SiteSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    created_by_email = serializers.EmailField(write_only=True, required=False)
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Site
        fields = ['id', 'project', 'name', 'description', 'geometry', 'area', 'created_by_email', 'created_by_username', 'project_name', 'created_at', 'updated_at']
        read_only_fields = ['area', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Remove created_by_email from validated_data as it's not a model field
        validated_data.pop('created_by_email', None)
        return super().create(validated_data)

class SiteGeoJSONSerializer(serializers.ModelSerializer):
    """GeoJSON Feature format for map display"""
    properties = serializers.SerializerMethodField()
    
    class Meta:
        model = Site
        fields = ['id', 'type', 'geometry', 'properties']
    
    def get_type(self, obj):
        return 'Feature'
    
    def get_properties(self, obj):
        return {
            'id': obj.id,
            'name': obj.name,
            'description': obj.description,
            'area': obj.area,
            'project_name': obj.project.name,
            'created_by_username': obj.created_by.username,
            'created_at': obj.created_at.isoformat(),
        }
    
    def to_representation(self, instance):
        return {
            'type': 'Feature',
            'id': instance.id,
            'geometry': instance.geometry,
            'properties': self.get_properties(instance)
        }
