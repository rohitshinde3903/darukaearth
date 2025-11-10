from rest_framework import serializers
from .models import SiteAnalytics

class SiteAnalyticsSerializer(serializers.ModelSerializer):
    site_name = serializers.CharField(source='site.name', read_only=True)
    
    class Meta:
        model = SiteAnalytics
        fields = ['id', 'site', 'site_name', 'date', 'carbon_sequestered', 
                  'carbon_offset', 'species_count', 'vegetation_index', 
                  'tree_cover_percentage', 'soil_quality_index', 'water_retention',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
