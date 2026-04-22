# Use the official Remotion image which includes Node, Chromium, and FFmpeg
FROM remotion/remotion:latest

# Switch to root to install system dependencies
USER root

# Install Python and system libraries required by OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set up a virtual environment for Python to avoid PEP 668 issues
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python packages
RUN pip3 install --no-cache-dir \
    opencv-python-headless \
    mediapipe \
    yt-dlp

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Create necessary directories and set permissions
RUN mkdir -p public/uploads public/templates public/huds bin \
    && chown -R remotion:remotion /app

# Switch back to the remotion user for security
USER remotion

# Expose the server port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]