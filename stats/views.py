from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Sum, Max, Min
from .models import SiteAnalytics
from .serializers import SiteAnalyticsSerializer
from datetime import datetime, timedelta
import random

class SiteAnalyticsViewSet(viewsets.ModelViewSet):
    queryset = SiteAnalytics.objects.all()
    serializer_class = SiteAnalyticsSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = SiteAnalytics.objects.all()
        site_id = self.request.query_params.get('site', None)
        if site_id:
            queryset = queryset.filter(site_id=site_id)
        return queryset.order_by('-date')
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics for a site"""
        site_id = request.query_params.get('site')
        if not site_id:
            return Response({'error': 'Site ID required'}, status=400)
        
        analytics = SiteAnalytics.objects.filter(site_id=site_id)
        
        if not analytics.exists():
            # Generate sample data if none exists
            self.generate_sample_data(site_id)
            analytics = SiteAnalytics.objects.filter(site_id=site_id)
        
        summary = {
            'total_carbon_sequestered': analytics.aggregate(Sum('carbon_sequestered'))['carbon_sequestered__sum'] or 0,
            'avg_vegetation_index': analytics.aggregate(Avg('vegetation_index'))['vegetation_index__avg'] or 0,
            'total_species': analytics.aggregate(Max('species_count'))['species_count__max'] or 0,
            'avg_tree_cover': analytics.aggregate(Avg('tree_cover_percentage'))['tree_cover_percentage__avg'] or 0,
            'total_records': analytics.count(),
            'latest_date': analytics.first().date if analytics.exists() else None
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def time_series(self, request):
        """Get time series data for charts"""
        site_id = request.query_params.get('site')
        if not site_id:
            return Response({'error': 'Site ID required'}, status=400)
        
        analytics = SiteAnalytics.objects.filter(site_id=site_id).order_by('date')
        
        data = {
            'dates': [a.date.isoformat() for a in analytics],
            'carbon': [float(a.carbon_sequestered) for a in analytics],
            'vegetation': [float(a.vegetation_index) for a in analytics],
            'species': [a.species_count for a in analytics],
            'tree_cover': [float(a.tree_cover_percentage) for a in analytics]
        }
        
        return Response(data)
    
    def generate_sample_data(self, site_id):
        """Generate sample analytics data for demonstration"""
        from projects.models import Site
        
        try:
            site = Site.objects.get(id=site_id)
        except Site.DoesNotExist:
            return
        
        # Generate data for last 12 months
        end_date = datetime.now().date()
        for i in range(12):
            date = end_date - timedelta(days=i*30)
            
            SiteAnalytics.objects.get_or_create(
                site=site,
                date=date,
                defaults={
                    'carbon_sequestered': round(random.uniform(10, 50), 2),
                    'carbon_offset': round(random.uniform(8, 40), 2),
                    'species_count': random.randint(15, 45),
                    'vegetation_index': round(random.uniform(0.4, 0.9), 2),
                    'tree_cover_percentage': round(random.uniform(30, 75), 2),
                    'soil_quality_index': round(random.uniform(50, 90), 2),
                    'water_retention': round(random.uniform(100, 500), 2)
                }
            )
