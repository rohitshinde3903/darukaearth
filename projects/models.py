from django.db import models
from django.conf import settings
import json

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

class Site(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='sites')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    geometry = models.JSONField()  # Store GeoJSON polygon
    area = models.FloatField(null=True, blank=True)  # Area in square meters
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sites')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def calculate_area(self):
        """Calculate approximate area from polygon coordinates"""
        if not self.geometry or self.geometry.get('type') != 'Polygon':
            return 0
        
        coords = self.geometry.get('coordinates', [[]])[0]
        if len(coords) < 3:
            return 0
        
        # Simple area calculation (not accurate for large areas)
        # For production, use proper geospatial libraries
        area = 0
        for i in range(len(coords) - 1):
            area += coords[i][0] * coords[i+1][1]
            area -= coords[i+1][0] * coords[i][1]
        area = abs(area) / 2.0
        
        # Convert to approximate square meters (rough estimation)
        # 1 degree ≈ 111,320 meters at equator
        return area * 111320 * 111320
    
    def save(self, *args, **kwargs):
        if self.geometry:
            self.area = self.calculate_area()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} - {self.project.name}"
