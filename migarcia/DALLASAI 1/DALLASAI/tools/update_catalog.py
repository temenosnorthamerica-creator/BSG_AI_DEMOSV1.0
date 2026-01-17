#!/usr/bin/env python3
import requests
import json

content = """Temenos' public API catalog is a comprehensive and standardized collection of out-of-the-box RESTful APIs designed to accelerate innovation and integration for banks and financial institutions.

These APIs cover a wide range of banking capabilities, enabling quick and seamless integration with internal systems, external partners, and fintech solutions. The catalog is accessible through the Temenos developer portal, where registered users can explore detailed API documentation, interact with endpoints, and generate developer keys to test APIs in a shared sandbox environment without any contractual commitment.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KEY CAPABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▸ Broad Coverage
   The APIs span 100% of the business areas within Temenos' core banking solution, supporting diverse banking functions such as payments, accounts, customer management, compliance, and more.

▸ API-First Architecture
   All significant product capabilities are exposed as standard, documented Open APIs, ensuring consistency and ease of use. This approach supports open banking strategies and regulatory compliance, including PSD2, with pre-defined APIs aligned to published specifications like Berlin Group and STET.

▸ RESTful Design
   The APIs follow a REST style compatible with modern web standards, using JSON payloads for data exchange and adhering to semantic versioning to maintain backward compatibility.

▸ Developer Support
   The catalog is supported by a growing developer community and Temenos experts, offering dedicated online resources, low-code integration tools, and interactive API endpoints to facilitate rapid development and deployment.

▸ Extensibility and Innovation
   Banks and fintechs can leverage the catalog to build innovative products and services on top of Temenos' open platform. Integration with Temenos Exchange further enriches offerings by incorporating new fintech technologies.

▸ Sandbox Environment
   The shared sandbox allows developers to experiment and validate integrations in a risk-free setting, accelerating proof-of-concept and development cycles.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUSINESS BENEFITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The public API catalog empowers banks to innovate rapidly, meet regulatory requirements, and seamlessly integrate with a broad ecosystem, all while benefiting from Temenos' cloud-native, cloud-agnostic, and event-driven architecture.

This capability significantly reduces time to market, enhances agility, and supports continuous innovation in a fast-evolving digital banking landscape."""

payload = {
    "cache_key": "public_catalog_tooltip",
    "content": content,
    "content_type": "text",
    "metadata": {
        "source": "formatted",
        "category": "api_catalog"
    }
}

response = requests.post(
    'http://localhost:8000/api/v1/cache/public_catalog_tooltip',
    json=payload,
    headers={'Content-Type': 'application/json'}
)

print(response.json())
