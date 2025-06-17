import secrets
import logging
import random
import phonenumbers
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import authenticate
from .serializers import (
    RegisterSerializer, CustomUserSerializer, ProductSerializer, CategorySerializer,
    BrandSerializer, OrderSerializer, OTPSerializer, OTPVerifySerializer, AccountSetupSerializer,
    BodyMeasurementSerializer, ForgotPasswordOTPSerializer, ResetPasswordWithOTPSerializer, ChangePasswordSerializer
)
from .models import CustomUser, Product, Category, Brand, Order, OTPCode, PasswordResetToken
from .pagination import *

logger = logging.getLogger(__name__)

class SendOTPView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Sends an OTP to the provided email address. The OTP is valid for 10 minutes.",
        request_body=OTPSerializer,
        responses={
            200: openapi.Response("OTP sent successfully", schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, example="OTP sent successfully"),
                }
            )),
            400: "Invalid email or user already exists",
            429: "Too many requests"
        }
    )
    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Check if user already exists
            if CustomUser.objects.filter(email=email).exists():
                logger.warning(f"Attempt to send OTP to existing user: {email}")
                return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

            # Generate OTP and short_token (short_token is stored but not returned)
            otp_code = get_random_string(length=6, allowed_chars='0123456789')
            short_token = get_random_string(length=32)

            # Store OTP and short_token
            try:
                OTPCode.objects.create(
                    identifier=email,
                    code=otp_code,
                    short_token=short_token,
                    expires_at=timezone.now() + timezone.timedelta(minutes=10)
                )
            except Exception as e:
                logger.error(f"Error creating OTP for {email}: {str(e)}")
                return Response({"error": "Failed to create OTP."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Send OTP email
            subject = "Your OTP Code for Registration"
            message = f"Your OTP code is {otp_code}. It is valid for 10 minutes."
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                logger.info(f"OTP sent to {email}")
                return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Failed to send OTP email to {email}: {str(e)}")
                OTPCode.objects.filter(identifier=email).delete()
                return Response({"error": "Failed to send OTP email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.error(f"Send OTP failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Verify the OTP for the given email. If valid, returns a short_token to be used in /register/. The OTP remains valid until registration is completed or it expires.",
        request_body=OTPVerifySerializer,
        responses={
            200: openapi.Response("OTP verified successfully", schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, example="OTP verified successfully"),
                    'short_token': openapi.Schema(type=openapi.TYPE_STRING, example="temporary_session_token")
                }
            )),
            400: "Invalid OTP",
            404: "OTP not found or expired"
        }
    )
    
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']

            try:
                otp = OTPCode.objects.get(identifier=email, code=code)
                if not otp.is_valid():
                    otp.delete()
                    logger.warning(f"Expired OTP for {email}")
                    return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTPCode.DoesNotExist:
                logger.warning(f"Invalid OTP code for {email}")
                return Response({"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST)

            logger.info(f"OTP verified for {email}")
            return Response({
                "message": "OTP verified successfully",
                "short_token": otp.short_token
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Register a new user using the short_token (from /verify-otp/). The short_token and associated OTP will be deleted after successful registration.",
        request_body=RegisterSerializer,
        responses={
            201: openapi.Response(
                description="User created successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example="User created successfully"),
                        'access': openapi.Schema(type=openapi.TYPE_STRING, example="access_token"),
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, example="refresh_token")
                    }
                )
            ),
            400: openapi.Response(
                description="Validation error",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING, example="Invalid input data")
                    }
                )
            )
        }
    )
    def post(self, request):
        logger.info("Received registration data with short_token")
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            logger.info(f"User {user.id} registered successfully")
            return Response({
                "message": "User created successfully",
                "access": access_token,
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)

        logger.error(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Login using email and password",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='User email'),
                'password': openapi.Schema(type=openapi.TYPE_STRING, description='User password'),
            },
            required=['email', 'password'],
            example={
                'email': 'user@example.com',
                'password': 'your_password_here'
            }
        ),
        responses={
            200: openapi.Response("Login successful"),
            400: openapi.Response("Missing credentials"),
            401: openapi.Response("Invalid credentials"),
            404: openapi.Response("User not found")
        }
    )
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        logger.info(f"Login attempt with email: {email}")

        if not email or not password:
            return Response(
                {"error": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            logger.warning(f"User not found for email: {email}")
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        authenticated_user = authenticate(request, username=user.email, password=password)
        if authenticated_user and authenticated_user.is_active:
            refresh = RefreshToken.for_user(authenticated_user)
            logger.info(f"User {authenticated_user.id} logged in successfully")
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": authenticated_user.id,
                    "username": authenticated_user.username,
                    "email": authenticated_user.email,
                    "phone_number": authenticated_user.phone_number,
                    "is_setup_complete": authenticated_user.is_setup_complete
                }
            }, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Invalid password for user: {user.username}")
            return Response(
                {"error": "Invalid email or password"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Logout user by blacklisting the refresh token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token to blacklist'),
            },
            required=['refresh'],
            example={
                'refresh': 'your_refresh_token_here'
            }
        ),
        responses={
            200: openapi.Response("Logged out successfully"),
            400: openapi.Response("Invalid input"),
        }
    )
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                logger.warning("Logout attempt with no refresh token")
                return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            user_id = getattr(request.user, 'id', 'unknown') if hasattr(request, 'user') else 'unknown'
            logger.info(f"Refresh token blacklisted successfully for user ID {user_id}")
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Logout failed: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class BodyMeasurementView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Update or retrieve user's body measurements",
        request_body=BodyMeasurementSerializer,
        responses={
            200: openapi.Response("Body measurements updated successfully"),
            400: openapi.Response("Validation error")
        }
    )
    def put(self, request):
        user = request.user
        serializer = BodyMeasurementSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Body measurements updated for user ID {user.id}")
            return Response({
                "message": "Body measurements updated successfully",
                "measurements": {
                    "weight_kg": user.weight_kg,
                    "height_cm": user.height_cm,
                    "chest_bust": user.chest_bust,
                    "waist": user.waist,
                    "hip": user.hip,
                    "inseam": user.inseam,
                    "foot_size_us": user.foot_size_us
                }
            }, status=status.HTTP_200_OK)
        logger.error(f"Body measurement update failed for user ID {user.id}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_description="Retrieve user's body measurements",
        responses={
            200: openapi.Response("Body measurements retrieved successfully")
        }
    )
    def get(self, request):
        user = request.user
        return Response({
            "weight_kg": user.weight_kg,
            "height_cm": user.height_cm,
            "chest_bust": user.chest_bust,
            "waist": user.waist,
            "hip": user.hip,
            "inseam": user.inseam,
            "foot_size_us": user.foot_size_us
        }, status=status.HTTP_200_OK)

