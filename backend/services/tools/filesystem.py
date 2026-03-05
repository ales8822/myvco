import os
import glob

class FileSystemTools:
    def __init__(self, root_path: str):
        self.root_path = os.path.abspath(root_path)

    def _is_safe_path(self, path: str) -> bool:
        """Security: Prevent agents from accessing files outside the root path"""
        abs_path = os.path.abspath(os.path.join(self.root_path, path))
        return abs_path.startswith(self.root_path)

    def list_files(self, directory: str = ".") -> str:
        """List files in a directory (recursive but filters out massive folders)"""
        if not self._is_safe_path(directory):
            return "Error: Access Denied. You are trying to access outside the target folder."

        target_dir = os.path.join(self.root_path, directory)
        if not os.path.exists(target_dir):
            return "Error: Directory does not exist."

        file_list = []
        ignore_dirs = {'.git', 'node_modules', '__pycache__', 'venv', 'dist', 'build'}
        
        for root, dirs, files in os.walk(target_dir):
            # Modify dirs in-place to skip ignored directories
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                # Get relative path for cleaner context
                rel_path = os.path.relpath(os.path.join(root, file), self.root_path)
                file_list.append(rel_path)
        
        if not file_list:
            return "Directory is empty."
            
        return "\n".join(file_list[:100]) # Limit to 100 files to save tokens

    def read_file(self, file_path: str) -> str:
        """Read the content of a file"""
        if not self._is_safe_path(file_path):
            return "Error: Access Denied."
            
        target_path = os.path.join(self.root_path, file_path)
        try:
            with open(target_path, 'r', encoding='utf-8') as f:
                content = f.read()
                return content
        except Exception as e:
            return f"Error reading file: {str(e)}"

    def write_file(self, file_path: str, content: str) -> str:
        """Write content to a file (Overwrites existing)"""
        if not self._is_safe_path(file_path):
            return "Error: Access Denied."
            
        target_path = os.path.join(self.root_path, file_path)
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return f"Successfully wrote to {file_path}"
        except Exception as e:
            return f"Error writing file: {str(e)}"