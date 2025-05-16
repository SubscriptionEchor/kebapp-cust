import os
import re
import argparse
from datetime import datetime

def should_exclude(path, patterns):
    """
    Check if the path matches any of the exclude patterns
    """
    if not patterns:
        return False
    
    for pattern in patterns:
        if re.search(pattern, path):
            return True
    return False


def scan_files(directory, output_file, extensions=None, exclude_patterns=None):
    """
    Scan files in the given directory and write their contents to a single output file.
    
    Args:
        directory (str): Root directory to start scanning
        output_file (str): Path to the output file
        extensions (list): List of file extensions to include
        exclude_patterns (list): List of regex patterns for directories to exclude
    """
    if exclude_patterns is None:
        exclude_patterns = [
            r'(^|/)\.git($|/)',
            r'(^|/)__pycache__($|/)',
            r'(^|/)venv($|/)',
            r'(^|/)env($|/)',
            r'(^|/)tests($|/)',
            r'(^|/)deploy($|/)',
            r'(^|/)node_modules($|/)',
            r'(^|/)target($|/)'
        ]
    
    if extensions is None:
        extensions = [
            # Standard web and programming files
            '.txt', '.py', '.ts', '.js', '.html', '.css', '.md', '.tsx', '.jsx','.go', '.rs', '.toml',
            # Rust files
            '.rs', '.toml', 
            # Solidity files
            '.sol',
            # Anchor/Solana specific files
            '.ts', '.json', '.yaml', '.lock',
            # Configuration files
            '.config.js', '.config.ts'
        ]
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Write header with timestamp
        outfile.write(f"Project File Scan - Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        outfile.write("=" * 80 + "\n\n")
        
        # Initialize counters
        file_counts = {}
        total_files = 0
        
        for root, dirs, files in os.walk(directory):
            # Skip excluded directories using pattern matching
            if should_exclude(root, exclude_patterns):
                dirs[:] = []  # Skip all subdirectories
                continue
            
            for file in files:
                ext = os.path.splitext(file)[1]
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, directory)
                
                # Check if the file is Dockerfile or matches extensions
                if file == "Dockerfile" or any(file.endswith(ext) for ext in extensions):
                    # Skip if the file path matches any exclude pattern
                    if should_exclude(relative_path, exclude_patterns):
                        continue
                    
                    # Update counters
                    key = file if file == 'Dockerfile' else ext
                    file_counts[key] = file_counts.get(key, 0) + 1
                    total_files += 1
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            # Write file header
                            outfile.write(f"File: {relative_path}\n")
                            outfile.write(f"Type: {key}\n")
                            outfile.write("-" * 80 + "\n")
                            
                            # Write file contents
                            content = infile.read()
                            outfile.write(content)
                            
                            # Add spacing between files
                            outfile.write("\n\n" + "=" * 80 + "\n\n")
                    except Exception as e:
                        outfile.write(f"Error reading {relative_path}: {str(e)}\n\n")
        
        # Write summary at the end
        outfile.write("\nScan Summary\n")
        outfile.write("=" * 80 + "\n")
        outfile.write(f"Total files scanned: {total_files}\n\n")
        outfile.write("Files by type:\n")
        for key, count in sorted(file_counts.items()):
            outfile.write(f"{key}: {count} files\n")


def main():
    parser = argparse.ArgumentParser(description='Scan project files and combine them into a single reference file.')
    parser.add_argument('directory', help='Root directory to scan')
    parser.add_argument('--output', '-o', default='project_reference.txt',
                       help='Output file path (default: project_reference.txt)')
    parser.add_argument('--extensions', '-e', nargs='+',
                       help='File extensions to include (e.g., .rs .sol .py)')
    parser.add_argument('--exclude', '-x', nargs='+',
                       help='Directory patterns to exclude')
    
    args = parser.parse_args()
    
    extensions = args.extensions if args.extensions else None
    exclude_patterns = None
    if args.exclude:
        exclude_patterns = [f'(^|/){pattern}($|/)' for pattern in args.exclude]
    
    scan_files(args.directory, args.output, extensions, exclude_patterns)
    print(f"Scan complete. Reference file created at: {args.output}")


if __name__ == "__main__":
    main()
