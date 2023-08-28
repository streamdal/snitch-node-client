import { Audience } from "@streamdal/snitch-protos/protos/sp_common.js";

import { OperationType, Snitch, SnitchConfigs } from "../snitch.js";

const exampleData = {
  boolean_t: true,
  boolean_f: false,
  object: {
    ipv4_address: "127.0.0.1",
    ipv6_address: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    mac_address: "00-B0-D0-63-C2-26",
    uuid_dash: "550e8400-e29b-41d4-a716-446655440000",
    uuid_colon: "550e8400:e29b:41d4:a716:446655440000",
    uuid_stripped: "550e8400e29b41d4a716446655440000",
    number_as_string: "1234",
    field: "value",
    empty_string: "",
    null_field: null,
    empty_array: [],
  },
  array: ["value1", "value2"],
  number_int: 100,
  number_float: 100.1,
  timestamp_unix_str: "1614556800",
  timestamp_unix_num: 1614556800,
  timestamp_unix_nano_str: "1614556800000000000",
  timestamp_unix_nano_num: 1614556800000000000,
  timestamp_rfc3339: "2023-06-29T12:34:56Z",
};

const serviceAConfig: SnitchConfigs = {
  snitchUrl: "localhost:9091",
  snitchToken: "1234",
  serviceName: "test-service",
  pipelineTimeout: "100",
  stepTimeout: "10",
  dryRun: false,
};

const serviceBConfig: SnitchConfigs = {
  snitchUrl: "localhost:9091",
  snitchToken: "1234",
  serviceName: "another-test-service",
  pipelineTimeout: "100",
  stepTimeout: "10",
  dryRun: false,
};

const audienceAConsumer: Audience = {
  serviceName: "test-service",
  componentName: "kafka",
  operationType: OperationType.CONSUMER,
  operationName: "kafka-consumer",
};

const audienceAProducer: Audience = {
  serviceName: "test-service",
  componentName: "kafka",
  operationType: OperationType.PRODUCER,
  operationName: "kafka-producer",
};

const audienceBConsumer: Audience = {
  serviceName: "another-test-service",
  componentName: "another-kafka",
  operationType: OperationType.CONSUMER,
  operationName: "test-kafka-consumer",
};

const audienceBProducer: Audience = {
  serviceName: "another-test-service",
  componentName: "another-kafka",
  operationType: OperationType.PRODUCER,
  operationName: "test-kafka-producer",
};

const logTest = async (snitch: any, audience: Audience, input: any) => {
  console.log("--------------------------------");
  console.log(new Date());
  console.log(
    `sending pipeline request for ${audience.serviceName} - ${OperationType[
      audience.operationType
    ].toLowerCase()}`
  );
  const { error, message, data } = await snitch.processPipeline({
    audience: audience,
    data: new TextEncoder().encode(JSON.stringify(input)),
  });
  console.log("error", error);
  console.log("message", message);
  console.log("data:");
  console.dir(JSON.parse(new TextDecoder().decode(data)), { depth: 20 });
  console.log("pipeline request done");
  console.log("--------------------------------");
  console.log("\n");
};

export const example = async () => {
  const snitchA = new Snitch(serviceAConfig);
  const snitchB = new Snitch(serviceBConfig);

  setInterval(() => {
    void logTest(snitchA, audienceAConsumer, exampleData);
  }, 4000);

  await logTest(snitchA, audienceAProducer, exampleData);
  await logTest(snitchB, audienceBConsumer, exampleData);
  await logTest(snitchB, audienceBProducer, exampleData);
};

void example();