import sys
import os
from sqlalchemy.orm import Session
from pathlib import Path

# Add backend to path and change cwd
os.chdir(os.path.join(os.getcwd(), "backend"))
sys.path.append(os.getcwd())

from app.database import SessionLocal, engine
from app.models.library import LibraryItem
from app.models.staff import Staff
from app.services.llm_service import llm_service

def test_library_and_staff_split():
    db = SessionLocal()
    try:
        # 1. Create a Knowledge Base item
        kb_slug = "test_kb_module"
        kb_content = "This is factual knowledge about the test system."
        kb_item = db.query(LibraryItem).filter(LibraryItem.slug == kb_slug).first()
        if not kb_item:
            kb_item = LibraryItem(
                slug=kb_slug,
                name="Test KB Module",
                content=kb_content,
                category="knowledge"
            )
            db.add(kb_item)
            db.commit()
            db.refresh(kb_item)
        print(f"Verified KB Item: {kb_item.slug}, Category: {kb_item.category}")

        # 2. Create a Manifesto item
        mf_slug = "test_mf_module"
        mf_content = "Always speak in a very formal tone."
        mf_item = db.query(LibraryItem).filter(LibraryItem.slug == mf_slug).first()
        if not mf_item:
            mf_item = LibraryItem(
                slug=mf_slug,
                name="Test Manifesto Module",
                content=mf_content,
                category="manifesto"
            )
            db.add(mf_item)
            db.commit()
            db.refresh(mf_item)
        print(f"Verified Manifesto Item: {mf_item.slug}, Category: {mf_item.category}")

        # 3. Create a Staff member with Knowledge Base referencing KB item
        staff_name = "Verification Agent"
        staff = db.query(Staff).filter(Staff.name == staff_name).first()
        if not staff:
            staff = Staff(
                name=staff_name,
                role="Verification Officer",
                personality="Diligent and precise.",
                expertise=["Testing", "Verification"],
                system_prompt=f"Follow this: @{mf_slug}",
                knowledge_base=f"Use this data: @{kb_slug}"
            )
            db.add(staff)
            db.commit()
            db.refresh(staff)
        print(f"Verified Staff: {staff.name}, KB: {staff.knowledge_base}")

        # 4. Resolve dependencies and check prompt blocks
        blocks = llm_service.build_structured_prompt_blocks(
            staff_name=staff.name,
            role=staff.role,
            personality=staff.personality,
            expertise=staff.expertise,
            company_context="",
            meeting_context="",
            company_name="TestCo",
            company_description="Testing automation",
            system_prompt=staff.system_prompt,
            knowledge_base=staff.knowledge_base,
            db=db
        )

        # Check if @ mentions were resolved in the blocks
        found_kb = False
        found_mf = False
        for block in blocks:
            if block['id'] == 'knowledge_base' and kb_content in block['content']:
                found_kb = True
            if block['id'] == 'staff_personal' and mf_content in block['content']:
                found_mf = True
        
        if found_kb and found_mf:
            print("SUCCESS: Both Manifesto and Knowledge Base mentions were correctly resolved into prompt blocks.")
        else:
            print(f"FAILURE: KB resolved: {found_kb}, MF resolved: {found_mf}")
            for block in blocks:
                print(f"Block {block['id']}: {block['content'][:100]}...")

    finally:
        db.close()

if __name__ == "__main__":
    test_library_and_staff_split()
