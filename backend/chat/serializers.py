from rest_framework import serializers

class StrictTextField(serializers.CharField):
    def to_internal_value(self, value):
        # Reject numeric JSON values too: DRF otherwise coerces them to strings.
        if not isinstance(value, str):
            raise serializers.ValidationError('Content must be a string.')
        if len(value) > 4000:
            raise serializers.ValidationError('Content must have at most 4000 characters.')
        return super().to_internal_value(value)

class MessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = StrictTextField(max_length=4000, allow_blank=False, trim_whitespace=True)

class ChatSerializer(serializers.Serializer):
    messages = MessageSerializer(many=True, allow_empty=False, max_length=20)
