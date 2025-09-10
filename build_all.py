import os

os.chdir("backend")

os.system('npm install')
os.system('npm run build')

os.chdir("../frontend")

os.system('npm install')
os.system('npm run build')
os.chdir("..")

print("Build process completed.")
