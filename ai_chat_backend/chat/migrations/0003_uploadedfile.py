# Generated migration for UploadedFile model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_conversation_archived'),
    ]

    operations = [
        migrations.CreateModel(
            name='UploadedFile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('file', models.FileField(upload_to='chat_uploads/')),
                ('file_name', models.CharField(max_length=255)),
                ('file_type', models.CharField(max_length=50)),
                ('file_size', models.IntegerField()),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('conversation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='uploaded_files', to='chat.conversation')),
            ],
            options={
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
