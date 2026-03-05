from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import platform

router = APIRouter(prefix="/system", tags=["system"])

class BrowseRequest(BaseModel):
    path: str | None = None

@router.post("/browse")
def browse_directory(req: BrowseRequest):
    """List directories in the given path to help user select target"""
    
    # Default to current working directory or C:/ / root
    start_path = req.path
    if not start_path or not os.path.exists(start_path):
        start_path = os.getcwd()
    
    try:
        # Get parent directory
        parent = os.path.dirname(start_path)
        
        entries = []
        # List only directories, ignore hidden ones usually
        with os.scandir(start_path) as it:
            for entry in it:
                if entry.is_dir() and not entry.name.startswith('.'):
                    entries.append(entry.name)
        
        entries.sort()
        
        return {
            "current_path": os.path.abspath(start_path),
            "parent_path": parent,
            "directories": entries,
            "is_windows": platform.system() == "Windows"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error browsing path: {str(e)}")

def get_drives_list():
    drives = []
    if platform.system() == "Windows":
        import string
        from ctypes import windll
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                drives.append(f"{letter}:\\")
            bitmask >>= 1
    else:
        drives = ["/"]
        
    return drives

@router.get("/drives")
def get_drives():
    """Get available drives (Windows only mainly)"""
    return {"drives": get_drives_list()}