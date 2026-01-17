"""
Create Observability Content
Populates the MongoDB database with observability component content
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.adapters.database.mongodb_adapter import MongoDBAdapter
from datetime import datetime, timezone

# Observability content based on the instructions
OBSERVABILITY_CONTENT = [
    {
        "content_id": "obs-intro",
        "component_id": "observability",
        "type": "page",
        "order": 1,
        "page_name": "introduction",
        "title": "Understanding Observability",
        "body_json": {
            "subtitle": "In modern software systems, knowing what's happening isn't enough. You need to know why it's happening.",
            "story": {
                "heading": "A Story to Begin",
                "scenario": "Imagine: Some payments fail randomly.",
                "monitoring": "Monitoring tells you: 'something broke'",
                "observability": "Observability tells you: 'where and why'",
                "analogy": "This is the difference between knowing your car's dashboard light is on, and having the mechanic's toolkit to diagnose exactly what's wrong."
            }
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "content_id": "obs-big-picture",
        "component_id": "observability",
        "type": "page",
        "order": 2,
        "page_name": "big-picture",
        "title": "",  # NO TITLE per instructions
        "body_json": {
            "monitoring": {
                "question": "Is the system working?",
                "points": [
                    "Tracks predefined metrics",
                    "Alerts when thresholds are exceeded",
                    "Answers known questions",
                    "Like your car's dashboard light"
                ]
            },
            "observability": {
                "question": "Why is it not working?",
                "points": [
                    "Explores unknown problems",
                    "Provides deep context and insights",
                    "Answers questions you haven't thought of yet",
                    "Like the mechanic's toolkit"
                ]
            },
            "analogy": {
                "heading": "The Perfect Analogy",
                "dashboard": "Your dashboard light tells you something is wrong - but not what or why.",
                "toolkit": "A mechanic's toolkit lets you investigate, measure, and diagnose the root cause."
            }
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "content_id": "obs-pillars",
        "component_id": "observability",
        "type": "page",
        "order": 3,
        "page_name": "pillars",
        "title": "The Three Core Pillars",
        "body_json": {
            "subtitle": "Observability is built on three fundamental data types that work together to give you complete visibility into your systems.",
            "pillars": [
                {
                    "name": "Metrics",
                    "color": "red",
                    "description": "Quantitative measurements that tell you what's happening in your system",
                    "examples": [
                        "CPU usage",
                        "Memory consumption",
                        "Request latency",
                        "Throughput (requests/sec)",
                        "Error rates"
                    ],
                    "summary": "Think: Numbers and graphs over time"
                },
                {
                    "name": "Logs",
                    "color": "blue",
                    "description": "Detailed event records that help you troubleshoot issues and understand what happened",
                    "examples": [
                        "Error messages",
                        "Stack traces",
                        "User actions",
                        "System events",
                        "Debug information"
                    ],
                    "summary": "Think: Your application's diary"
                },
                {
                    "name": "Traces",
                    "color": "green",
                    "description": "End-to-end request flow that shows how requests move through distributed systems",
                    "examples": [
                        "Request journey across services",
                        "Timing of each step",
                        "Service dependencies",
                        "Bottleneck identification",
                        "Error propagation"
                    ],
                    "summary": "Think: GPS tracking for your data"
                }
            ],
            "together": {
                "heading": "How They Work Together",
                "steps": [
                    "Metrics alert you that response time increased by 300%",
                    "Traces show the slowdown is in the payment service",
                    "Logs reveal a database connection pool exhaustion error"
                ]
            }
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "content_id": "obs-stack",
        "component_id": "observability",
        "type": "page",
        "order": 4,
        "page_name": "stack",
        "title": "The Observability Stack",
        "body_json": {
            "subtitle": "Data flows through three main stages to give you complete visibility into your systems.",
            "tiers": [
                {
                    "name": "Collector",
                    "color": "purple",
                    "subheading": "Gather telemetry data",
                    "items": ["Metrics", "Logs", "Traces"],
                    "examples": ["OpenTelemetry", "Fluentd", "Telegraf"]
                },
                {
                    "name": "Storage",
                    "color": "blue",
                    "subheading": "Store and index data",
                    "items": [
                        "Time-series databases for metrics",
                        "Log aggregation systems",
                        "Trace storage backends"
                    ],
                    "examples": ["Prometheus", "Elasticsearch", "Tempo"]
                },
                {
                    "name": "Visualization",
                    "color": "pink",
                    "subheading": "Explore and analyze",
                    "items": [
                        "Interactive dashboards",
                        "Query interfaces",
                        "Alerting and notifications"
                    ],
                    "examples": ["Grafana", "Kibana", "Jaeger UI"]
                }
            ],
            "flow": {
                "heading": "Data Flow",
                "steps": [
                    "Your application emits metrics, logs, and traces as it runs",
                    "The collector gathers this telemetry data from multiple sources",
                    "Data is sent to storage systems optimized for each data type",
                    "Visualization tools query the storage and present insights through dashboards, graphs, and alerts"
                ]
            }
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    },
    {
        "content_id": "obs-temenos-stack",
        "component_id": "observability",
        "type": "page",
        "order": 5,
        "page_name": "temenos-stack",
        "title": "Temenos Telemetry Stack",
        "body_json": {
            "subtitle": "A modern observability architecture designed for Temenos products with integrated OpenTelemetry collectors and flexible visualization options.",
            "architecture": {
                "product_container": {
                    "name": "Temenos Product Container",
                    "color": "blue",
                    "components": [
                        {
                            "name": "TEMN Meter",
                            "library": "OTEL libraries",
                            "progress": 75
                        },
                        {
                            "name": "TEMN Tracer",
                            "library": "OTEL libraries",
                            "progress": 66
                        },
                        {
                            "name": "TEMN Logger",
                            "library": "Log4J",
                            "progress": 80
                        }
                    ],
                    "info": [
                        "Temenos products embed TEMN Monitor in their code",
                        "TEMN Monitor are wrapper of OTEL & Log4J libraries"
                    ]
                },
                "sidecar_container": {
                    "name": "Side-car Container",
                    "color": "purple",
                    "component": {
                        "name": "OTEL Collector",
                        "description": "Central data collection point"
                    },
                    "info": [
                        "Running OTEL Collector as side-car container simplifies network integration.",
                        "A standalone approach is also viable"
                    ]
                },
                "aggregation": {
                    "name": "Aggregation & Visualization",
                    "color": "green",
                    "tools": [
                        {"name": "Prometheus", "type": "Metrics", "color": "orange"},
                        {"name": "Jaeger", "type": "Traces", "color": "blue"},
                        {"name": "Elasticsearch", "type": "Logs", "color": "yellow"},
                        {"name": "Grafana", "type": "Dashboards", "color": "orange-600"}
                    ],
                    "info": [
                        "Aggregation and visualization layer can easily be integrated with multiple environments"
                    ]
                }
            },
            "features": [
                {
                    "title": "Embedded Monitoring",
                    "description": "TEMN Monitor is embedded directly in Temenos products"
                },
                {
                    "title": "Flexible Deployment",
                    "description": "Choose between side-car or standalone OTEL Collector"
                },
                {
                    "title": "Multi-Environment",
                    "description": "Integrates seamlessly across dev, staging, and production"
                }
            ],
            "flow": {
                "heading": "Architecture Flow",
                "steps": [
                    {
                        "color": "blue",
                        "text": "Temenos products use TEMN Monitor wrappers to emit telemetry data"
                    },
                    {
                        "color": "purple",
                        "text": "OTEL Collector gathers all telemetry data"
                    },
                    {
                        "color": "green",
                        "text": "Data is distributed to specialized backends"
                    },
                    {
                        "color": "orange",
                        "text": "Grafana provides unified dashboards"
                    }
                ]
            }
        },
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
]


async def main():
    """Create observability content in MongoDB"""
    print("=" * 60)
    print("Creating Observability Content")
    print("=" * 60)

    # Initialize MongoDB adapter
    adapter = MongoDBAdapter()

    try:
        # Connect to database
        print("\n1. Connecting to MongoDB...")
        await adapter.connect()
        print("   ✓ Connected successfully")

        # Get database (use private attributes as per adapter implementation)
        db = adapter._database

        # Clear existing observability content
        print("\n2. Clearing existing observability content...")
        result = await db.content.delete_many({"component_id": "observability"})
        print(f"   ✓ Deleted {result.deleted_count} existing documents")

        # Insert new content
        print("\n3. Inserting new observability content...")
        result = await db.content.insert_many(OBSERVABILITY_CONTENT)
        print(f"   ✓ Inserted {len(result.inserted_ids)} documents")

        # Verify content
        print("\n4. Verifying content...")
        count = await db.content.count_documents({"component_id": "observability"})
        print(f"   ✓ Found {count} observability content items")

        # Display content summary
        print("\n5. Content Summary:")
        print("   " + "-" * 56)
        # Find all documents without sort (Cosmos DB sorting may require index)
        cursor = db.content.find({"component_id": "observability"})
        docs = await cursor.to_list(length=None)
        # Sort in Python
        docs_sorted = sorted(docs, key=lambda x: x.get('order', 0))
        for doc in docs_sorted:
            print(f"   {doc['order']}. {doc['page_name']:20} - {doc['title'] or '(no title)'}")
        print("   " + "-" * 56)

        print("\n✅ Observability content created successfully!")
        print("\nYou can now view it at: http://localhost:3000/components/observability")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        # Disconnect
        await adapter.disconnect()
        print("\n6. Disconnected from MongoDB")


if __name__ == "__main__":
    asyncio.run(main())
