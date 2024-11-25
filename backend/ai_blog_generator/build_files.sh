#!/bin/bash
echo "Building project..."
python3.9 -m pip install -r requirements.txt
python3.9 manage.py collectstatic --noinput
python3.9 manage.py migrate