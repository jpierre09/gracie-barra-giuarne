import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponseForbidden, JsonResponse
from django.db.models import Sum
from django.utils import timezone
from .models import UserProfile, Pago, AlertaEmail

from .signals import sync_user_role

def index_view(request):
    if not request.user.is_authenticated:
        return redirect('login')
    
    profile = sync_user_role(request.user)
    if profile and profile.role == 'ADMIN':
        return redirect('admin_dashboard')
    return redirect('student_profile')

from django.contrib.auth import authenticate, login

def login_view(request):
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        username_input = request.POST.get('username', '').strip()
        password_input = request.POST.get('password', '').strip()

        # Try authenticating by username or email
        user = authenticate(request, username=username_input, password=password_input)
        if user is None and '@' in username_input:
            try:
                user_obj = User.objects.get(email__iexact=username_input)
                user = authenticate(request, username=user_obj.username, password=password_input)
            except User.DoesNotExist:
                user = None

        if user is not None:
            login(request, user)
            return redirect('index')
        else:
            return render(request, 'login.html', {'error': 'Usuario o contraseña incorrectos.'})

    return render(request, 'login.html')

@login_required
def admin_dashboard(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'ADMIN':
        return HttpResponseForbidden("Acceso Restringido: Esta vista requiere rol de Administrador (Profesor).")
    
    # Financial metrics
    total_revenue = Pago.objects.filter(estado='APROBADO').aggregate(Sum('monto'))['monto__sum'] or 0
    
    pending_students = UserProfile.objects.filter(role='STUDENT', estado_pago__in=['PENDIENTE', 'VENCIDO'])
    outstanding_balances = sum(s.monto_mensualidad for s in pending_students)
    
    total_students = UserProfile.objects.filter(role='STUDENT').count()
    active_students = UserProfile.objects.filter(role='STUDENT', activo=True).count()
    
    # Roster
    students = UserProfile.objects.filter(role='STUDENT').select_related('user').order_by('-fecha_registro')
    recent_payments = Pago.objects.select_related('estudiante__user').order_by('-creado_en')[:10]
    alerts_history = AlertaEmail.objects.select_related('estudiante__user').order_by('-fecha_envio')[:10]

    context = {
        'total_revenue': total_revenue,
        'outstanding_balances': outstanding_balances,
        'total_students': total_students,
        'active_students': active_students,
        'students': students,
        'recent_payments': recent_payments,
        'alerts_history': alerts_history,
    }
    return render(request, 'admin_dashboard.html', context)

@login_required
def student_profile(request):
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user, role='STUDENT')

    # Security check: If student tries to view another ID, deny!
    pagos = Pago.objects.filter(estudiante=profile).order_by('-fecha_pago')

    context = {
        'profile': profile,
        'pagos': pagos,
    }
    return render(request, 'student_profile.html', context)

@login_required
def report_payment(request):
    if request.method == 'POST':
        profile = request.user.profile
        monto = request.POST.get('monto', profile.monto_mensualidad)
        mes_anio = request.POST.get('mes_anio', 'Julio 2026')
        metodo = request.POST.get('metodo_pago', 'NEQUI')
        referencia = request.POST.get('referencia', '')
        comprobante_url = request.POST.get('comprobante_url', '')

        pago = Pago.objects.create(
            estudiante=profile,
            mes_anio=mes_anio,
            monto=monto,
            estado='PENDIENTE_VERIFICACION',
            fecha_pago=timezone.now().date(),
            metodo_pago=metodo,
            referencia=referencia,
            comprobante_url=comprobante_url,
        )

        profile.estado_pago = 'PENDIENTE'
        profile.save()

        return redirect('student_profile')
    return redirect('student_profile')

@login_required
def approve_payment(request, pago_id):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'ADMIN':
        return HttpResponseForbidden("Acceso denegado")
    
    pago = get_object_or_404(Pago, id=pago_id)
    accion = request.GET.get('accion', 'aprobar')
    
    if accion == 'aprobar':
        pago.estado = 'APROBADO'
        pago.save()
        pago.estudiante.estado_pago = 'PAGADO'
        pago.estudiante.save()
    elif accion == 'rechazar':
        pago.estado = 'RECHAZADO'
        pago.save()

    return redirect('admin_dashboard')

@login_required
def trigger_email_reminders(request):
    if not hasattr(request.user, 'profile') or request.user.profile.role != 'ADMIN':
        return HttpResponseForbidden("Acceso denegado")
    
    # Find students pending or overdue
    pending_students = UserProfile.objects.filter(role='STUDENT', estado_pago__in=['PENDIENTE', 'VENCIDO'])
    count = 0
    for student in pending_students:
        asunto = "Recordatorio de Pago - Gracie Barra Guarne"
        mensaje = f"Hola {student.user.first_name or student.user.username}, te recordamos que tu cuota mensual de Jiu-Jitsu (${student.monto_mensualidad:,.0f} COP) está próxima a vencer o pendiente. Por favor reporta tu comprobante en la PWA."
        AlertaEmail.objects.create(
            estudiante=student,
            asunto=asunto,
            mensaje=mensaje,
            exitoso=True
        )
        count += 1

    return redirect('admin_dashboard')
