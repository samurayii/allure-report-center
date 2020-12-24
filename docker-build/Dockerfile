FROM ubuntu:18.04

ARG ALLURE_RELEASE=2.8.0
ARG ALLURE_REPO=https://dl.bintray.com/qameta/maven/io/qameta/allure/allure-commandline

ENV APP_NAME "allure-report-center"

RUN apt-get update && \
    apt-get install -y curl bash unzip openjdk-8-jre && \
    curl -sL https://deb.nodesource.com/setup_12.x | bash && \
    apt-get install -y nodejs && \
    node -v && \
    curl ${ALLURE_REPO}/${ALLURE_RELEASE}/allure-commandline-${ALLURE_RELEASE}.zip -L -o /tmp/allure-commandline.zip && \
    unzip -q /tmp/allure-commandline.zip -d / && \
    apt-get remove -y unzip && \
    chmod -R +x /allure-${ALLURE_RELEASE}/bin && \
    ln -s /allure-${ALLURE_RELEASE}/bin/allure /usr/bin/allure && \
    allure --version && \
    rm -rf /tmp/* && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*  && \
    rm -f /var/cache/apt/archives/*.deb  && \
    rm -f var/cache/apt/archives/partial/*.deb  && \
    rm -f /var/cache/apt/*.bin

RUN curl -Lo /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 && \
    chmod 755 /usr/local/bin/dumb-init

COPY start.sh /start

RUN chmod +x /start

ENTRYPOINT ["/usr/local/bin/dumb-init", "--"]
CMD ["/bin/bash", "/start"]

COPY app /${APP_NAME}
COPY config.toml /${APP_NAME}/config.toml

RUN cd /${APP_NAME} && \
    npm install --only=production && \
    node app.js -v