# Generated migration for adding archived fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='is_archived',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='conversation',
            name='archived_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
