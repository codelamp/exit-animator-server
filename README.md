## Exit Animator Server

### Overview

This server is designed to supply the Exit Animator front-end with a place to permanently store its data.

### Stack

This server is powered by the combined efforts of Swagger, Mongoose, Mongo and Express.

- First the swagger is read, this leads to generating the routes.
- Then mongoose hooks in, generating the Schema and Models.
- Finally this is all routed together by Express directing requests back to the controllers.

Whilst the above is powered by contrib libraries, it is held together by my bespoke js.

## Useful Routes

### ./swagger-ui

This will expose an older version of Swagger UI. I need to get round to updating some of the dependencies.

### ./swagger

This will expose the swagger.yaml

### ./api

All model/controller routes are exposed under this url-space.

## Useful commands

To install:

    npm install

To configure, create a .env file in root with the following contents:

    MONGO_URI="mongodb://<user>:<pass>@<host>/<database>"

To launch:

    npm start

To test:

    npm test
