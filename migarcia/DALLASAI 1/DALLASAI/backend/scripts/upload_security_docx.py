"""
Script to extract paragraphs from DOCX file and upload to MongoDB security_items collection.

Usage:
    python scripts/upload_security_docx.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
from docx import Document
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.utils.datetime_utils import utc_now


async def extract_paragraphs_from_docx(file_path: str) -> list[str]:
    """
    Extract paragraphs from a DOCX file.
    
    Args:
        file_path: Path to the DOCX file
        
    Returns:
        List of paragraph texts (non-empty paragraphs only)
    """
    print(f"Reading DOCX file: {file_path}")
    
    try:
        doc = Document(file_path)
        paragraphs = []
        
        for para in doc.paragraphs:
            text = para.text.strip()
            # Only include non-empty paragraphs
            if text:
                paragraphs.append(text)
        
        print(f"Extracted {len(paragraphs)} paragraphs from document")
        return paragraphs
        
    except Exception as e:
        print(f"Error reading DOCX file: {e}")
        raise


async def upload_paragraphs_to_mongodb(paragraphs: list[str], collection_name: str = "security_items"):
    """
    Upload paragraphs to MongoDB security_items collection.
    
    Args:
        paragraphs: List of paragraph texts
        collection_name: MongoDB collection name (default: security_items)
    """
    print(f"\nConnecting to MongoDB...")
    print(f"Database: {settings.DATABASE_NAME}")
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(
            settings.DATABASE_URL,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
        )
        
        # Test connection
        await client.admin.command('ping')
        print("[OK] MongoDB connection successful")
        
        # Get database
        db = client[settings.DATABASE_NAME]
        
        # Get collection
        collection = db[collection_name]
        
        # Check if collection exists, create if not
        collections = await db.list_collection_names()
        if collection_name not in collections:
            print(f"Collection '{collection_name}' does not exist. Creating...")
            await collection.insert_one({"_created": True})
            await collection.delete_one({"_created": True})
            print(f"[OK] Collection '{collection_name}' created")
        
        # Create index if it doesn't exist
        indexes = await collection.list_indexes().to_list(length=10)
        index_names = [idx['name'] for idx in indexes]
        if 'paragraph_number_1' not in index_names:
            try:
                await collection.create_index("paragraph_number", unique=True)
                print("[OK] Index created on 'paragraph_number'")
            except Exception as e:
                # Index creation might fail if collection has duplicate documents
                print(f"[WARNING] Could not create unique index: {e}")
                print("[INFO] Continuing without unique index constraint")
        
        # Upload paragraphs
        print(f"\nUploading {len(paragraphs)} paragraphs to MongoDB...")
        
        uploaded_count = 0
        skipped_count = 0
        error_count = 0
        
        for idx, paragraph_text in enumerate(paragraphs, start=1):
            try:
                # Check if paragraph already exists
                existing = await collection.find_one({"paragraph_number": idx})
                
                if existing:
                    # Update existing paragraph
                    result = await collection.update_one(
                        {"paragraph_number": idx},
                        {
                            "$set": {
                                "paragraph_content": paragraph_text,
                                "updated_at": utc_now()
                            }
                        }
                    )
                    if result.modified_count > 0:
                        print(f"  [UPDATE] Paragraph {idx}: Updated")
                        uploaded_count += 1
                    else:
                        print(f"  [SKIP] Paragraph {idx}: No changes")
                        skipped_count += 1
                else:
                    # Insert new paragraph
                    document = {
                        "paragraph_number": idx,
                        "paragraph_content": paragraph_text,
                        "created_at": utc_now(),
                        "updated_at": utc_now()
                    }
                    await collection.insert_one(document)
                    print(f"  [INSERT] Paragraph {idx}: Inserted ({len(paragraph_text)} chars)")
                    uploaded_count += 1
                    
            except Exception as e:
                print(f"  [ERROR] Paragraph {idx}: {e}")
                error_count += 1
        
        # Summary
        print(f"\n{'='*60}")
        print(f"Upload Summary:")
        print(f"  Total paragraphs: {len(paragraphs)}")
        print(f"  Uploaded/Updated: {uploaded_count}")
        print(f"  Skipped: {skipped_count}")
        print(f"  Errors: {error_count}")
        
        # Verify upload
        total_in_db = await collection.count_documents({})
        print(f"\nTotal documents in '{collection_name}' collection: {total_in_db}")
        
        client.close()
        print(f"\n[SUCCESS] Upload completed!")
        return True
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Error uploading to MongoDB: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Main function to process DOCX file and upload to MongoDB."""
    # File path
    docx_file = Path("/Users/sergeytovstogan/Documents_BSG/Temenos Security Framework Overview_ST_SEP-ORIGINAL 2025.docx")
    
    # Check if file exists
    if not docx_file.exists():
        print(f"[ERROR] File not found: {docx_file}")
        print(f"Please check the file path.")
        return False
    
    print("="*60)
    print("Security Document Upload Script")
    print("="*60)
    print(f"File: {docx_file.name}")
    print(f"Path: {docx_file}")
    print("="*60)
    
    # Extract paragraphs
    try:
        paragraphs = await extract_paragraphs_from_docx(str(docx_file))
        
        if not paragraphs:
            print("[WARNING] No paragraphs found in document!")
            return False
        
        # Show first few paragraphs as preview
        print(f"\nPreview of first 3 paragraphs:")
        for i, para in enumerate(paragraphs[:3], 1):
            preview = para[:100] + "..." if len(para) > 100 else para
            print(f"  Paragraph {i}: {preview}")
        
        # Confirm upload
        print(f"\nReady to upload {len(paragraphs)} paragraphs to MongoDB.")
        print(f"Collection: security_items")
        print(f"Database: {settings.DATABASE_NAME}")
        
        # Upload to MongoDB
        success = await upload_paragraphs_to_mongodb(paragraphs)
        
        return success
        
    except Exception as e:
        print(f"[ERROR] Error processing document: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

