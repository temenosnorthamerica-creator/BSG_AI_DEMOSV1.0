#!/usr/bin/env python3
import requests
import json

content = """Temenos provides a comprehensive integration architecture that supports modern, open standards for APIs, enabling seamless connectivity with external systems and compliance with industry regulations. The platform's RESTful APIs use JSON payloads and adhere to widely accepted standards such as OpenAPI specifications, ensuring clarity and ease of use for developers. Temenos APIs facilitate interoperability with various third-party systems including payment gateways and financial service providers, aligning with regulatory frameworks like PSD2 and initiatives such as the Berlin Group. This adherence ensures that banks can securely expose and consume APIs in a manner consistent with European and global open banking requirements.

By embracing open standards and protocols, Temenos ensures that banks can quickly and securely connect with the evolving ecosystem of financial services, fostering innovation and compliance without compromising operational integrity.

This open standard API approach empowers banks to innovate rapidly, comply with regulatory mandates like PSD2, and integrate effortlessly with diverse financial ecosystems. It reduces time-to-market for new services, enhances customer experience, and future-proofs banking operations in a competitive landscape."""

payload = {
    "cache_key": "open_standards_tooltip",
    "content": content,
    "content_type": "text",
    "metadata": {
        "source": "formatted",
        "category": "api_standards"
    }
}

response = requests.post(
    'http://localhost:8000/api/v1/cache/open_standards_tooltip',
    json=payload,
    headers={'Content-Type': 'application/json'}
)

print(response.json())
