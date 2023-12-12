import { HttpCustomService } from "./service/HttpCustomService";
import { EventService } from "./service/event/event.service";
import { Dimension } from "./../typeorm/dimension.entity";
import { Module } from "@nestjs/common";
import { SpecificationController } from "./controller/specification.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DimensionService } from "./service/dimension/dimension.service";
import { GenericFunction } from "./service/genericFunction";
import { TransformerService } from "./service/transformer/transformer.service";
import { DatasetService } from "./service/dataset/dataset.service";
import { HttpModule } from "@nestjs/axios";
import { PipelineService } from "../specifications/service/pipeline-old/pipeline.service";
import { ScheduleService } from "./service/schedule/schedule.service";
import { PipelineGenericService } from "./service/pipeline-generic/pipeline-generic.service";
import { ReadSchemaService } from "./service/read-schema/read-schema.service";
import { ProcessorGroupStateService } from "./service/processor-group-state/processor-group-state.service";

@Module({
  imports: [HttpModule],
  controllers: [SpecificationController],
  providers: [
    DimensionService,
    EventService,
    GenericFunction,
    TransformerService,
    DatasetService,
    PipelineService,
    HttpCustomService,
    ScheduleService,
    PipelineGenericService,
    ReadSchemaService,
    ProcessorGroupStateService
  ],
})
export class SpecificationsModule {}
