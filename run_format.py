import os

project_dir = os.path.dirname(os.path.realpath(__file__))
os.chdir(os.path.join(project_dir, 'shared'))
os.system('npm run format')
os.chdir(os.path.join(project_dir, 'backend'))
os.system('npm run format')
os.chdir(os.path.join(project_dir, 'frontend'))
os.system('npm run format')

