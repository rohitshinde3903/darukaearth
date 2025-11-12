from django.contrib import admin
from .models import Project, Site

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_by', 'site_count', 'created_at')
    list_filter = ('created_at', 'created_by')
    search_fields = ('name', 'description', 'created_by__email')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Project Information', {
            'fields': ('name', 'description', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def site_count(self, obj):
        return obj.sites.count()
    site_count.short_description = 'Number of Sites'

@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'project', 'created_by', 'area_display', 'created_at')
    list_filter = ('created_at', 'project', 'created_by')
    search_fields = ('name', 'description', 'project__name', 'created_by__email')
    readonly_fields = ('area', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Site Information', {
            'fields': ('project', 'name', 'description', 'created_by')
        }),
        ('Geographic Data', {
            'fields': ('geometry', 'area'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def area_display(self, obj):
        return f"{(obj.area / 1000000):.2f} km²"
    area_display.short_description = 'Area'
