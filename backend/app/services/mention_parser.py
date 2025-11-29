# backend\app\services\mention_parser.py
import re
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from ..models.meeting import MeetingImage
from ..models.company_asset import CompanyAsset
import os


class MentionParser:
    """Service for parsing and resolving @mentions in messages"""
    
    # Regex patterns for @mentions
    # Matches @img1, @img2, etc. OR @custom_name (alphanumeric + underscore)
    MENTION_PATTERN = re.compile(r'@(img\d+|[a-z_][a-z0-9_]*)', re.IGNORECASE)
    
    def parse_mentions(self, text: str) -> List[str]:
        """
        Extract all @mentions from text
        
        Args:
            text: The message text to parse
            
        Returns:
            List of mention strings (e.g., ['img1', 'logo', 'img2'])
        """
        matches = self.MENTION_PATTERN.findall(text)
        # Remove duplicates while preserving order
        seen = set()
        unique_mentions = []
        for mention in matches:
            mention_lower = mention.lower()
            if mention_lower not in seen:
                seen.add(mention_lower)
                unique_mentions.append(mention_lower)
        return unique_mentions
    
    def resolve_meeting_images(
        self, 
        meeting_id: int, 
        mentions: List[str], 
        db: Session
    ) -> Tuple[List[str], List[str]]:
        """
        Resolve @img mentions to file paths
        
        Args:
            meeting_id: ID of the meeting
            mentions: List of mention strings
            db: Database session
            
        Returns:
            Tuple of (resolved_paths, missing_mentions)
        """
        resolved_paths = []
        missing_mentions = []
        
        # Calculate absolute path to backend root
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        for mention in mentions:
            # Check if it's an @img mention (e.g., img1, img2)
            if mention.startswith('img'):
                try:
                    # Extract the number
                    img_num = int(mention[3:])
                    
                    # Query for the image with this display_order
                    image = db.query(MeetingImage)\
                        .filter(
                            MeetingImage.meeting_id == meeting_id,
                            MeetingImage.display_order == img_num
                        )\
                        .first()
                    
                    if image:
                        # Convert relative path to absolute
                        raw_path = image.image_path.replace("\\", "/")
                        if raw_path.startswith("/"): 
                            raw_path = raw_path[1:]
                        
                        abs_path = os.path.join(BASE_DIR, raw_path)
                        
                        if os.path.exists(abs_path):
                            resolved_paths.append(abs_path)
                        else:
                            print(f"WARNING: Image file not found: {abs_path}")
                            missing_mentions.append(f"@{mention}")
                    else:
                        missing_mentions.append(f"@{mention}")
                        
                except (ValueError, IndexError):
                    # Not a valid img number
                    missing_mentions.append(f"@{mention}")
        
        return resolved_paths, missing_mentions
    
    def resolve_company_assets(
        self, 
        company_id: int, 
        mentions: List[str], 
        db: Session
    ) -> Tuple[List[str], List[str]]:
        """
        Resolve company asset mentions to file paths
        
        Args:
            company_id: ID of the company
            mentions: List of mention strings
            db: Database session
            
        Returns:
            Tuple of (resolved_paths, missing_mentions)
        """
        resolved_paths = []
        missing_mentions = []
        
        # Calculate absolute path to backend root
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        for mention in mentions:
            # Skip @img mentions (those are handled by resolve_meeting_images)
            if mention.startswith('img'):
                continue
            
            # Query for asset with this name
            asset = db.query(CompanyAsset)\
                .filter(
                    CompanyAsset.company_id == company_id,
                    CompanyAsset.asset_name == mention
                )\
                .first()
            
            if asset:
                # Convert relative path to absolute
                raw_path = asset.file_path.replace("\\", "/")
                if raw_path.startswith("/"): 
                    raw_path = raw_path[1:]
                
                abs_path = os.path.join(BASE_DIR, raw_path)
                
                if os.path.exists(abs_path):
                    resolved_paths.append(abs_path)
                else:
                    print(f"WARNING: Asset file not found: {abs_path}")
                    missing_mentions.append(f"@{mention}")
            else:
                missing_mentions.append(f"@{mention}")
        
        return resolved_paths, missing_mentions
    
    def resolve_all_mentions(
        self, 
        text: str, 
        meeting_id: int, 
        company_id: int, 
        db: Session
    ) -> Tuple[List[str], List[str]]:
        """
        Parse message text and resolve all @mentions to file paths
        
        Args:
            text: The message text
            meeting_id: ID of the meeting
            company_id: ID of the company
            db: Database session
            
        Returns:
            Tuple of (all_resolved_paths, all_missing_mentions)
        """
        # Extract all mentions from text
        mentions = self.parse_mentions(text)
        
        if not mentions:
            return [], []
        
        all_paths = []
        all_missing = []
        
        # Resolve meeting images
        img_paths, img_missing = self.resolve_meeting_images(meeting_id, mentions, db)
        all_paths.extend(img_paths)
        all_missing.extend(img_missing)
        
        # Resolve company assets
        asset_paths, asset_missing = self.resolve_company_assets(company_id, mentions, db)
        all_paths.extend(asset_paths)
        all_missing.extend(asset_missing)
        
        return all_paths, all_missing


# Singleton instance
mention_parser = MentionParser()
