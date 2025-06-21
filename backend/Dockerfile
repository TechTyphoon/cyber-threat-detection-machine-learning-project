# Use a lightweight Python base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the Pipfile and Pipfile.lock into the container
COPY Pipfile Pipfile.lock /app/

# Install system dependencies and pipenv
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/* \
    && pip install pipenv

# Install Python dependencies via Pipenv
RUN pipenv install --deploy --ignore-pipfile

# Copy the application code into the container
COPY . /app/

# Expose the port Gunicorn will run on
EXPOSE 5002

# Command to run the application using Gunicorn
# predict:app assumes your Flask application instance is named 'app' in 'predict.py'
CMD ["pipenv", "run", "gunicorn", "--bind", "0.0.0.0:5002", "predict:app"]
