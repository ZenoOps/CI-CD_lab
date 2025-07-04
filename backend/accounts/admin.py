from django.contrib import admin
from .models import CustomUser, Category, Brand, Product, Order, Message, Review, OTPCode

# admin.site.register(CustomUser)
admin.site.register(Category)
admin.site.register(Brand)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(Message)
admin.site.register(Review)
admin.site.register(OTPCode)

admin.site.site_header = 'ladyfirst.me'
admin.site.site_title = 'ladyfirst.me'
admin.site.site_url = 'ladyfirst.me'

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import AdminPasswordChangeForm
# from .models import CustomUser

class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    change_password_form = AdminPasswordChangeForm
    list_display = ( 'username', 'email', 'phone_number', 'country', 'city', 'province', 'postal_code', 'waist', 'height_cm', 'chest_bust', 'waist', 'hip', 'inseam', 'foot_size_us')
    list_filter = ('is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email',)
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)

admin.site.register(CustomUser, CustomUserAdmin)
