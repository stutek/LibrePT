import os
import shutil

def build():
    dist_dir = 'dist'
    if os.path.exists(dist_dir):
        shutil.rmtree(dist_dir)
    os.makedirs(dist_dir)
    
    files_to_copy = [
        'index.html',
        'index.css',
        'app.js',
        'mockData.js',
        'manifest.json',
        'sw.js'
    ]
    
    print("Building LibrePT bundle...")
    for f in files_to_copy:
        if os.path.exists(f):
            shutil.copy(f, dist_dir)
            print(f"  Copied {f} -> {dist_dir}/{f}")
        else:
            print(f"  Warning: {f} not found!")
    
    print("Build complete! Output directory: ./dist")

if __name__ == '__main__':
    build()
