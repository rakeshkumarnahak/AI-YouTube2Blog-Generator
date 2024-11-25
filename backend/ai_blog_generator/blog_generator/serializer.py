from rest_framework import serializers
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from .models import BlogPost

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'email']

class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = ['id', 'user', 'youtube_link', 'youtube_title', 'youtube_description', 'generated_content', 'created_at']