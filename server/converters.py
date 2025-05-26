import os
import platform
import subprocess
import tempfile
import sys
import shutil
from abc import ABC, abstractmethod

class BaseConverter(ABC):
    """Abstract base class for converters."""
    
    @abstractmethod
    def convert(self, input_path, output_path):
        """Convert a file from input_path to output_path."""
        pass
    
    @classmethod
    def get_converter(cls):
        """Factory method to get appropriate converter based on environment."""
        # Try the UnoconvConverter first (Python wrapper for LibreOffice)
        try:
            if UnoconvConverter.is_available():
                return UnoconvConverter()
        except (ImportError, NameError):
            pass
        
        # Fall back to other converters
        system = platform.system()
        
        if system == 'Windows':
            try:
                # Try to import comtypes which is required for PowerPointConverter
                import comtypes.client
                return PowerPointConverter()
            except ImportError:
                if LibreOfficeConverter.is_available():
                    return LibreOfficeConverter()
                else:
                    return None
        else:
            # For non-Windows platforms, try LibreOffice
            if LibreOfficeConverter.is_available():
                return LibreOfficeConverter()
            else:
                return None


class PowerPointConverter(BaseConverter):
    """Converter using Microsoft PowerPoint (Windows-only)."""
    
    def convert(self, input_path, output_dir):
        """
        Convert PowerPoint to PDF using COM interface.
        
        Args:
            input_path: Path to the input PPTX/PPT file
            output_dir: Directory to save the output PDF
        
        Returns:
            Path to the output PDF file
        """
        import comtypes.client
        
        # Get the base name without extension
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{base_name}.pdf")
        
        # Create PowerPoint application
        powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
        powerpoint.Visible = False
        
        try:
            # Open the presentation
            presentation = powerpoint.Presentations.Open(os.path.abspath(input_path), WithWindow=False)
            
            # Save as PDF
            presentation.SaveAs(os.path.abspath(output_path), 32)  # 32 is the PDF format
            
            # Close the presentation
            presentation.Close()
            
            return output_path
            
        finally:
            # Quit PowerPoint
            powerpoint.Quit()


class LibreOfficeConverter(BaseConverter):
    """Converter using LibreOffice/OpenOffice."""
    
    @staticmethod
    def is_available():
        """Check if LibreOffice or OpenOffice is available."""
        try:
            # In Docker container, we know LibreOffice is installed
            if os.path.exists('/.dockerenv'):
                return True
                
            # Check for soffice command
            if platform.system() == 'Windows':
                # Common paths for LibreOffice on Windows
                paths = [
                    r"C:\Program Files\LibreOffice\program\soffice.exe",
                    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
                    r"C:\Program Files\OpenOffice\program\soffice.exe",
                    r"C:\Program Files (x86)\OpenOffice\program\soffice.exe"
                ]
                
                for path in paths:
                    if os.path.exists(path):
                        return True
                return False
            else:
                # For Linux/macOS, try to find soffice in PATH
                result = subprocess.run(['which', 'soffice'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                return result.returncode == 0
        except Exception:
            return False
    
    def convert(self, input_path, output_dir):
        """
        Convert PowerPoint to PDF using LibreOffice.
        
        Args:
            input_path: Path to the input PPTX/PPT file
            output_dir: Directory to save the output PDF
        
        Returns:
            Path to the output PDF file
        """
        # Get the absolute paths
        input_abs_path = os.path.abspath(input_path)
        output_abs_dir = os.path.abspath(output_dir)
        
        # Get base filename without extension
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{base_name}.pdf")
        
        # In Docker, always use the standard Linux path
        if os.path.exists('/.dockerenv'):
            cmd = ['soffice']
        else:
            # Prepare the LibreOffice command
            if platform.system() == 'Windows':
                # Find LibreOffice on Windows
                libreoffice_paths = [
                    r"C:\Program Files\LibreOffice\program\soffice.exe",
                    r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
                    r"C:\Program Files\OpenOffice\program\soffice.exe",
                    r"C:\Program Files (x86)\OpenOffice\program\soffice.exe"
                ]
                
                soffice_path = next((path for path in libreoffice_paths if os.path.exists(path)), None)
                
                if not soffice_path:
                    raise FileNotFoundError("LibreOffice/OpenOffice not found")
                    
                cmd = [soffice_path]
            else:
                # For Linux/macOS
                cmd = ['soffice']
        
        # Common arguments for all platforms
        cmd.extend([
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', output_abs_dir,
            input_abs_path
        ])
        
        # Execute the command
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"LibreOffice conversion failed: {stderr.decode('utf-8')}")
        
        # Check if the output file exists
        if not os.path.exists(output_path):
            raise FileNotFoundError(f"Output PDF file not found at {output_path}")
            
        return output_path


class UnoconvConverter(BaseConverter):
    """Converter using unoconv Python wrapper for LibreOffice."""
    
    @staticmethod
    def is_available():
        """Check if unoconv is available."""
        try:
            import unoconv
            return True
        except ImportError:
            return False
    
    def convert(self, input_path, output_dir):
        """
        Convert PowerPoint to PDF using unoconv.
        
        Args:
            input_path: Path to the input PPTX/PPT file
            output_dir: Directory to save the output PDF
        
        Returns:
            Path to the output PDF file
        """
        import unoconv
        
        # Get the base name without extension
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        output_path = os.path.join(output_dir, f"{base_name}.pdf")
        
        # Convert to absolute paths
        input_abs_path = os.path.abspath(input_path)
        output_abs_path = os.path.abspath(output_path)
        
        try:
            # Convert document to PDF
            unoconv.convert(input_abs_path, output_abs_path, format='pdf')
            
            # Check if the output file exists
            if not os.path.exists(output_path):
                raise FileNotFoundError(f"Output PDF file not found at {output_path}")
                
            return output_path
        except Exception as e:
            raise Exception(f"Unoconv conversion failed: {str(e)}") 