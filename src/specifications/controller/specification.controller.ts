import {EventService} from './../service/event/event.service';
import {DimensionService} from './../service/dimension/dimension.service';
import {Body, Controller, Post, Res} from '@nestjs/common';
import {Response} from 'express';
import {pipelineDto, Result, specTrasformer} from '../dto/specData.dto';
import {TransformerService} from '../service/transformer/transformer.service';
import {DatasetService} from '../service/dataset/dataset.service';
import {PipelineService} from '../service/pipeline/pipeline.service';

@Controller('spec')
export class SpecificationController {
    constructor(private dimensionService: DimensionService, private EventService: EventService, private transformerservice: TransformerService, private datasetService: DatasetService, private pipelineService: PipelineService) {
    }

    @Post('/dimension')
    async getDimensions(@Body() dimensionDTO: any, @Res()response: Response) {
        try {
            let result = await this.dimensionService.createDimension(dimensionDTO);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            }
            else {
                response.status(200).send({
                    "message": result.message,
                    "dimension_name": result.dimension_name,
                    "pid": result.pid
                });
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    @Post('/event')
    async getEvents(@Body() eventDTO: any, @Res()response: Response) {
        try {
            let result = await this.EventService.createEvent(eventDTO);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            }
            else {
                response.status(200).send({
                    "message": result.message,
                    "event_name": result?.event_name,
                    "pid": result.pid
                });
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    @Post('/dataset')
    async getDataset(@Body() datasetDTO: any, @Res()response: Response) {
        try {
            let result = await this.datasetService.createDataset(datasetDTO);
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            }
            else {
                response.status(200).send({
                    "message": result.message,
                    "dataset_name": result?.dataset_name,
                    "pid": result.pid
                });
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    @Post('/transformer')
    async createTransformer(@Body() transformerDTO: specTrasformer, @Res()response: Response) {
        try {
            const result: any = await this.transformerservice.createTransformer(transformerDTO)
            if (result.code == 400) {
                response.status(400).send({"message": result.error});
            }
            else {
                response.status(200).send({"message": result.message, "response": result.response});
            }
        } catch (error) {
            console.error("create.Transformer impl :", error)
            throw new Error(error);
        }
    }

    @Post('/pipeline')
    async createPipeline(@Body() pipelineDto: pipelineDto, @Res()response: Response) {
        try {
            const result: Result = await this.pipelineService.createSpecPipeline(pipelineDto)
            console.log('result', result);
            if (result?.code == 400) {
                response.status(400).send({"message": result.error});
            }
            else {
                response.status(200).send({"message": result.message});
            }
        } catch (error) {
            console.error("create.Pipeline impl :", error)
        }
    }
}
