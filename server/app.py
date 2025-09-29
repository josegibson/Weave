import os
import sys
import tempfile
import uuid
import logging
from flask import Flask, request, jsonify, send_from_directory, after_this_request
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

# In-memory store for file cleanup
cleanup_registry = {}

# List of allowed file extensions
ALLOWED_EXTENSIONS = {'ppt', 'pptx', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health_check():
    """A simple health check endpoint."""
    return jsonify({'status': 'ok'})

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
    if 'template' not in request.files:
        return jsonify({'error': 'No template file in the request'}), 400
    if 'data' not in request.files:
        return jsonify({'error': 'No Excel data file in the request'}), 400

    template_file = request.files['template']
    data_file = request.files['data']

    if template_file.filename == '' or data_file.filename == '':
        return jsonify({'error': 'File(s) not selected'}), 400
    if not template_file.filename.lower().endswith(('.pptx', '.ppt')):
        return jsonify({'error': 'Only PowerPoint files (.ppt, .pptx) are allowed as templates'}), 400
    if not data_file.filename.lower().endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Only Excel files (.xls, .xlsx) are allowed as data files'}), 400

    output_format = request.form.get('format', 'pptx').lower()
    if output_format not in ['pptx', 'pdf']:
        return jsonify({'error': 'Invalid output format. Must be pptx or pdf'}), 400

    template_filename = secure_filename(template_file.filename)
    base_name = os.path.splitext(template_filename)[0]
    unique_id = str(uuid.uuid4())[:8]

    template_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{base_name}_template_{unique_id}.pptx")
    data_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{base_name}_data_{unique_id}.xlsx")

    template_file.save(template_path)
    data_file.save(data_path)

    output_filename = f"{base_name}_processed_{unique_id}.{output_format}"
    output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)

    # Register files for cleanup
    cleanup_registry[output_filename] = [template_path, data_path, output_path]

    try:
        result = process_presentation(template_path, data_path, output_path, output_format)
        if "error" in result:
            return jsonify({'success': False, 'error': result["error"]}), 500
        return jsonify({
            'success': True,
            'message': 'File processed successfully',
            'output_filename': output_filename,
            'download_url': f'/api/download/{output_filename}'
        })
    except Exception as e:
        logger.error(f"Template processing failed: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': f'Template processing failed: {str(e)}'}), 500


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

def _cleanup_files(filename):
    """Internal function to clean up files associated with a given filename."""
    if filename in cleanup_registry:
        files_to_delete = cleanup_registry[filename]
        for file_path in files_to_delete:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Successfully deleted {file_path}")
            except Exception as e:
                logger.error(f"Error deleting file {file_path}: {str(e)}", exc_info=True)
        # Remove the entry from the registry
        del cleanup_registry[filename]

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    @after_this_request
    def cleanup(response):
        _cleanup_files(filename)
        return response
    return send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=True)




@app.route('/api/cleanup', methods=['DELETE'])
def cleanup_all_files():
    """Delete all generated files and clear the cleanup registry."""
    try:
        for filename in list(cleanup_registry.keys()):
            files_to_delete = cleanup_registry[filename]
            for file_path in files_to_delete:
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        logger.info(f"Successfully deleted {file_path}")
                except Exception as e:
                    logger.error(f"Error deleting file {file_path}: {str(e)}", exc_info=True)
            del cleanup_registry[filename]
        return jsonify({'success': True, 'message': 'All files cleaned up.'})
    except Exception as e:
        logger.error(f"Error cleaning up all files: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': f'Error cleaning up all files: {str(e)}'}), 500



# Add this route to serve static files from the root folder
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    root_dir = os.path.dirname(os.path.abspath(__file__))  # Get server directory
    project_root = os.path.dirname(root_dir)  # Go up one level to the project root
    
    if path != "" and os.path.exists(os.path.join(project_root, path)):
        return send_from_directory(project_root, path)
    else:
        return send_from_directory(project_root, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode) 