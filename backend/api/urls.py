from django.urls import path
from . import views

urlpatterns = [
    # This route captures the filter name (e.g., 'sobel', 'highboost') as 'filter_name'
    path('filter/<str:filter_name>/', views.apply_filter_view, name='apply_filter'),
    # Add this if you have a separate URL for averaging multiple images
    path('average/', views.average_images_view, name='average_images'),
]