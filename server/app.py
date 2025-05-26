import os
import sys
import tempfile
import uuid
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import platform
from converters import BaseConverter
import json
from processing_engine import analyze_template, process_presentation

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure upload and output folders
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'converted')

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB limit

# List of allowed file extensions
ALLOWED_EXTENSIONS = {'ppt', 'pptx', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    # Check which converters are available
    converter_status = {}
    
    try:
        from converters import UnoApiConverter
        converter_status['uno_api'] = UnoApiConverter.is_available()
    except ImportError:
        converter_status['uno_api'] = False
    
    try:
        from converters import UnoconvConverter
        converter_status['unoconv'] = UnoconvConverter.is_available()
    except ImportError:
        converter_status['unoconv'] = False
    
    try:
        from converters import LibreOfficeConverter
        converter_status['libreoffice'] = LibreOfficeConverter.is_available()
    except ImportError:
        converter_status['libreoffice'] = False
    
    try:
        import comtypes.client
        converter_status['powerpoint'] = platform.system() == 'Windows'
    except ImportError:
        converter_status['powerpoint'] = False
    
    # Check processing engine dependencies
    processing_engine_available = True
    try:
        import openpyxl
        import pptx
    except ImportError:
        processing_engine_available = False
    
    return jsonify({
        'status': 'ok', 
        'platform': platform.system(),
        'converters': converter_status,
        'processing_engine_available': processing_engine_available
    })

@app.route('/api/analyse-template', methods=['POST'])
def analyse_template():
    # Check if file is in the request
    if 'file' not in request.files:
        return jsonify({'error': 'No template file in the request'}), 400
    
    template_file = request.files['file']
    
    # Check if a file was selected
    if template_file.filename == '':
        return jsonify({'error': 'No template file selected'}), 400
    
    # Check if the file is allowed
    if not template_file.filename.lower().endswith(('.pptx', '.ppt')):
        return jsonify({'error': 'Only PowerPoint files (.ppt, .pptx) are allowed as templates'}), 400
    
    # Generate a unique filename to avoid collisions
    original_filename = secure_filename(template_file.filename)
    base_name = os.path.splitext(original_filename)[0]
    unique_id = str(uuid.uuid4())[:8]
    unique_filename = f"{base_name}_{unique_id}.{original_filename.rsplit('.', 1)[1].lower()}"
    
    # Save the uploaded file
    template_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    template_file.save(template_path)
    
    try:
        # Analyze the template using the processing engine
        analysis_result = analyze_template(template_path)
        return jsonify({
            'success': True,
            **analysis_result
        })
        
    except Exception as e:
        logger.error(f"Template analysis failed: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': f'Template analysis failed: {str(e)}'}), 500
    
    finally:
        # Clean up the uploaded file
        try:
            if os.path.exists(template_path):
                os.remove(template_path)
        except Exception as e:
            logger.error(f"Failed to clean up uploaded file: {str(e)}")

@app.route('/api/process', methods=['POST'])
def process_template():
    # Check if files are in the request
    if 'template' not in request.files:
        return jsonify({'error': 'No template file in the request'}), 400
    
    if 'data' not in request.files:
        return jsonify({'error': 'No Excel data file in the request'}), 400
    
    template_file = request.files['template']
    data_file = request.files['data']
    
    # Check if files were selected
    if template_file.filename == '' or data_file.filename == '':
        return jsonify({'error': 'File(s) not selected'}), 400
    
    # Check if the template file is allowed
    if not template_file.filename.lower().endswith(('.pptx', '.ppt')):
        return jsonify({'error': 'Only PowerPoint files (.ppt, .pptx) are allowed as templates'}), 400
    
    # Check if the data file is allowed
    if not data_file.filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Only Excel files (.xls, .xlsx) are allowed as data files'}), 400
    
    # Get the requested output format (default to pptx)
    output_format = request.form.get('format', 'pptx').lower()
    if output_format not in ['pptx', 'pdf']:
        return jsonify({'error': 'Invalid output format. Must be pptx or pdf'}), 400
    
    # Generate unique filenames
    template_filename = secure_filename(template_file.filename)
    data_filename = secure_filename(data_file.filename)
    base_name = os.path.splitext(template_filename)[0]
    unique_id = str(uuid.uuid4())[:8]
    
    # Save the uploaded files
    template_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{base_name}_template_{unique_id}.pptx")
    data_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{base_name}_data_{unique_id}.xlsx")
    
    template_file.save(template_path)
    data_file.save(data_path)
    
    # Generate output filename and path
    output_filename = f"{base_name}_processed_{unique_id}.{output_format}"
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
    
    try:
        # Process the template with the data using the processing engine
        result = process_presentation(template_path, data_path, output_path, output_format)
        
        if "error" in result:
            return jsonify({'success': False, 'error': result["error"]}), 500
        
        # Return success with the path to download the file
        return jsonify({
            'success': True,
            'message': 'File processed successfully',
            'output_filename': output_filename,
            'download_url': f'/api/download/{output_filename}'
        })
        
    except Exception as e:
        logger.error(f"Template processing failed: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': f'Template processing failed: {str(e)}'}), 500
    
    finally:
        # Clean up the uploaded files
        try:
            if os.path.exists(template_path):
                os.remove(template_path)
            if os.path.exists(data_path):
                os.remove(data_path)
        except Exception as e:
            logger.error(f"Failed to clean up uploaded files: {str(e)}")

@app.route('/api/convert', methods=['POST'])
def convert_file():
    # Check if file is in the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    
    # Check if a file was selected
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check if the file is allowed
    if not allowed_file(file.filename):
        return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'}), 400
    
    # Generate a unique filename to avoid collisions
    original_filename = secure_filename(file.filename)
    base_name = os.path.splitext(original_filename)[0]
    unique_id = str(uuid.uuid4())[:8]
    unique_filename = f"{base_name}_{unique_id}.{original_filename.rsplit('.', 1)[1].lower()}"
    
    # Save the uploaded file
    input_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    file.save(input_path)
    
    # Generate output filename
    output_filename = f"{base_name}_{unique_id}.pdf"
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
    
    try:
        # Get appropriate converter based on the environment
        converter = BaseConverter.get_converter()
        
        if converter is None:
            return jsonify({
                'error': 'No suitable converter available. Please install Microsoft PowerPoint or LibreOffice.'
            }), 400
            
        logger.info(f"Using converter: {converter.__class__.__name__}")
            
        # Perform conversion
        converter.convert(input_path, app.config['OUTPUT_FOLDER'])
        
        # Check if conversion was successful
        if not os.path.exists(output_path):
            return jsonify({'error': 'Conversion failed'}), 500
        
        # Return success with the path to download the file
        return jsonify({
            'success': True,
            'message': 'File converted successfully',
            'output_filename': output_filename,
            'download_url': f'/api/download/{output_filename}'
        })
        
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}", exc_info=True)
        return jsonify({'error': f'Conversion failed: {str(e)}'}), 500
    
    finally:
        # Clean up the uploaded file
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
        except Exception as e:
            logger.error(f"Failed to clean up uploaded file: {str(e)}")

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode) 