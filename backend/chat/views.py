"""Validate before opening the stream; after headers, report errors as SSE events."""
import json
import os
from django.http import StreamingHttpResponse
from groq import Groq, RateLimitError, AuthenticationError, NotFoundError, APIConnectionError
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import ChatSerializer

SYSTEM_PROMPT = 'You are a helpful, friendly AI assistant. Format code in markdown code blocks.'

def event(payload):
    # JSON escaping keeps newlines inside tokens from breaking SSE framing.
    return f'data: {json.dumps(payload)}\n\n'

@api_view(['POST'])
def chat(request):
    serializer = ChatSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': 'Send 1–20 messages with role user or assistant and non-empty text up to 4000 characters.', 'details': serializer.errors}, status=400)
    key = os.getenv('GROQ_API_KEY', '').strip()
    model = os.getenv('GROQ_MODEL', 'openai/gpt-oss-20b').strip() or 'openai/gpt-oss-20b'
    if not key or key == 'your_key_here':
        return Response({'error': 'The assistant is not configured yet. Add your Groq API key to backend/.env.'}, status=503)

    def tokens():
        # Context managers close provider connections on success, failure, or disconnect.
        try:
            with Groq(api_key=key, timeout=30.0, max_retries=0) as client:
                with client.chat.completions.create(
                    model=model,
                    messages=[{'role': 'system', 'content': SYSTEM_PROMPT}, *serializer.validated_data['messages']],
                    stream=True,
                    max_completion_tokens=1000,
                ) as stream:
                    for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            yield event({'content': chunk.choices[0].delta.content})
            yield event({'done': True})
        except RateLimitError:
            yield event({'error': 'The assistant is busy. Please wait a moment and retry.'})
        except AuthenticationError:
            yield event({'error': 'Groq rejected the API key. Check GROQ_API_KEY in backend/.env and restart Django.'})
        except NotFoundError:
            yield event({'error': 'The configured Groq model is unavailable to this account. Check model availability in Groq Console and set GROQ_MODEL in backend/.env, then restart Django.'})
        except APIConnectionError:
            yield event({'error': 'Django could not connect to Groq. Check the backend internet connection and retry.'})
        except Exception:
            # Never send exception text: provider errors can contain sensitive details.
            yield event({'error': 'The assistant could not finish its reply. Please try again.'})

    response = StreamingHttpResponse(tokens(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache, no-transform'
    response['X-Accel-Buffering'] = 'no'
    return response
