FROM harbor.sensoro.com/library/node:10 AS dev
ADD package.json package-lock.json ./
RUN npm ci --dev
ADD . .
RUN npm run build

FROM harbor.sensoro.com/library/node:10
ADD package.json package-lock.json ./
RUN npm ci ${NPM_CI_OPTION}
COPY --from=dev /opt/app/dist  ./dist
COPY --from=dev /opt/app/config ./config
COPY --from=dev /opt/app/locales ./locales
CMD [ "node", "dist/main.js" ]
