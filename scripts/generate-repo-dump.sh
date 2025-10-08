#!/bin/bash

OUTPUT_FILE="artifacts/full-repo-dump.txt"
REPO_DIR="/home/ubuntu/repos/immigrationflow"

cd "$REPO_DIR" || exit 1

> "$OUTPUT_FILE"

echo "==================================================" >> "$OUTPUT_FILE"
echo "FULL REPOSITORY DUMP" >> "$OUTPUT_FILE"
echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT_FILE"
echo "Repository: kiranvasudeva/immigrationflow" >> "$OUTPUT_FILE"
echo "==================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

process_file() {
    local filepath="$1"
    local relpath="${filepath#./}"
    
    case "$relpath" in
        *.png|*.jpg|*.jpeg|*.gif|*.pdf|*.ico|*.woff|*.woff2|*.ttf|*.eot|*.svg|*.mp4|*.webm|*.zip|*.tar.gz)
            echo "==== $relpath ====" >> "$OUTPUT_FILE"
            echo "(binary file skipped)" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            return
            ;;
    esac
    
    if [[ "$relpath" == "package-lock.json" ]]; then
        echo "==== $relpath ====" >> "$OUTPUT_FILE"
        echo "(skipped - too large)" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        return
    fi
    
    echo "==== $relpath ====" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    cat "$filepath" >> "$OUTPUT_FILE" 2>/dev/null || echo "(error reading file)" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

export -f process_file
export OUTPUT_FILE

(
    cd "$REPO_DIR"
    ls -R . | while read -r line; do
        [[ -z "$line" ]] && continue
        
        if [[ "$line" == *: ]]; then
            current_dir="${line%:}"
            current_dir="${current_dir#./}"
            continue
        fi
        
        [[ "$current_dir" == *"node_modules"* ]] && continue
        [[ "$current_dir" == *".git"* ]] && continue
        [[ "$current_dir" == *"dist"* ]] && continue
        [[ "$current_dir" == *"build"* ]] && continue
        [[ "$current_dir" == *".next"* ]] && continue
        [[ "$current_dir" == *"coverage"* ]] && continue
        [[ "$current_dir" == *"__pycache__"* ]] && continue
        
        filepath="${current_dir:+$current_dir/}$line"
        [[ -f "$filepath" ]] && process_file "$filepath"
    done
)

> "$OUTPUT_FILE"

echo "==================================================" >> "$OUTPUT_FILE"
echo "FULL REPOSITORY DUMP" >> "$OUTPUT_FILE"
echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT_FILE"
echo "Repository: kiranvasudeva/immigrationflow" >> "$OUTPUT_FILE"
echo "==================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

python3 << 'PYTHON_SCRIPT'
import os
import sys

repo_dir = "/home/ubuntu/repos/immigrationflow"
output_file = "artifacts/full-repo-dump.txt"

binary_extensions = {'.png', '.jpg', '.jpeg', '.gif', '.pdf', '.ico', 
                     '.woff', '.woff2', '.ttf', '.eot', '.svg', 
                     '.mp4', '.webm', '.zip', '.tar.gz', '.tgz'}

exclude_dirs = {'node_modules', '.git', 'dist', 'build', '.next', 
                'coverage', '__pycache__', '.pytest_cache'}

skip_files = {'package-lock.json', '.env'}

def should_skip_dir(dirpath):
    parts = dirpath.split(os.sep)
    return any(excluded in parts for excluded in exclude_dirs)

def is_binary(filepath):
    _, ext = os.path.splitext(filepath)
    return ext.lower() in binary_extensions

files_to_dump = []

for root, dirs, files in os.walk(repo_dir):
    if should_skip_dir(root):
        continue
    
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    
    for filename in sorted(files):
        filepath = os.path.join(root, filename)
        relpath = os.path.relpath(filepath, repo_dir)
        files_to_dump.append((filepath, relpath))

files_to_dump.sort(key=lambda x: x[1])

with open(os.path.join(repo_dir, output_file), 'a', encoding='utf-8') as out:
    for filepath, relpath in files_to_dump:
        out.write(f"==== {relpath} ====\n")
        
        if is_binary(filepath):
            out.write("(binary file skipped)\n\n")
            continue
        
        if os.path.basename(filepath) in skip_files:
            out.write("(skipped - too large)\n\n")
            continue
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                out.write("```\n")
                out.write(content)
                if not content.endswith('\n'):
                    out.write('\n')
                out.write("```\n\n")
        except Exception as e:
            out.write(f"(error reading file: {e})\n\n")

print(f"Repository dump complete: {len(files_to_dump)} files processed")
PYTHON_SCRIPT

echo "Repository dump created at $OUTPUT_FILE"
