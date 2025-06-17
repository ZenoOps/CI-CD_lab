from rest_framework import serializers
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
import re
import random
from .models import CustomUser, OTPCode, Product, Order, Category, Brand
from django.contrib.auth.password_validation import validate_password
import phonenumbers

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'profile_picture', 'phone_number', 'country',
            'province', 'city', 'last_login', 'weight_kg', 'height_cm', 'chest_bust',
            'waist', 'hip', 'inseam', 'foot_size_us', 'postal_code', 'full_address'
        ]

class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate(self, data):
        email = data['email'].lower().strip()
        data['email'] = email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise serializers.ValidationError("Invalid email format.")
        return data

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)

    def validate(self, data):
        email = data['email'].lower().strip()
        data['email'] = email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise serializers.ValidationError("Invalid email format.")

        try:
            otp = OTPCode.objects.get(identifier=email, code=data['code'])
            if not otp.is_valid():
                otp.delete()
                raise serializers.ValidationError("OTP has expired.")
        except OTPCode.DoesNotExist:
            raise serializers.ValidationError("Invalid OTP code.")

        return data

class ForgotPasswordOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate(self, data):
        email = data['email'].lower().strip()
        data['email'] = email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise serializers.ValidationError("Invalid email format.")
        if not CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("No account found with this email.")
        return data

class ResetPasswordWithOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords must match.")
        
        try:
            validate_password(data['new_password'])
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"new_password": str(e)})

        email = data['email'].lower().strip()
        data['email'] = email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise serializers.ValidationError("Invalid email format.")
        if not CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("No account found with this email.")

        return data

class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)
    short_token = serializers.CharField(max_length=100, required=True)

    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'confirm_password', 'profile_picture',
            'country', 'province', 'city', 'postal_code', 'full_address', 'phone_number',
            'short_token'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords must match.")

        try:
            validate_password(data['password'])
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": str(e)})

        if len(data['username']) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")

        if CustomUser.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError("This username is already taken.")

        email = data['email'].lower().strip()
        data['email'] = email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise serializers.ValidationError("Invalid email format.")
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("This email is already in use.")

        try:
            otp = OTPCode.objects.get(identifier=email, short_token=data['short_token'])
            if not otp.is_valid():
                otp.delete()
                raise serializers.ValidationError("Short token has expired.")
        except OTPCode.DoesNotExist:
            raise serializers.ValidationError("Invalid short_token.")

        if 'phone_number' in data and data['phone_number']:
            try:
                parsed_number = phonenumbers.parse(data['phone_number'], None)
                if not phonenumbers.is_valid_number(parsed_number):
                    raise serializers.ValidationError("Invalid phone number format.")
                data['phone_number'] = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
            except phonenumbers.NumberParseException:
                raise serializers.ValidationError("Invalid phone number format.")

        if 'full_address' in data and data['full_address'] == '':
            data['full_address'] = None

        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        short_token = validated_data.pop('short_token')
        try:
            user = CustomUser.objects.create(**validated_data)
            user.set_password(validated_data['password'])
            user.save()
            OTPCode.objects.filter(identifier=validated_data['email'], short_token=short_token).delete()
            return user
        except Exception as e:
            if 'email' in str(e).lower():
                raise serializers.ValidationError({"email": "This email is already in use."})
            else:
                raise serializers.ValidationError(f"An error occurred while creating the user: {str(e)}")

class AccountSetupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'country', 'province', 'city',
            'postal_code', 'full_address', 'phone_number'
        ]

    def validate(self, data):
        if not data.get('username'):
            raise serializers.ValidationError("Username is required.")
        if CustomUser.objects.filter(username=data['username']).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("This username is already taken.")

        if not data.get('country'):
            raise serializers.ValidationError("Country is required.")
        if not data.get('province'):
            raise serializers.ValidationError("Province is required.")
        if not data.get('city'):
            raise serializers.ValidationError("City is required.")
        if not data.get('postal_code'):
            raise serializers.ValidationError("Postal code is required.")

        email = data.get('email')
        if not email:
            raise serializers.ValidationError("Email is required.")
        email = email.lower().strip()
        data['email'] = email
        if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            raise serializers.ValidationError("Invalid email format.")
        if CustomUser.objects.filter(email=email).exclude(id=self.instance.id).exists():
            raise serializers.ValidationError("This email is already in use.")

        if 'full_address' in data and data['full_address'] == '':
            data['full_address'] = None

        if 'phone_number' in data and data['phone_number']:
            try:
                parsed_number = phonenumbers.parse(data['phone_number'], None)
                if not phonenumbers.is_valid_number(parsed_number):
                    raise serializers.ValidationError("Invalid phone number format.")
                data['phone_number'] = phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
            except phonenumbers.NumberParseException:
                raise serializers.ValidationError("Invalid phone number format.")

        return data

class BodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            'weight_kg', 'height_cm', 'chest_bust', 'waist', 'hip', 'inseam', 'foot_size_us'
        ]

    def validate(self, data):
        float_fields = ['weight_kg', 'height_cm', 'chest_bust', 'waist', 'hip', 'inseam', 'foot_size_us']
        for field in float_fields:
            if field in data and data[field] == '':
                data[field] = None
            elif field in data and data[field] is not None:
                try:
                    value = float(data[field])
                    if value < 0:
                        raise serializers.ValidationError(f"{field} must be a positive number.")
                    data[field] = value
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"{field} must be a valid number.")

        return data

class ProductSerializer(serializers.ModelSerializer):
    seller = CustomUserSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.title", read_only=True)
    brand_name = serializers.CharField(source="brand.title", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "seller",
            "image_url",
            "title",
            "product_slug",
            "description",
            "original_price",
            "second_hand_price",
            "size",
            "condition",
            "color",
            "authenticity_document",
            "image",
            "created_at",
            "category",
            "category_name",
            "brand",
            "brand_name",
        ]

    def get_image_url(self, obj):
        request = self.context.get('request')
        return None if not (obj.image and request) else request.build_absolute_uri(obj.image.url)

class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    buyer = CustomUserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'product',
            'buyer',
            'quantity',
            'total_price',
            'status',
            'payment_status',
            'created_at',
        ]

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True)
    confirm_new_password = serializers.CharField(write_only=True, required=True)
    refresh_token = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_new_password']:
            raise serializers.ValidationError("New passwords must match.")

        try:
            validate_password(data['new_password'])
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"new_password": str(e)})

        user = self.context['request'].user
        if not user.check_password(data['old_password']):
            raise serializers.ValidationError({"old_password": "Incorrect old password."})

        return data