from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # path("", views.index, name='index'),
    path("login", views.login, name='login'),
    path("signup", views.signup, name='signup'),
    path("generate-blog", views.generate_blog, name='generate-blog'),
    path("blog-list", views.blog_list, name='blog-list'),
    path("blog-detail/<int:pk>", views.blog_detail, name='blog-detail'),
]
