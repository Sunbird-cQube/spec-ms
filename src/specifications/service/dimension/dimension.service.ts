import {GenericFunction} from './../genericFunction';
import {checkDimensionName, checkDuplicacy, checkName, createTable, insertDimensionSchema, insertPipeline, insertSchema} from '../../queries/queries';
import {DataSource} from 'typeorm';
import {InjectDataSource} from '@nestjs/typeorm';
import {dimensionSchemaData, masterSchema} from "../../../utils/spec-data";
import {dimensionResponse} from "../../dto/specData.dto";

export class DimensionService {
    constructor(@InjectDataSource() private dataSource: DataSource, private specService: GenericFunction) {
    }

    async createDimension(dimensionDTO) {
        const isValidSchema: any = await this.specService.ajvValidator(masterSchema, dimensionDTO);
        if (isValidSchema?.errors) {
            return {"code": 400, error: isValidSchema.errors}
        } else {
                let queryResult: any = checkDimensionName('name', "DimensionGrammar");
                queryResult = queryResult.replace('$1', `${dimensionDTO?.program}`);
                const resultDname = await this.dataSource.query(queryResult);
                if (resultDname?.length > 0) {
                    return {"code": 400, "error": "Dimension spec already exists"};
                }
                else {
                    const queryRunner = this.dataSource.createQueryRunner();
                        try {
                            await queryRunner.connect();
                            await queryRunner.startTransaction();
                            let insertQuery = insertDimensionSchema(['schema', '"dimensionType"', 'name', '"updatedAt"'], 'DimensionGrammar');
                            insertQuery = insertQuery.replace('$1', `'${JSON.stringify(dimensionDTO.input)}'`);
                            insertQuery = insertQuery.replace('$2', `'EXTERNAL'`);
                            insertQuery = insertQuery.replace('$3', `'${dimensionDTO.program}'`);
                            insertQuery = insertQuery.replace('$4', 'CURRENT_TIMESTAMP');
                            const insertResult = await queryRunner.query(insertQuery);
                            if (insertResult[0].id) {
                                    await queryRunner.commitTransaction();
                                    return {
                                        "code": 200,
                                        "message": "Dimension spec created successfully",
                                        "program": dimensionDTO?.program,
                                    };
                                
                            } else {
                                await queryRunner.rollbackTransaction();
                                return {"code": 400, "error": "Unable to insert into spec table"};
                            }
                        } catch (error) {
                            console.log(error)
                            await queryRunner.rollbackTransaction();
                            return {"code": 400, "error": "Something went wrong", "errObj": error}
                        }
                        finally {
                            await queryRunner.release();
                        }
                   
                }
        }
    }

    
}