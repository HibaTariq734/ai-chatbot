"""Mock the provider so validation and streaming tests never use a real key."""
from types import SimpleNamespace
from unittest.mock import patch
from django.test import SimpleTestCase
from rest_framework.test import APIClient
from groq import RateLimitError, AuthenticationError, NotFoundError, APIConnectionError
import httpx

class ChatTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    def post(self, payload):
        return self.client.post('/api/chat/', payload, format='json')

    def test_invalid_messages(self):
        for messages in [[], None, 'hello', [{}], [{'role': 'system', 'content': 'hi'}],
                         [{'role': 'user', 'content': ' '}], [{'role': 'user', 'content': 123}],
                         [{'role': 'user', 'content': 'a' * 4001}],
                         [{'role': 'user', 'content': 'hi'}] * 21]:
            with self.subTest(messages=str(messages)[:60]):
                self.assertEqual(self.post({'messages': messages}).status_code, 400)

    @patch.dict('os.environ', {'GROQ_API_KEY': ''})
    def test_missing_key(self):
        response = self.post({'messages': [{'role': 'user', 'content': 'hello'}]})
        self.assertEqual(response.status_code, 503)

    @patch.dict('os.environ', {'GROQ_API_KEY': 'test-secret', 'GROQ_MODEL': 'openai/gpt-oss-20b'})
    @patch('chat.views.Groq')
    def test_stream_and_system_prompt(self, groq):
        client = groq.return_value.__enter__.return_value
        stream = client.chat.completions.create.return_value.__enter__.return_value
        stream.__iter__.return_value = iter([SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content='Hello\nworld'))])])
        response = self.post({'messages': [{'role': 'user', 'content': 'hello'}]})
        frames = b''.join(response.streaming_content).decode()
        self.assertIn('Hello\\nworld', frames)
        self.assertIn('"done": true', frames)
        self.assertEqual(client.chat.completions.create.call_args.kwargs['messages'][0]['role'], 'system')
        self.assertEqual(client.chat.completions.create.call_args.kwargs['model'], 'openai/gpt-oss-20b')

    @patch.dict('os.environ', {'GROQ_API_KEY': 'test-secret'})
    @patch('chat.views.Groq')
    def test_provider_error_is_private(self, groq):
        groq.side_effect = RuntimeError('test-secret private stack trace')
        response = self.post({'messages': [{'role': 'user', 'content': 'hello'}]})
        frames = b''.join(response.streaming_content).decode()
        self.assertIn('"error"', frames)
        self.assertNotIn('test-secret', frames)

    @patch.dict('os.environ', {'GROQ_API_KEY': 'test-secret'})
    @patch('chat.views.Groq')
    def test_rate_limit(self, groq):
        groq.side_effect = RateLimitError('private', response=httpx.Response(429, request=httpx.Request('POST', 'https://example.com')), body=None)
        response = self.post({'messages': [{'role': 'user', 'content': 'hello'}]})
        self.assertIn('busy', b''.join(response.streaming_content).decode())

    def test_method_and_malformed_json(self):
        self.assertEqual(self.client.get('/api/chat/').status_code, 405)
        self.assertEqual(self.client.post('/api/chat/', '{', content_type='application/json').status_code, 400)

    def test_cors_preflight_for_local_frontends(self):
        for origin in ['http://localhost:5173', 'http://127.0.0.1:5173']:
            with self.subTest(origin=origin):
                response = self.client.options(
                    '/api/chat/', HTTP_ORIGIN=origin,
                    HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
                    HTTP_ACCESS_CONTROL_REQUEST_HEADERS='content-type',
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response['Access-Control-Allow-Origin'], origin)

    @patch.dict('os.environ', {'GROQ_API_KEY': 'test-secret'})
    @patch('chat.views.Groq')
    def test_provider_configuration_errors_are_actionable(self, groq):
        request = httpx.Request('POST', 'https://example.com')
        errors = [
            (AuthenticationError('private', response=httpx.Response(401, request=request), body=None), 'API key'),
            (NotFoundError('private', response=httpx.Response(404, request=request), body=None), 'model availability'),
            (APIConnectionError(request=request), 'internet connection'),
        ]
        for error, expected in errors:
            with self.subTest(error=type(error).__name__):
                groq.side_effect = error
                response = self.post({'messages': [{'role': 'user', 'content': 'hello'}]})
                frames = b''.join(response.streaming_content).decode()
                self.assertIn(expected, frames)
                self.assertNotIn('private', frames)
                self.assertNotIn('test-secret', frames)

    def test_cors_does_not_allow_unknown_origin(self):
        response = self.client.options(
            '/api/chat/', HTTP_ORIGIN='https://example.com',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
        )
        self.assertNotIn('Access-Control-Allow-Origin', response)
