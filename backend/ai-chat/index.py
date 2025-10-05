import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: ИИ-диалоги с людьми в доме (режим монстра)
    Args: event с httpMethod, body (npc_name, npc_context, player_message, suspicion_level)
    Returns: HTTP response с ответом NPC и изменением подозрений
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        import openai
    except ImportError:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OpenAI library not installed'})
        }
    
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'OPENAI_API_KEY not configured'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    npc_name = body_data.get('npc_name', 'Житель дома')
    npc_context = body_data.get('npc_context', '')
    player_message = body_data.get('player_message', '')
    suspicion_level = body_data.get('suspicion_level', 0)
    madness_level = body_data.get('madness_level', 0)
    
    openai.api_key = api_key
    
    system_prompt = f"""Ты — {npc_name}, обычный человек во время эпидемии паразитов.
Контекст: {npc_context}

ТВОЯ ЗАДАЧА: Реалистично отвечать на вопросы незнакомца, который пришёл в твой дом.

ПРАВИЛА:
1. Ты ОЧЕНЬ подозрительный (уровень подозрений: {suspicion_level}%)
2. Если подозрения > 50% — задаёшь провокационные вопросы
3. Если подозрения > 70% — угрожаешь оружием
4. Ты помнишь, как проверять заражённых: странные движения, холодная кожа, стеклянный взгляд
5. Отвечай КРАТКО (1-3 предложения), как живой человек
6. Используй русский язык, разговорный стиль
7. Если незнакомец ведёт себя странно — увеличивай подозрения

ПРИЗНАКИ СТРАННОГО ПОВЕДЕНИЯ:
- Нервозность, заикание
- Избегание прямых ответов
- Необычные фразы
- Агрессия или слишком дружелюбие
- Просьбы войти без объяснений

Отвечай как настоящий параноидальный выживальщик!"""

    user_prompt = f"Незнакомец говорит: \"{player_message}\"\n\nОтветь ему и оцени, насколько подозрительно его поведение (0-100)."
    
    try:
        response = openai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt}
            ],
            temperature=0.8,
            max_tokens=150
        )
        
        npc_reply = response.choices[0].message.content.strip()
        
        suspicion_keywords = ['странно', 'подозрительн', 'врёшь', 'не верю', 'пистолет', 'убью']
        suspicion_increase = 0
        
        for keyword in suspicion_keywords:
            if keyword in npc_reply.lower():
                suspicion_increase += 15
        
        if len(player_message) < 10:
            suspicion_increase += 10
        
        nervous_words = ['пожалуйста', 'умоляю', 'клянусь', 'честно', 'правда']
        for word in nervous_words:
            if word in player_message.lower():
                suspicion_increase += 5
        
        if madness_level > 50 and any(w in player_message.lower() for w in ['голоса', 'паразит', 'убить', 'кровь']):
            suspicion_increase += 30
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'npc_reply': npc_reply,
                'suspicion_increase': min(suspicion_increase, 50),
                'request_id': context.request_id
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'OpenAI API error: {str(e)}'})
        }
