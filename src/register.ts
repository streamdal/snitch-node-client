import { client } from "./index.js";

export const serviceName = "snitch-node-client";

export const register = async () => {
  try {
    console.info(`### registering with grpc server...`);

    const call = client.register(
      { serviceName, dryRun: false, Metadata: {} },
      { meta: { "auth-token": "1234" } }
    );

    console.info(`### registered with grpc server`);

    const headers = await call.headers;
    console.info("got response headers: ", headers);

    for await (const response of call.responses) {
      console.info("got response message: ", response);
    }

    const status = await call.status;
    console.info("got status: ", status);

    const trailers = await call.trailers;
    console.info("got trailers: ", trailers);
  } catch (error) {
    console.error("Error registering with grpc server", error);
  }
};
