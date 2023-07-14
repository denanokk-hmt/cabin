FROM node:14.15.0
RUN useradd -ms /bin/bash dev

ENV HOME /home/dev
WORKDIR /home/dev

ENV NODE_ENV=prd
ARG COMMITID
ENV COMMITID ${COMMITID}
ARG SHA_COMMIT_ID
ENV SHA_COMMIT_ID ${SHA_COMMIT_ID}
ARG VERSION
ENV VERSION ###VERSION###
ARG DEPLOY_UNIXTIME
ENV DEPLOY_UNIXTIME ###DEPLOY_UNIXTIME###

ADD --chown=dev:dev . /home/dev/cabin

WORKDIR cabin
RUN npm install --production

USER dev
EXPOSE 8080
CMD ["node", "app.js"]
