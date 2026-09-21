import asyncio
from app.workers.celery_app import celery_app
from app.services.deep_research import deep_research_service
from app.services.media_generator import media_generator_service

@celery_app.task(name="tasks.async_deep_research")
def async_deep_research_task(query: str, depth_level: str = "deep"):
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(
        deep_research_service.run_deep_research(query=query, depth_level=depth_level)
    )
    return result

@celery_app.task(name="tasks.async_generate_video")
def async_generate_video_task(prompt: str, model: str = "wan-2.1", duration: int = 5):
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    result = loop.run_until_complete(
        media_generator_service.generate_video(prompt=prompt, model=model, duration_seconds=duration)
    )
    return result
