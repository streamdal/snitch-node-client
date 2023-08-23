import { ChannelCredentials } from "@grpc/grpc-js";
import { GrpcTransport } from "@protobuf-ts/grpc-transport";
import {
  Audience,
  OperationType,
} from "@streamdal/snitch-protos/protos/common.js";
import {
  IInternalClient,
  InternalClient,
} from "@streamdal/snitch-protos/protos/internal.client.js";

import { addAudience, addAudiences } from "./internal/audience.js";
import { heartbeat, HEARTBEAT_INTERVAL } from "./internal/heartbeat.js";
import { initPipelines } from "./internal/pipeline.js";
import {
  processPipeline as internalProcessPipeline,
  StepStatus,
} from "./internal/process.js";
import { internal, register } from "./internal/register.js";

export { Audience, OperationType };

export interface SnitchConfigs {
  snitchUrl?: string;
  snitchToken?: string;
  serviceName?: string;
  pipelineTimeout?: string;
  stepTimeout?: string;
  dryRun?: boolean;
  audiences?: Audience[];
}

export interface Configs {
  grpcClient: IInternalClient;
  snitchUrl: string;
  snitchToken: string;
  serviceName: string;
  pipelineTimeout: string;
  stepTimeout: string;
  dryRun: boolean;
  audiences?: Audience[];
}

export interface SnitchRequest {
  audience: Audience;
  data: Uint8Array;
}

export interface SnitchResponse {
  data: Uint8Array;
  error: boolean;
  message?: string;
  stepStatuses?: StepStatus[];
}

export class Snitch {
  private configs: Configs;
  private readonly transport: GrpcTransport;

  constructor({
    snitchUrl,
    snitchToken,
    serviceName,
    pipelineTimeout,
    stepTimeout,
    dryRun,
    audiences,
  }: SnitchConfigs) {
    if (process.env.NODE_ENV === "production") {
      console.debug = () => null;
    }

    const url = snitchUrl ? snitchUrl : process.env.SNITCH_URL;
    const token = snitchToken ? snitchToken : process.env.SNITCH_TOKEN;
    const name = serviceName ? serviceName : process.env.SNITCH_SERVICE_NAME;

    if (!url || !token || !name) {
      throw new Error(`Required configs are missing. You must provide configs snitchUrl, snitchToken and serviceName 
        either as constructor arguments to Snitch() or as environment variables in the form of SNITCH_URL, SNITCH_TOKEN and SNITCH_SERVICE_NAME`);
    }

    this.transport = new GrpcTransport({
      host: url,
      channelCredentials: ChannelCredentials.createInsecure(),
    });

    const grpcClient = new InternalClient(this.transport);

    this.configs = {
      grpcClient,
      snitchUrl: url,
      snitchToken: token,
      serviceName: name,
      pipelineTimeout:
        pipelineTimeout ?? process.env.SNITCH_PIPELINE_TIMEOUT ?? "100",
      stepTimeout: stepTimeout ?? process.env.SNITCH_STEP_TIMEOUT ?? "10",
      dryRun: dryRun ?? !!process.env.SNITCH_DRY_RUN,
      audiences,
    };

    setInterval(() => {
      void heartbeat(this.configs);
    }, HEARTBEAT_INTERVAL);

    void addAudiences(this.configs);
    void register(this.configs);
  }

  async processPipeline({
    audience,
    data,
  }: SnitchRequest): Promise<SnitchResponse> {
    if (!internal.pipelineInitialized) {
      await initPipelines(this.configs);
    }
    await addAudience({ configs: this.configs, audience });
    return internalProcessPipeline({ configs: this.configs, audience, data });
  }
}
