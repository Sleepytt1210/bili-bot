FROM node:16.20.2

# Install and setup python# Update the package repositories and install necessary dependencies
RUN apt-get update && \
    apt-get install -y build-essential libssl-dev zlib1g-dev libbz2-dev \
                       libreadline-dev libsqlite3-dev wget curl llvm libncurses5-dev \
                       libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev \
                       python-openssl git

# Download and extract Python 3.10 source code
RUN mkdir /usr/src/python
RUN curl -L https://www.python.org/ftp/python/3.10.0/Python-3.10.0.tar.xz | tar xJ -C /usr/src/python --strip-components=1

# Compile and install Python 3.10
RUN cd /usr/src/python && \
    ./configure --enable-optimizations && \
    make -j $(nproc) && \
    make install && \
    rm -rf /usr/src/python


# Verify Python installation
RUN python3.10 --version
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

RUN npm install 

# Install TypeScript using npm
RUN npm install typescript

# Verify TypeScript installation
RUN node_modules/typescript/bin/tsc --version

COPY . .

RUN chown -R node /usr/src/app

USER node

CMD ["npm", "start"]
