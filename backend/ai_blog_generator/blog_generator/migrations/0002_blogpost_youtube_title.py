# Generated by Django 5.1.3 on 2024-11-24 13:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog_generator', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='blogpost',
            name='youtube_title',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
    ]