from django.db import models
from projects.models import Site

class SiteAnalytics(models.Model):
    site = models.ForeignKey(Site, on_delete=models.CASCADE, related_name='analytics')
    date = models.DateField()
    
    # Carbon metrics
    carbon_sequestered = models.FloatField(default=0.0, help_text='In metric tons')
    carbon_offset = models.FloatField(default=0.0, help_text='In metric tons')
    
    # Biodiversity metrics
    species_count = models.IntegerField(default=0)
    vegetation_index = models.FloatField(default=0.0, help_text='NDVI value 0-1')
    tree_cover_percentage = models.FloatField(default=0.0)
    
    # Environmental metrics
    soil_quality_index = models.FloatField(default=0.0, help_text='0-100 scale')
    water_retention = models.FloatField(default=0.0, help_text='In cubic meters')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['site', 'date']
    
    def __str__(self):
        return f"{self.site.name} - {self.date}"
