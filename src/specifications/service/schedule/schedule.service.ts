import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { scheduleDto } from "../../dto/specData.dto";
import { scheduleSchema } from "../../../utils/spec-data";
import { DataSource } from "typeorm";
import { GenericFunction } from "../genericFunction";
import { HttpCustomService } from "../HttpCustomService";

let cronValidator = require("cron-expression-validator");

@Injectable()
export class ScheduleService {
  nifiUrl: string = `${process.env.NIFI_HOST}:${process.env.NIFI_PORT}`;

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private specService: GenericFunction,
    private http: HttpCustomService
  ) {}

  async scheduleProcessorGroup(scheduleData: scheduleDto) {
    let isValidSchema: any;
    isValidSchema = await this.specService.ajvValidator(
      scheduleSchema,
      scheduleData
    );
    if (isValidSchema.errors) {
      return { code: 400, error: isValidSchema.errors };
    } else {
      let result = cronValidator.isValidCronExpression(
        scheduleData.scheduled_at,
        { error: true }
      );
      if (result.errorMessage) {
        return { code: 400, error: result.errorMessage };
      } else {
        let result;
        if (
          scheduleData?.processor_group_name === "ingest_data" &&
          scheduleData?.program_name
        ) {
          result = await this.CreateSchedule(
            scheduleData?.processor_group_name,
            scheduleData.scheduled_at,
            scheduleData?.program_name
          );
        } else {
          if (scheduleData?.processor_group_name !== "ingest_data") {
            result = await this.CreateSchedule(
              scheduleData?.processor_group_name,
              scheduleData.scheduled_at
            );
          } else {
            return {
              code: 400,
              error:
                "program_name is missing for the processor group ingest_data",
            };
          }
        }

        if (result?.code === 200) {
          return { code: 200, message: "Successfully updated the schedule" };
        } else {
          return {
            code: 400,
            error: `${result.message} with name ${scheduleData.processor_group_name}`,
          };
        }
      }
    }
  }

  async CreateSchedule(processorGroupName, scheduledAt, program_name?: string) {
    const processorGroups = await this.getRootDetails();
    let pg_list = processorGroups.data;
    let counter = 0;
    let data = {};
    try {
      let pg_group = pg_list["processGroupFlow"]["flow"]["processGroups"];
      for (let pg of pg_group) {
        if (pg.component.name == processorGroupName) {
          let pg_source = pg;
          counter = counter + 1;
          data = {
            id: pg_source["component"]["id"],
            state: "STOPPED", // RUNNING or STOP
            disconnectedNodeAcknowledged: false,
          };
          await this.http.put(
            `${this.nifiUrl}/nifi-api/flow/process-groups/${pg_source["component"]["id"]}`,
            data
          );
          let prdata = await this.getProcessorGroupPorts(
            pg_source["component"]["id"]
          );
          let processor_id: any = "";
          if (prdata) {
            for (let processor of prdata["processGroupFlow"]["flow"][
              "processors"
            ]) {
              if (
                processor.component.name ==
                (await this.getProcessorName(processorGroupName))
              ) {
                processor_id = processor?.component?.id;
                break;
              }
            }
          }
          await this.http.post(
            `${this.nifiUrl}/nifi-api/processors/${processor_id}/state/clear-requests`,
            ""
          );
          return await this.updateProcessorProperty(
            pg_source["component"]["id"],
            processorGroupName,
            scheduledAt,
            program_name
          );
        }
      }
      return {
        code: 100,
        message: "Processor Group does not exists",
      };
    } catch (error) {
      return {
        code: 400,
        error: "Erroc occurred during the processor group property update",
      };
    }
  }

  async getRootDetails() {
    let res = await this.http.get(
      `${this.nifiUrl}/nifi-api/process-groups/root`
    );
    let nifi_root_pg_id = res.data["component"]["id"];
    let resp = await this.http.get(
      `${this.nifiUrl}/nifi-api/flow/process-groups/${nifi_root_pg_id}`
    );
    return resp;
  }

  async updateProcessorProperty(
    pg_source_id,
    processorGroupName,
    schedulePeriod,
    program_name
  ) {
    const pg_ports = await this.getProcessorGroupPorts(pg_source_id);
    let update_processor_property_body;
    let response;
    if (pg_ports) {
      let processors: any[] =
        pg_ports["processGroupFlow"]["flow"]["processors"];
      for (let [index, processor] of processors.entries()) {
        if (processor.component.name == "run_generic_yarn_cli") {
          console.log("inside of run yarn cli");
          update_processor_property_body = {
            component: {
              id: processor["component"]["id"],
              name: processor["component"]["name"],
              config: {
                autoTerminatedRelationships: ["original"],
                properties: {
                  "Command Arguments": `ingest_data.sh;${program_name}`,
                },
              },
              state: "STOPPED",
            },
            revision: {
              clientId: "",
              version: processor["revision"]["version"],
            },
            disconnectedNodeAcknowledged: "false",
          };
          await this.callApitoUpdateProcessorProperty(
            pg_source_id,
            processor["component"]["id"],
            update_processor_property_body,
            processorGroupName
          );
        }
        if (
          processor["component"]["name"] ==
          (await this.getProcessorName(processorGroupName))
        ) {
          update_processor_property_body = {
            component: {
              id: processor["component"]["id"],
              name: processor["component"]["name"],
              config: {
                schedulingPeriod: schedulePeriod,
                schedulingStrategy: "CRON_DRIVEN",
              },
              state: "STOPPED",
            },
            revision: {
              clientId: "",
              version: processor["revision"]["version"],
            },
            disconnectedNodeAcknowledged: "false",
          };
          response = await this.callApitoUpdateProcessorProperty(
            pg_source_id,
            processor["component"]["id"],
            update_processor_property_body,
            processorGroupName
          );
          if (processorGroupName !== "ingest_data") {
            let responseStateChange = await this.changeProcessorGroupState(
              pg_source_id,
              processorGroupName
            );
            return responseStateChange;
          }
        }
        if (
          index == processors.length - 1 &&
          processorGroupName == "ingest_data"
        ) {
          let res = await this.changeProcessorGroupState(
            pg_source_id,
            processorGroupName
          );
          return res;
        }
      }
    }
  }

  async callApitoUpdateProcessorProperty(
    pg_source_id,
    component_id,
    update_processor_property_body,
    processorGroupName
  ) {
    let url = `${this.nifiUrl}/nifi-api/processors/${component_id}`;
    try {
      let result = await this.http.put(url, update_processor_property_body);
      if (result) {
        return {
          code: 200,
          message: `Updated the properties in the ${processorGroupName}`,
        };
      } else {
        return {
          code: 100,
          message: `Failed to update the properties in the ${processorGroupName}`,
        };
      }
    } catch (error) {
      console.log("error occurred in call API to Update", error);
      return { code: 400, error: "Could not update the processor" };
    }
  }

  async changeProcessorGroupState(pg_source_id, processorGroupName) {
    try {
      let data = {
        id: pg_source_id,
        state: "RUNNING", // RUNNING or STOP
        disconnectedNodeAcknowledged: false,
      };
      const res = await this.http.put(
        `${this.nifiUrl}/nifi-api/flow/process-groups/${pg_source_id}`,
        data
      );
      return {
        code: 200,
        message: `Successfully updated the properties in the ${processorGroupName}`,
      };
    } catch (error) {
      return {
        code: 400,
        error: error,
      };
    }
  }

  async getProcessorGroupPorts(pg_source_id) {
    let url = `${this.nifiUrl}/nifi-api/flow/process-groups/${pg_source_id}`;
    try {
      let res = await this.http.get(url);
      if (res.data) {
        return res.data;
      }
    } catch (error) {
      return { code: 400, error: "could not get Processor Group Port" };
    }
  }

  async getProcessorName(processorGroupName) {
    switch (processorGroupName) {
      case "Run_adapters":
        return "GenerateFlowFile_adapter";
      case "ingest_dimension_grammar":
      case "ingest_dimension_data":
      case "ingest_all_grammars":
      case "ingest_programwise_data":
      case "ingest_dimension_data":
      case "ingest_data":
        return "ExecuteProcess";
      case "telemetry_data":
        return "GenerateFlowFile_telemetry";
      case "data_moving_local":
      case "school_Infrastructure_local":
      case "student_progression_local":
      case "school_attendance_local":
      case "student_assessment_local":
      case "pm_poshan_local":
      case "diksha_local":
      case "nas_local":
      case "udise_local":
      case "pgi_local":
      case "nishtha_local":
        return "Listlocal";
      case "data_moving_aws":
      case "onestep_dataingestion_aws":
        return "ListS3Files";
      case "onestep_dataingestion_local":
          return "Listlocal";
      case "onestep_dataingestion_oracle":
          return "GenerateFlowFile_oracle";
      case "data_moving_oracle":
      case "ingest_event_grammar":
        return "GenerateFlowFile_oracle";
      case "data_moving_azure":
      case "onestep_dataingestion_azure":
        return "ListAzure";
      case "school_Infrastructure_aws":
      case "student_progression_aws":
      case "student_assessment_aws":
      case "school_attendance_aws":
      case "diksha_aws":
      case "pm_poshan_aws":
      case "udise_aws":
      case "nas_aws":
      case "nishtha_aws":
      case "pgi_aws":
        return "ListS3Files";
      case "school_Infrastructure_oracle":
      case "student_progression_oracle":
      case "student_assessment_oracle":
      case "school_attendance_oracle":
      case "diksha_oracle":
      case "pm_poshan_oracle":
      case "udise_oracle":
      case "nas_oracle":
      case "nishtha_oracle":
      case "pgi_oracle":
        return "GenerateFlowFile_oracle"; 
      case 'Run Latest Code azure':
        return 'ListAzure';
      case 'Run Latest Code Oracle':
        return 'GenerateFlowFile_oracle';
      case 'Run Latest Code aws':
        return 'ListS3Files';
      case 'Run Latest Code local':
        return 'Listlocal';
      case "pm_poshan_azure":
      case "udise_azure":
      case "nas_azure":
        return "ListAzure";
      case "stop_processor":
        return "GenerateFlowFile_stop";
      default:
        return "default processor_group";
    }
  }
}
