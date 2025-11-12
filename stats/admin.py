from django.contrib import admin
from .models import SiteAnalytics

@admin.register(SiteAnalytics)
class SiteAnalyticsAdmin(admin.ModelAdmin):
    list_display = ('id', 'site', 'date', 'carbon_sequestered', 'species_count', 'vegetation_index', 'created_at')
    list_filter = ('date', 'site', 'created_at')
    search_fields = ('site__name', 'site__project__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-date',)
    
    fieldsets = (
        ('Site Information', {
            'fields': ('site', 'date')
        }),
        ('Carbon Metrics', {
            'fields': ('carbon_sequestered', 'carbon_offset')
        }),
        ('Biodiversity Metrics', {
            'fields': ('species_count', 'vegetation_index', 'tree_cover_percentage')
        }),
        ('Environmental Metrics', {
            'fields': ('soil_quality_index', 'water_retention')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
