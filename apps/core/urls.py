from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('login/', views.login_view, name='login'),
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('perfil/', views.student_profile, name='student_profile'),
    path('reportar-pago/', views.report_payment, name='report_payment'),
    path('aprobar-pago/<int:pago_id>/', views.approve_payment, name='approve_payment'),
    path('enviar-alertas/', views.trigger_email_reminders, name='trigger_email_reminders'),
]
