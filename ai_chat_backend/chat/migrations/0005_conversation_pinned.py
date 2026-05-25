# Generated migration for pinned conversations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0004_message_edited_at_message_original_content'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='is_pinned',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='conversation',
            name='pinned_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
