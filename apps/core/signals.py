from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings
from allauth.account.signals import user_signed_up, user_logged_in
from .models import UserProfile, ConfiguracionAcademia

def sync_user_role(user):
    """
    Verifica y asigna el rol de Administrador (Profesor) o Estudiante en Django
    con base en la variable de entorno ADMIN_EMAIL.
    """
    if not user:
        return None

    admin_email = getattr(settings, 'ADMIN_EMAIL', 'profesor@graciebarra.com').strip().lower()
    user_email = (user.email or '').strip().lower()

    is_admin = bool(user_email and user_email == admin_email)
    target_role = 'ADMIN' if is_admin else 'STUDENT'

    tarifa_actual = ConfiguracionAcademia.get_tarifa_actual()

    profile, created = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': target_role,
            'cinturon': 'BLANCO',
            'monto_mensualidad': tarifa_actual,
            'dia_vencimiento': 5,
            'estado_pago': 'PENDIENTE'
        }
    )

    needs_save = False
    if profile.role != target_role:
        profile.role = target_role
        needs_save = True

    if is_admin and not user.is_staff:
        user.is_staff = True
        user.save(update_fields=['is_staff'])

    if needs_save:
        profile.save(update_fields=['role'])

    return profile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    sync_user_role(instance)

@receiver(user_signed_up)
def handle_user_signed_up(request, user, **kwargs):
    sync_user_role(user)

@receiver(user_logged_in)
def handle_user_logged_in(request, user, **kwargs):
    sync_user_role(user)
