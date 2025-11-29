import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Mock models before importing MentionParser
sys.modules['app.models.meeting'] = MagicMock()
sys.modules['app.models.company_asset'] = MagicMock()
sys.modules['google'] = MagicMock()
sys.modules['google.generativeai'] = MagicMock()
sys.modules['ollama'] = MagicMock()
sys.modules['httpx'] = MagicMock()
# Mock llm_service to avoid importing it
sys.modules['app.services.llm_service'] = MagicMock()
sys.modules['pydantic_settings'] = MagicMock()
sys.modules['sqlalchemy'] = MagicMock()
sys.modules['sqlalchemy.orm'] = MagicMock()
sys.modules['app.database'] = MagicMock()
sys.modules['app.config'] = MagicMock()

# Now import MentionParser
# We need to adjust the import path because we are running from root or tests dir
# Assuming we run from project root
from app.services.mention_parser import MentionParser, mention_parser

class TestMentionParser(unittest.TestCase):
    def setUp(self):
        self.parser = MentionParser()
        self.db = MagicMock()
        self.meeting_id = 1
        self.company_id = 1

    def test_parse_mentions(self):
        text = "Check @img1 and @logo. Also @img2."
        mentions = self.parser.parse_mentions(text)
        self.assertEqual(mentions, ['img1', 'logo', 'img2'])

    @patch('os.path.exists')
    def test_resolve_meeting_images(self, mock_exists):
        mock_exists.return_value = True
        
        # Mock DB query for img1
        mock_image = MagicMock()
        mock_image.image_path = "/uploads/img1.jpg"
        
        # Setup query chain
        self.db.query.return_value.filter.return_value.first.return_value = mock_image
        
        paths, missing = self.parser.resolve_meeting_images(
            self.meeting_id, ['img1'], self.db
        )
        
        self.assertEqual(len(paths), 1)
        self.assertTrue(paths[0].endswith('uploads/img1.jpg'))
        self.assertEqual(missing, [])

    @patch('os.path.exists')
    def test_resolve_company_assets(self, mock_exists):
        mock_exists.return_value = True
        
        # Mock DB query for logo
        mock_asset = MagicMock()
        mock_asset.file_path = "/assets/logo.png"
        
        self.db.query.return_value.filter.return_value.first.return_value = mock_asset
        
        paths, missing = self.parser.resolve_company_assets(
            self.company_id, ['logo'], self.db
        )
        
        self.assertEqual(len(paths), 1)
        self.assertTrue(paths[0].endswith('assets/logo.png'))
        self.assertEqual(missing, [])

    @patch('os.path.exists')
    def test_resolve_all_mentions(self, mock_exists):
        mock_exists.return_value = True
        
        # We need to handle different queries for images and assets
        # This is complex to mock with a single chain, so we'll mock the resolve methods instead
        
        with patch.object(self.parser, 'resolve_meeting_images') as mock_resolve_imgs, \
             patch.object(self.parser, 'resolve_company_assets') as mock_resolve_assets:
            
            mock_resolve_imgs.return_value = (['/path/img1.jpg'], [])
            mock_resolve_assets.return_value = (['/path/logo.png'], [])
            
            paths, missing = self.parser.resolve_all_mentions(
                "Look at @img1 and @logo", 
                self.meeting_id, 
                self.company_id, 
                self.db
            )
            
            self.assertEqual(paths, ['/path/img1.jpg', '/path/logo.png'])
            self.assertEqual(missing, [])

if __name__ == '__main__':
    unittest.main()
