from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify

def custom_comprobante_upload_to(instance, filename):
    """
    Guarda los comprobantes organizados dinámicamente por subcarpetas:
    comprobantes/{año}/{mes}/{nombre_estudiante}/{filename_limpio}
    """
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    name_without_ext = filename.rsplit('.', 1)[0]
    clean_filename = slugify(name_without_ext) or "comprobante"
    final_filename = f"{clean_filename}.{ext.lower()}"
    
    fecha = instance.fecha_pago if instance.fecha_pago else instance.creado_en
    año = str(fecha.year) if hasattr(fecha, 'year') and fecha.year else "2026"
    mes = str(fecha.month).zfill(2) if hasattr(fecha, 'month') and fecha.month else "01"
    
    estudiante_name = "estudiante"
    if instance.estudiante and instance.estudiante.user:
        full_name = instance.estudiante.user.get_full_name() or instance.estudiante.user.username
        estudiante_name = slugify(full_name) or "estudiante"
        
    return f"comprobantes/{año}/{mes}/{estudiante_name}/{final_filename}"


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('ADMIN', 'Profesor / Administrador'),
        ('STUDENT', 'Estudiante'),
    )
    
    CINTURON_CHOICES = (
        ('BLANCO', 'Cinturón Blanco'),
        ('AZUL', 'Cinturón Azul'),
        ('MORADO', 'Cinturón Morado'),
        ('MARRON', 'Cinturón Marrón'),
        ('NEGRO', 'Cinturón Negro'),
    )

    ESTADO_PAGO_CHOICES = (
        ('PAGADO', 'Pagado'),
        ('PENDIENTE', 'Pendiente'),
        ('VENCIDO', 'Vencido'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    cinturon = models.CharField(max_length=10, choices=CINTURON_CHOICES, default='BLANCO')
    telefono = models.CharField(max_length=20, blank=True, null=True)
    monto_mensualidad = models.DecimalField(max_digits=10, decimal_places=2, default=120000.00)
    dia_vencimiento = models.IntegerField(default=5)  # Día del mes
    estado_pago = models.CharField(max_length=10, choices=ESTADO_PAGO_CHOICES, default='PENDIENTE')
    activo = models.BooleanField(default=True)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_role_display()})"


class Pago(models.Model):
    ESTADO_CHOICES = (
        ('APROBADO', 'Aprobado'),
        ('PENDIENTE_VERIFICACION', 'Pendiente de Verificación'),
        ('RECHAZADO', 'Rechazado'),
    )

    METODO_CHOICES = (
        ('NEQUI', 'Nequi'),
        ('BANCOLOMBIA', 'Bancolombia'),
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia Bancaria'),
    )

    estudiante = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='pagos')
    mes_anio = models.CharField(max_length=20)  # Ej. "Julio 2026"
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=25, choices=ESTADO_CHOICES, default='PENDIENTE_VERIFICACION')
    fecha_pago = models.DateField()
    metodo_pago = models.CharField(max_length=20, choices=METODO_CHOICES, default='NEQUI')
    referencia = models.CharField(max_length=100, blank=True, null=True)
    comprobante = models.ImageField(upload_to=custom_comprobante_upload_to, blank=True, null=True)
    comprobante_url = models.TextField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pago {self.mes_anio} - {self.estudiante.user.get_full_name()} (${self.monto})"


class AlertaEmail(models.Model):
    estudiante = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='alertas')
    tipo_alerta = models.CharField(max_length=50, default='RECORDATORIO_VENCIMIENTO')
    asunto = models.CharField(max_length=200)
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    exitoso = models.BooleanField(default=True)

    def __str__(self):
        return f"Alerta para {self.estudiante.user.email} - {self.fecha_envio.strftime('%Y-%m-%d %H:%M')}"


class ConfiguracionAcademia(models.Model):
    tarifa_mensual_base = models.DecimalField(max_digits=10, decimal_places=2, default=120000.00)
    actualizado_en = models.DateTimeField(auto_now=True)

    @classmethod
    def get_tarifa_actual(cls):
        config, _ = cls.objects.get_or_create(id=1, defaults={'tarifa_mensual_base': 120000.00})
        return config.tarifa_mensual_base

    def __str__(self):
        return f"Configuración Academia - Tarifa Base: ${self.tarifa_mensual_base}"
