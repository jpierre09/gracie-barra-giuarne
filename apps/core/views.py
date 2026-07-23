import json
import os
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from django.http import HttpResponse, FileResponse, JsonResponse
from django.db.models import Sum
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import UserProfile, Pago, AlertaEmail, ConfiguracionAcademia
from .signals import sync_user_role


def spa_index_view(request, *args, **kwargs):
    """
    Serves the compiled React Single Page Application (dist/index.html).
    All frontend routing is handled by React client-side.
    """
    index_path = os.path.join(settings.BASE_DIR, 'dist', 'index.html')
    if os.path.exists(index_path):
        return FileResponse(open(index_path, 'rb'), content_type='text/html')
    return HttpResponse(
        "<h1>Gracie Barra Guarne</h1><p>Compilando React SPA... Por favor actualice la página en unos segundos.</p>",
        status=503
    )


def api_config(request):
    """
    GET /api/config/
    Returns the current global monthly fee dynamically read from PostgreSQL DB.
    """
    tarifa_actual = float(ConfiguracionAcademia.get_tarifa_actual())
    return JsonResponse({
        'status': 'ok',
        'tarifa_mensual_base': tarifa_actual,
        'currency': 'COP'
    })


@csrf_exempt
def api_update_fee(request):
    """
    POST /api/config/update-fee/
    Updates global fee in PostgreSQL DB and updates all student profiles dynamically.
    """
    if request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8')) if request.body else {}
            monto = float(body.get('monto') or request.POST.get('monto', 0))
        except (ValueError, TypeError, json.JSONDecodeError):
            monto = 0.0

        config, _ = ConfiguracionAcademia.objects.get_or_create(id=1)
        config.tarifa_mensual_base = monto
        config.save()

        # Dynamic mass-update of all student fee records in PostgreSQL
        UserProfile.objects.filter(role='STUDENT').update(monto_mensualidad=monto)

        return JsonResponse({
            'success': True,
            'message': f'Tarifa general actualizada a ${monto:,.0f} COP en PostgreSQL',
            'tarifa_mensual_base': monto
        })

    return JsonResponse({'error': 'Método no permitido'}, status=405)


def api_me(request):
    """
    GET /api/me/
    Returns authenticated user profile or session profile synced with PostgreSQL DB.
    """
    tarifa_actual = float(ConfiguracionAcademia.get_tarifa_actual())

    if request.user.is_authenticated:
        profile = sync_user_role(request.user)
        # Ensure student fee matches global fee dynamically if student
        if profile.role == 'STUDENT':
            monto_efectivo = float(profile.monto_mensualidad or tarifa_actual)
        else:
            monto_efectivo = 0.0

        user_data = {
            'id': str(profile.id),
            'name': request.user.get_full_name() or request.user.username,
            'email': request.user.email or f"{request.user.username}@graciebarra.com",
            'role': profile.role,
            'cinturon': profile.cinturon,
            'telefono': profile.telefono or '+57 300 000 0000',
            'montoMensualidad': monto_efectivo,
            'diaVencimiento': profile.dia_vencimiento,
            'estadoPago': profile.estado_pago,
            'activo': profile.activo,
            'fechaRegistro': profile.fecha_registro.strftime('%Y-%m-%d')
        }
        return JsonResponse({'authenticated': True, 'user': user_data, 'globalFee': tarifa_actual})

    return JsonResponse({
        'authenticated': False,
        'user': None,
        'globalFee': tarifa_actual
    })


def api_students(request):
    """
    GET /api/students/ - List all students
    POST /api/students/ - Register new student using dynamic fee from PostgreSQL DB
    """
    tarifa_actual = float(ConfiguracionAcademia.get_tarifa_actual())

    if request.method == 'GET':
        students = UserProfile.objects.filter(role='STUDENT').select_related('user').order_by('-fecha_registro')
        data = []
        for s in students:
            data.append({
                'id': str(s.id),
                'name': s.user.get_full_name() or s.user.username,
                'email': s.user.email or f"{s.user.username}@graciebarra.com",
                'role': s.role,
                'cinturon': s.cinturon,
                'telefono': s.telefono or '+57 300 000 0000',
                'montoMensualidad': float(s.monto_mensualidad or tarifa_actual),
                'diaVencimiento': s.dia_vencimiento,
                'estadoPago': s.estado_pago,
                'activo': s.activo,
                'fechaRegistro': s.fecha_registro.strftime('%Y-%m-%d')
            })
        return JsonResponse({'students': data, 'globalFee': tarifa_actual})

    elif request.method == 'POST':
        try:
            body = json.loads(request.body.decode('utf-8')) if request.body else {}
        except json.JSONDecodeError:
            body = request.POST

        nombre = body.get('name') or body.get('nombre', 'Nuevo Alumno')
        email = (body.get('email') or 'alumno@graciebarra.com').strip().lower()
        telefono = body.get('telefono', '+57 300 000 0000')
        cinturon = body.get('cinturon', 'BLANCO')
        dia_vencimiento = int(body.get('diaVencimiento') or body.get('dia_vencimiento', 5))

        username = email.split('@')[0]
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'username': username, 'first_name': nombre}
        )
        if not created and nombre:
            user.first_name = nombre
            user.save()

        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'STUDENT',
                'cinturon': cinturon,
                'telefono': telefono,
                'monto_mensualidad': tarifa_actual,
                'dia_vencimiento': dia_vencimiento,
                'estado_pago': 'PENDIENTE',
                'activo': True
            }
        )

        return JsonResponse({
            'success': True,
            'student': {
                'id': str(profile.id),
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'role': 'STUDENT',
                'cinturon': profile.cinturon,
                'montoMensualidad': float(profile.monto_mensualidad),
                'estadoPago': profile.estado_pago
            }
        })

    return JsonResponse({'error': 'Método no soportado'}, status=405)


