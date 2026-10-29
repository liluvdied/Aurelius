# test installer for tools/prestamp.py: changes nothing (honours AUR_ROOT)
import os; os.chdir(os.environ.get("AUR_ROOT") or "."); print("noop install in", os.getcwd())
