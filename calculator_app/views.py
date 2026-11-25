import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from .models import Calculation


@ensure_csrf_cookie
def home(request):
    return render(request, 'index.html')


@require_POST
def save_calculation(request):
    try:
        data = json.loads(request.body)

        expression = str(data.get('expression', '')).strip()
        result = str(data.get('result', '')).strip()

        if not expression or not result:
            return JsonResponse(
                {'error': 'Missing calculation data'},
                status=400
            )

        Calculation.objects.create(
            expression=expression,
            result=result
        )

        return JsonResponse({'message': 'Calculation saved!'})

    except (json.JSONDecodeError, ValueError):
        return JsonResponse(
            {'error': 'Invalid data'},
            status=400
        )
def calculation_history(request):
    calculations = Calculation.objects.order_by('-created_at')[:10]

    history = [
        {
            'expression': item.expression,
            'result': item.result,
        }
        for item in calculations
    ]

    return JsonResponse({'history': history})


@require_POST
def clear_history(request):
    Calculation.objects.all().delete()
    return JsonResponse({
        'message': 'History cleared successfully!'
    })