@csrf_exempt
def api_payments(request):
    """
    GET /api/payments/ - List all payments
    POST /api/payments/ - Create payment report with image receipt upload support
    """
    if request.method == 'GET':
        pagos = Pago.objects.select_related('estudiante__user').order_by('-creado_en')
        data = []
        for p in pagos:
            data.append({
                'id': str(p.id),
                'studentId': str(p.estudiante.id),
                'studentName': p.estudiante.user.get_full_name() or p.estudiante.user.username,
                'mesAnio': p.mes_anio,
                'monto': float(p.monto),
                'estado': p.estado,
                'fechaPago': p.fecha_pago.strftime('%Y-%m-%d'),
                'metodoPago': p.metodo_pago,
                'referencia': p.referencia,
                'comprobanteUrl': p.comprobante_url or (p.comprobante_imagen.url if p.comprobante_imagen else ''),
                'notas': p.notas or ''
            })
        return JsonResponse({'payments': data})

    elif request.method == 'POST':
        try:
            if request.content_type and 'application/json' in request.content_type:
                body = json.loads(request.body.decode('utf-8'))
            else:
                body = request.POST
        except json.JSONDecodeError:
            body = request.POST

        student_id = body.get('studentId')
        if student_id:
            profile = get_object_or_404(UserProfile, id=student_id)
        elif request.user.is_authenticated and hasattr(request.user, 'profile'):
            profile = request.user.profile
        else:
            profile = UserProfile.objects.filter(role='STUDENT').first()

        if not profile:
            return JsonResponse({'error': 'Estudiante no encontrado'}, status=404)

        monto = float(body.get('monto') or profile.monto_mensualidad)
        mes_anio = body.get('mesAnio') or body.get('mes_anio', 'Julio 2026')
        metodo = body.get('metodoPago') or body.get('metodo_pago', 'NEQUI')
        referencia = body.get('referencia', f'COMP-{timezone.now().strftime("%H%M%S")}')
        comprobante_url = body.get('comprobanteUrl', '')

        comprobante_file = request.FILES.get('comprobante_file')

        pago = Pago.objects.create(
            estudiante=profile,
            mes_anio=mes_anio,
            monto=monto,
            estado='PENDIENTE_VERIFICACION',
            fecha_pago=timezone.now().date(),
            metodo_pago=metodo,
            referencia=referencia,
            comprobante_url=comprobante_url,
            comprobante_imagen=comprobante_file
        )

        profile.estado_pago = 'PENDIENTE'
        profile.save()

        return JsonResponse({
            'success': True,
            'payment': {
                'id': str(pago.id),
                'studentId': str(profile.id),
                'studentName': profile.user.get_full_name() or profile.user.username,
                'mesAnio': pago.mes_anio,
                'monto': float(pago.monto),
                'estado': pago.estado,
                'referencia': pago.referencia,
                'comprobanteUrl': pago.comprobante_url or (pago.comprobante_imagen.url if pago.comprobante_imagen else '')
            }
        })

    return JsonResponse({'error': 'Método no soportado'}, status=405)


@csrf_exempt
def api_approve_payment(request, pago_id):
    """
    POST /api/payments/<id>/approve/
    Approve or reject a payment record.
    """
    pago = get_object_or_404(Pago, id=pago_id)
    try:
        body = json.loads(request.body.decode('utf-8')) if request.body else {}
        accion = body.get('accion') or request.POST.get('accion', 'aprobar')
    except json.JSONDecodeError:
        accion = request.POST.get('accion', 'aprobar')

    if accion == 'aprobar':
        pago.estado = 'APROBADO'
        pago.save()
        pago.estudiante.estado_pago = 'PAGADO'
        pago.estudiante.save()
    elif accion == 'rechazar':
        pago.estado = 'RECHAZADO'
        pago.save()

    return JsonResponse({'success': True, 'estado': pago.estado, 'studentEstadoPago': pago.estudiante.estado_pago})


@csrf_exempt
def api_send_reminders(request):
    """
    POST /api/send-reminders/
    Triggers automated payment reminder logs/emails.
    """
    pending = UserProfile.objects.filter(role='STUDENT', estado_pago__in=['PENDIENTE', 'VENCIDO'])
    count = 0
    for student in pending:
        asunto = "Recordatorio de Pago - Gracie Barra Guarne"
        mensaje = f"Hola {student.user.first_name or student.user.username}, te recordamos que tu cuota mensual de Jiu-Jitsu (${student.monto_mensualidad:,.0f} COP) está pendiente."
        AlertaEmail.objects.create(
            estudiante=student,
            asunto=asunto,
            mensaje=mensaje,
            exitoso=True
        )
        count += 1

    return JsonResponse({'success': True, 'count': count, 'message': f'Recordatorios enviados a {count} estudiantes.'})
