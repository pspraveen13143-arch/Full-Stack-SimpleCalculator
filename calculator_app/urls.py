from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('save-calculation/', views.save_calculation, name='save_calculation'),
    path('history/', views.calculation_history, name='calculation_history'),
    path('clear-history/',views.clear_history,name='clear_history'),
]