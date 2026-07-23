from django.urls import path, re_path
from . import views

urlpatterns = [
    # REST API Endpoints
    path('api/config/', views.api_config, name='api_config'),
    path('api/config/update-fee/', views.api_update_fee, name='api_update_fee'),
    path('api/me/', views.api_me, name='api_me'),
    path('api/students/', views.api_students, name='api_students'),
    path('api/students/<int:student_id>/update-fee/', views.api_update_student_fee, name='api_update_student_fee'),
    path('api/payments/', views.api_payments, name='api_payments'),
    path('api/payments/<int:pago_id>/approve/', views.api_approve_payment, name='api_approve_payment'),
    path('api/send-reminders/', views.api_send_reminders, name='api_send_reminders'),
    path('api/alerts/', views.api_alerts, name='api_alerts'),

    # SPA Catch-All Route (serves React dist/index.html)
    re_path(r'^.*$', views.spa_index_view, name='spa_index'),
]
