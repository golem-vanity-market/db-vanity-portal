import os
import shutil

project_dir = os.path.dirname(os.path.realpath(__file__))
shutil.rmtree(os.path.join(project_dir, 'shared', "node_modules"), ignore_errors=True)
shutil.rmtree(os.path.join(project_dir, 'backend', "node_modules"), ignore_errors=True)
shutil.rmtree(os.path.join(project_dir, 'frontend', "node_modules"), ignore_errors=True)
