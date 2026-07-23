import os
import logging
from django.apps import AppConfig
from django.db.models.signals import post_migrate

logger = logging.getLogger(__name__)

def seed_admin_user(sender, **kwargs):
    """
    Pre-populate / Data Seeding automático de usuario Administrador (Superuser).
    Lee la variable ADMIN_EMAIL, ADMIN_USERNAME y ADMIN_PASSWORD de las .env o settings.
    Garantiza que exista el usuario admin en la base de datos con rol 'ADMIN' e is_superuser=True.
    """
    try:
        from django.conf import settings
        from django.contrib.auth.models import User
        from apps.core.models import UserProfile

        admin_email = getattr(settings, 'ADMIN_EMAIL', os.getenv('ADMIN_EMAIL', 'profesor@graciebarra.com')).strip().lower()
        admin_username = os.getenv('ADMIN_USERNAME', 'admin').strip()
        admin_password = os.getenv('ADMIN_PASSWORD', 'GracieBarra2026!').strip()

        # Buscar usuario por username o email
        user = User.objects.filter(username=admin_username).first()
        if not user and admin_email:
            user = User.objects.filter(email__iexact=admin_email).first()

        if not user:
            user = User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password,
                first_name='Profesor',
                last_name='Administrador'
            )
            logger.info(f"[SEEDING] Usuario administrador '{admin_username}' ({admin_email}) creado exitosamente.")
        else:
            updated = False
            if user.email != admin_email and admin_email:
                user.email = admin_email
                updated = True
            if not user.is_staff or not user.is_superuser:
                user.is_staff = True
                user.is_superuser = True
                updated = True
            if not user.check_password(admin_password):
                user.set_password(admin_password)
                updated = True
            if updated:
                user.save()
                logger.info(f"[SEEDING] Usuario administrador '{admin_username}' actualizado con credenciales .env.")

        # Asegurar UserProfile con rol 'ADMIN'
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'role': 'ADMIN',
                'cinturon': 'NEGRO',
                'monto_mensualidad': 0.00,
                'dia_vencimiento': 5,
                'estado_pago': 'PAGADO',
                'activo': True
            }
        )
        if profile.role != 'ADMIN':
            profile.role = 'ADMIN'
            profile.save(update_fields=['role'])

    except Exception as e:
        logger.warning(f"[SEEDING] Omisión temporal de data seeding (esperando migraciones): {e}")


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'

    def ready(self):
        import apps.core.signals
        post_migrate.connect(seed_admin_user, sender=self)

        # Intentar data seeding directo en arranque si la tabla auth_user ya está presente
        try:
            from django.db import connection
            if 'auth_user' in connection.introspection.table_names():
                seed_admin_user(self)
        except Exception:
            pass