class UserView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Retrieve or update authenticated user's profile",
        responses={
            200: openapi.Response("User profile retrieved or updated successfully")
        }
    )
    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number,
            "country": user.country,
            "province": user.province,
            "city": user.city,
            "last_login": user.last_login,
            "is_setup_complete": user.is_setup_complete,
        }, status=status.HTTP_200_OK)
    
    @swagger_auto_schema(
        operation_description="Update authenticated user's shipping address",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'country': openapi.Schema(type=openapi.TYPE_STRING),
                'province': openapi.Schema(type=openapi.TYPE_STRING),
                'city': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            200: openapi.Response("Shipping address updated successfully")
        }
    )
    def put(self, request):
        user = request.user
        data = request.data
        user.country = data.get('country', user.country)
        user.province = data.get('province', user.province)
        user.city = data.get('city', user.city)
        user.save()
        logger.info(f"Shipping address updated for user ID {user.id}")
        return Response({"message": "Shipping address updated successfully."}, status=status.HTTP_200_OK)

class MyOrderHistoryView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(buyer=self.request.user).order_by('-created_at')

class PublicUserProfileView(RetrieveAPIView):
    permission_classes = [AllowAny]
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    lookup_field = "username"

    def get(self, request, username):
        try:
            user = self.get_queryset().get(username=username)
            serializer = self.get_serializer(user, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            logger.warning(f"User profile not found: {username}")
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PublicUserProductsView(ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        username = self.kwargs.get("username")
        return Product.objects.filter(seller__username=username)

    def list(self, request, *args, **kwargs):
        username = self.kwargs.get("username")
        queryset = self.get_queryset()

        if not queryset.exists():
            logger.info(f"No products found for user: {username}")
            return Response({"message": "No products found."}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [AllowAny]

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = ProductPagination

    def get_queryset(self):
        queryset = Product.objects.all()
        request = self.request

        keyword = request.query_params.get('keyword')
        price_range = request.query_params.get('price_range')
        sort_by = request.query_params.get('sort_by', 'date-desc')
        category = request.query_params.get('category')
        brand = request.query_params.get('brand')

        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(brand__title__icontains=keyword) |
                Q(category__title__icontains=keyword)
            )

        if price_range:
            try:
                min_price, max_price = map(float, price_range.split("_"))
                queryset = queryset.filter(
                    second_hand_price__gte=min_price,
                    second_hand_price__lte=max_price
                )
            except ValueError:
                logger.warning(f"Invalid price range format: {price_range}")
                pass

        if category and category.isdigit():
            queryset = queryset.filter(category__id=category)

        if brand and brand.isdigit():
            queryset = queryset.filter(brand__id=brand)

        sort_map = {
            "a_z": "title",
            "z_a": "-title",
            "low_to_high": "second_hand_price",
            "high_to_low": "-second_hand_price",
            "date-acs": "created_at",
            "date-desc": "-created_at",
        }
        queryset = queryset.order_by(sort_map.get(sort_by, "-created_at"))

        return queryset

    def get_serializer_context(self):
        return {"request": self.request}

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.seller != request.user:
            logger.warning(f"User {request.user.id} attempted to edit product {instance.id} they don't own.")
            return Response(
                {"error": "You are not allowed to edit this product."},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Product {instance.id} updated by user {request.user.id}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.seller != request.user:
            logger.warning(f"User {request.user.id} attempted to delete product {instance.id} they don't own.")
            return Response(
                {"error": "You are not allowed to delete this product."},
                status=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        logger.info(f"Product {instance.id} deleted by user {request.user.id}")
        return Response({"message": "Product deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter("sort_by", openapi.IN_QUERY, description="Sorting options", type=openapi.TYPE_STRING),
            openapi.Parameter("keyword", openapi.IN_QUERY, description="Search by product, brand, or category", type=openapi.TYPE_STRING),
            openapi.Parameter("price_range", openapi.IN_QUERY, description="Price range: min_max (e.g., 100_500)", type=openapi.TYPE_STRING),
            openapi.Parameter("category", openapi.IN_QUERY, description="Filter by category ID", type=openapi.TYPE_INTEGER),
            openapi.Parameter("brand", openapi.IN_QUERY, description="Filter by brand ID", type=openapi.TYPE_INTEGER),
            openapi.Parameter("limit", openapi.IN_QUERY, description="Results per page", type=openapi.TYPE_INTEGER),
            openapi.Parameter("page", openapi.IN_QUERY, description="Page number", type=openapi.TYPE_INTEGER),
        ]
    )
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context=self.get_serializer_context())
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True, context=self.get_serializer_context())
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context=self.get_serializer_context())
        return Response(serializer.data)

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'id'

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class MyProductsView(ListAPIView):
    serializer_class = ProductSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user).order_by('-created_at')

