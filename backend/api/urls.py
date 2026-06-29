# api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('filter/<str:algorithm>/', views.apply_filter_view, name='apply_filter'),
    path('average/', views.average_images_view, name='average_images'),
]