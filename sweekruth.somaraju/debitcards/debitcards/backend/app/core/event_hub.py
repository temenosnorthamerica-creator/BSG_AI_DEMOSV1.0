import json
import logging
from typing import Dict, Any, Optional
from azure.eventhub import EventHubProducerClient, EventData
from azure.eventhub.exceptions import EventHubError
from .config import settings

logger = logging.getLogger(__name__)


class EventHubPublisher:
    _instance: Optional["EventHubPublisher"] = None
    _producer: Optional[EventHubProducerClient] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._producer is None:
            try:
                self._producer = EventHubProducerClient.from_connection_string(
                    conn_str=settings.EVENT_HUB_CONNECTION_STRING,
                    eventhub_name=settings.EVENT_HUB_NAME
                )
                logger.info(f"Event Hub producer initialized for: {settings.EVENT_HUB_NAME}")
            except Exception as e:
                logger.error(f"Failed to initialize Event Hub producer: {e}")
                self._producer = None

    async def publish_event(self, event_data: Dict[str, Any]) -> bool:
        """Publish an event to Azure Event Hub."""
        if self._producer is None:
            logger.warning("Event Hub producer not initialized, skipping event publish")
            return False

        try:
            event_body = json.dumps(event_data)
            event = EventData(event_body)

            # Add properties for routing/filtering
            event.properties = {
                "eventType": event_data.get("eventType", "UNKNOWN"),
                "cardNumber": event_data.get("cardNumber", ""),
            }

            # Create batch and add event
            event_data_batch = await self._producer.create_batch()
            event_data_batch.add(event)

            # Send the batch
            await self._producer.send_batch(event_data_batch)

            logger.info(f"Event published successfully: {event_data.get('eventType')} - {event_data.get('eventId')}")
            return True

        except EventHubError as e:
            logger.error(f"Event Hub error: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to publish event: {e}")
            return False

    async def close(self):
        """Close the Event Hub producer."""
        if self._producer:
            await self._producer.close()
            logger.info("Event Hub producer closed")


# Global instance
event_hub_publisher = EventHubPublisher()
