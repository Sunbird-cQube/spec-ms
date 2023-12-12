import { Injectable } from "@nestjs/common";
import { ScheduleService } from "../schedule/schedule.service";
import { HttpCustomService } from "../HttpCustomService";
import { ProcessorDto } from "src/specifications/dto/specData.dto";
import { GenericFunction } from "../genericFunction";

@Injectable()
export class ProcessorGroupStateService {
  scheduleSchema = {
    type: "object",
    properties: {
      processor_group_name: {
        type: "string",
        shouldnotnull: true,
      },
      state: {
        type: "string",
        shouldnotnull: true,
        enum: ["RUNNING", "STOPPED"],
      },
    },
    required: ["processor_group_name", "state"],
  };
  nifiUrl: string = `${process.env.NIFI_HOST}:${process.env.NIFI_PORT}`;
  constructor(
    private scheduleService: ScheduleService,
    private http: HttpCustomService,
    private specService: GenericFunction
  ) {}
  async changeProcessorGroupState(inputProcessorData: ProcessorDto) {
    let isValidSchema: any;
    isValidSchema = await this.specService.ajvValidator(
      this.scheduleSchema,
      inputProcessorData
    );
    if (isValidSchema.errors) {
      return { code: 400, error: isValidSchema.errors };
    } else {
      try {
        const processorGroups = await this.scheduleService.getRootDetails();
        let pg_list = processorGroups.data;
        let processorGroupName = inputProcessorData.processor_group_name;
        let counter = 0;
        let data = {};
        let pg_group = pg_list["processGroupFlow"]["flow"]["processGroups"];
        for (let pg of pg_group) {
          if (pg.component.name == processorGroupName) {
            let pg_source = pg;
            counter = counter + 1;
            data = {
              id: pg_source["component"]["id"],
              state: inputProcessorData.state, // RUNNING or STOP
              disconnectedNodeAcknowledged: false,
            };
            const result = await this.http.put(
              `${this.nifiUrl}/nifi-api/flow/process-groups/${pg_source["component"]["id"]}`,
              data
            );
            console.log("the result is:",result.data);
            return {code: 200,message:`changed the state of ${processorGroupName}`}
          }
        }
        return {code:400,error:"Could not find the processor group"}
      } catch (error) {
        return {code:400,error:error?.message}

      }
    }
  }
}