class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Place an order for one or more products",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'orders': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'product': openapi.Schema(type=openapi.TYPE_INTEGER, description='Product ID'),
                            'quantity': openapi.Schema(type=openapi.TYPE_INTEGER, description='Quantity', default=1),
                        }
                    )
                )
            },
            required=['orders'],
            example={
                'orders': [
                    {'product': 1, 'quantity': 2},
                    {'product': 2, 'quantity': 1}
                ]
            }
        ),
        responses={
            200: openapi.Response("Order(s) placed successfully"),
            400: openapi.Response("No orders provided"),
            404: openapi.Response("Product not found")
        }
    )
    def post(self, request):
        orders_data = request.data.get("orders", [])
        if not orders_data:
            return Response({"error": "No orders provided"}, status=status.HTTP_400_BAD_REQUEST)

        created_orders = []
        for item in orders_data:
            try:
                product = Product.objects.get(id=item.get("product"))
                order = Order.objects.create(
                    buyer=request.user,
                    product=product,
                    quantity=item.get("quantity", 1),
                    total_price=product.second_hand_price * item.get("quantity", 1),
                )
                created_orders.append(OrderSerializer(order).data)
            except Product.DoesNotExist:
                logger.warning(f"Product with ID {item.get('product')} not found for user {request.user.id}")
                return Response({"error": f"Product with ID {item.get('product')} not found"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"User {request.user.id} placed order(s): {created_orders}")
        return Response({"message": "Order(s) placed successfully", "orders": created_orders}, status=status.HTTP_200_OK)

class OrderPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Process payment for an order",
        responses={
            200: openapi.Response("Payment successful"),
            400: openapi.Response("Order already paid"),
            404: openapi.Response("Order not found")
        }
    )
    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id, buyer=request.user)
            if order.payment_status == 'Paid':
                logger.info(f"Order {order_id} already paid by user {request.user.id}")
                return Response({"message": "Order already paid."}, status=status.HTTP_400_BAD_REQUEST)
            order.payment_status = 'Paid'
            order.save()
            logger.info(f"Payment successful for order {order_id} by user {request.user.id}")
            return Response({"message": "Payment successful."}, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            logger.warning(f"Order {order_id} not found for user {request.user.id}")
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

class SellerOrderView(ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get_queryset(self):
        return Order.objects.filter(product__seller=self.request.user).order_by('-created_at')

class UpdateOrderStatusView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Update the status of an order (seller only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'status': openapi.Schema(type=openapi.TYPE_STRING, description='Order status (Pending, Shipped, Delivered)'),
            },
            required=['status'],
            example={'status': 'Shipped'}
        ),
        responses={
            200: openapi.Response("Order status updated successfully"),
            400: openapi.Response("Invalid status"),
            404: openapi.Response("Order not found or unauthorized")
        }
    )
    def put(self, request, order_id):
        status_value = request.data.get("status")
        if status_value not in ['Pending', 'Shipped', 'Delivered']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(id=order_id, product__seller=request.user)
            order.status = status_value
            order.save()
            logger.info(f"Order {order_id} status updated to {status_value} by seller {request.user.id}")
            return Response({"message": "Order status updated successfully."}, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            logger.warning(f"Order {order_id} not found or user {request.user.id} is not the seller")
            return Response({"error": "Order not found or you're not the seller."}, status=status.HTTP_404_NOT_FOUND)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Send a one-time password (OTP) to the user's email for password reset.",
        request_body=ForgotPasswordOTPSerializer,
        responses={
            200: openapi.Response("OTP sent successfully", schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, example="OTP sent successfully")
                }
            )),
            400: "Invalid email",
            404: "User not found",
            500: "Failed to send OTP"
        }
    )
    def post(self, request):
        serializer = ForgotPasswordOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = CustomUser.objects.get(email=email)
                otp_code = str(random.randint(100000, 999999))
                otp = OTPCode(
                    user=user,
                    code=otp_code,
                    identifier=email
                )
                otp.save()

                try:
                    send_mail(
                        "Your Password Reset OTP",
                        f"Your OTP code for password reset is {otp_code}. It is valid for 10 minutes.",
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                    logger.info(f"Password reset OTP sent to email: {email}")
                    return Response({"message": "OTP sent successfully"}, status=status.HTTP_200_OK)
                except Exception as e:
                    otp.delete()
                    logger.error(f"Failed to send OTP for {email}: {str(e)}")
                    return Response({"error": f"Failed to send OTP: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except CustomUser.DoesNotExist:
                logger.warning(f"Reset requested for non-existent email: {email}")
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordWithOTPView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Verify OTP and reset user's password.",
        request_body=ResetPasswordWithOTPSerializer,
        responses={
            200: openapi.Response("Password reset successfully", schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, example="Password reset successfully")
                }
            )),
            400: "Invalid OTP or data",
            404: "OTP not found or expired"
        }
    )
    def post(self, request):
        serializer = ResetPasswordWithOTPSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            new_password = serializer.validated_data['new_password']

            try:
                otp = OTPCode.objects.get(identifier=email, code=code)
                if not otp.is_valid():
                    otp.delete()
                    logger.warning(f"Expired OTP for {email}")
                    return Response({"error": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)
            except OTPCode.DoesNotExist:
                logger.warning(f"Invalid OTP code for {email}")
                return Response({"error": "Invalid OTP code"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = CustomUser.objects.get(email=email)
                user.set_password(new_password)
                user.save()
                otp.delete()
                logger.info(f"Password reset successfully for user with email: {email}")
                return Response({"message": "Password reset successfully"}, status=status.HTTP_200_OK)
            except CustomUser.DoesNotExist:
                logger.warning(f"User not found for email: {email}")
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AccountSetupView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Complete user account setup after first login",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='Email address'),
                'country': openapi.Schema(type=openapi.TYPE_STRING, description='Country'),
                'province': openapi.Schema(type=openapi.TYPE_STRING, description='Province'),
                'city': openapi.Schema(type=openapi.TYPE_STRING, description='City'),
                'postal_code': openapi.Schema(type=openapi.TYPE_STRING, description='Postal code'),
                'full_address': openapi.Schema(type=openapi.TYPE_STRING, description='Full address', nullable=True),
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description='Phone number', nullable=True),
            },
            required=['username', 'email', 'country', 'province', 'city', 'postal_code']
        ),
        responses={
            200: openapi.Response(
                description="Account setup completed successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example="Account setup completed successfully"),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'username': openapi.Schema(type=openapi.TYPE_STRING),
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                                'is_setup_complete': openapi.Schema(type=openapi.TYPE_BOOLEAN)
                            }
                        )
                    }
                )
            ),
            400: openapi.Response(
                description="Validation error",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING, example="Invalid input data")
                    }
                )
            )
        }
    )
    
    def put(self, request):
        user = request.user
        serializer = AccountSetupSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            user.is_setup_complete = True
            user.save()
            logger.info(f"Account setup completed for user ID {user.id}")
            return Response({
                "message": "Account setup completed successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "is_setup_complete": user.is_setup_complete
                }
            }, status=status.HTTP_200_OK)
        logger.error(f"Account setup failed for user ID {user.id}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompleteAccountSetupView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Complete user account setup for mobile app in a single request",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
                'email': openapi.Schema(type=openapi.TYPE_STRING, format='email', description='Email address'),
                'country': openapi.Schema(type=openapi.TYPE_STRING, description='Country'),
                'province': openapi.Schema(type=openapi.TYPE_STRING, description='Province'),
                'city': openapi.Schema(type=openapi.TYPE_STRING, description='City'),
                'postal_code': openapi.Schema(type=openapi.TYPE_STRING, description='Postal code'),
                'full_address': openapi.Schema(type=openapi.TYPE_STRING, description='Full address', nullable=True),
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, description='Phone number', nullable=True),
            },
            required=['username', 'email', 'country', 'province', 'city', 'postal_code']
        ),
        responses={
            200: openapi.Response(
                description="Account setup completed successfully",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING, example="Account setup completed successfully"),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'username': openapi.Schema(type=openapi.TYPE_STRING),
                                'email': openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, nullable=True),
                                'is_setup_complete': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                            }
                        )
                    }
                )
            ),
            400: openapi.Response(
                description="Validation error or setup already completed",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING, example="Account setup is already completed")
                    }
                )
            ),
            401: openapi.Response(
                description="Unauthorized",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'error': openapi.Schema(type=openapi.TYPE_STRING, example="Invalid or missing authentication token")
                    }
                )
            )
        }
    )
    def post(self, request):
        user = request.user

        if user.is_setup_complete:
            logger.info(f"User ID {user.id} attempted to complete setup again")
            return Response(
                {"error": "Account setup is already completed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = AccountSetupSerializer(user, data=request.data, partial=False)
        if serializer.is_valid():
            serializer.save()
            user.is_setup_complete = True
            user.save()
            logger.info(f"Mobile account setup completed for user ID {user.id}")
            return Response({
                "message": "Account setup completed successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone_number": user.phone_number,
                    "is_setup_complete": user.is_setup_complete
                }
            }, status=status.HTTP_200_OK)
        logger.error(f"Mobile account setup failed for user ID {user.id}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Delete the authenticated user's account and blacklist their refresh token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token to blacklist'),
            },
            required=['refresh'],
            example={
                'refresh': 'your_refresh_token_here'
            }
        ),
        responses={
            200: openapi.Response("Account deleted successfully"),
            400: openapi.Response("Invalid input"),
            401: openapi.Response("Unauthorized")
        }
    )
    def delete(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                logger.warning(f"Delete account attempt by user ID {request.user.id} with no refresh token")
                return Response({"error": "Refresh token required"}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()

            user_id = request.user.id
            request.user.delete()
            logger.info(f"User {user_id} deleted their account successfully")
            
            return Response({"message": "Account deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Account deletion failed for user ID {request.user.id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    @swagger_auto_schema(
        operation_description="Change the authenticated user's password",
        request_body=ChangePasswordSerializer,
        responses={
            200: openapi.Response("Password changed successfully", schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, example="Password changed successfully")
                }
            )),
            400: openapi.Response("Invalid input data"),
            401: openapi.Response("Unauthorized")
        }
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()

            try:
                refresh_token = serializer.validated_data['refresh_token']
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"User {user.id} changed password and was logged out")
            except Exception as e:
                logger.warning(f"Failed to blacklist refresh token for user {user.id}: {str(e)}")

            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)
        logger.error(f"Password change failed for user {request.user.id}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)